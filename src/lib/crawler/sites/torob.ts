import puppeteer, { type Browser, type Page } from 'puppeteer'
import type { SiteCrawler, CrawlResult } from './base'

export class TorobCrawler implements SiteCrawler {
  private browser: Browser | null = null
  private pagePool: Page[] = []
  private readonly MAX_PAGES = 5

  async getPage(): Promise<Page> {
    // Clean up closed pages from pool
    while (this.pagePool.length > 0) {
      const page = this.pagePool.pop()!
      try {
        // Check if page is still open by accessing a property
        if (!page.isClosed()) {
          return page
        }
      } catch {
        // Page is closed or invalid, continue to next
      }
    }

    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          // Remove '--disable-images' as it's not a valid flag
          '--disable-plugins',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--disable-breakpad',
          '--disable-component-extensions-with-background-pages',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--no-first-run',
          '--no-default-browser-check',
          '--no-pings',
          '--no-zygote',
          // Note: --single-process can cause issues with page reuse, removed for stability
        ],
        timeout: 20000, // Reduced from 30000
      })
    }

    const page = await this.browser.newPage()

    // Enable request interception to block images, stylesheets, fonts, etc.
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      const resourceType = request.resourceType()
      // Block images, stylesheets, fonts, and media to speed up crawling
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort()
      } else {
        request.continue()
      }
    })

    // Configure once on creation (reduced timeouts for faster crawling)
    page.setDefaultNavigationTimeout(20000) // Reduced from 30000
    page.setDefaultTimeout(20000) // Reduced from 30000
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    return page
  }

  async releasePage(page: Page): Promise<void> {
    try {
      // Check if page is still open before trying to reuse
      if (page.isClosed()) {
        return // Page already closed, don't add to pool
      }

      // Clear page state
      await page.goto('about:blank', { waitUntil: 'domcontentloaded' }).catch(() => {})

      // Double-check page is still open after navigation
      if (page.isClosed()) {
        return // Page closed during navigation
      }

      // Return to pool if under max
      if (this.pagePool.length < this.MAX_PAGES) {
        this.pagePool.push(page)
      } else {
        await page.close()
      }
    } catch (error) {
      // Page is broken, close it
      await page.close().catch(() => {})
    }
  }

  async crawl(url: string): Promise<CrawlResult> {
    let page: Page | null = null
    try {
      page = await this.getPage()

      // Navigate to the product page
      try {
        // Check if page is still valid before navigation
        if (page.isClosed()) {
          // Page was closed, get a new one
          page = await this.getPage()
        }
        
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 20000, // Reduced from 30000
        })
      } catch (navError) {
        const errorMsg = navError instanceof Error ? navError.message : String(navError)
        console.error(`[TorobCrawler] Navigation failed for ${url}:`, errorMsg)
        
        // If page is closed or target error, get a new page and retry once
        if (errorMsg.includes('Target closed') || errorMsg.includes('Protocol error')) {
          try {
            if (page && !page.isClosed()) {
              await this.releasePage(page)
            }
            page = await this.getPage()
            await page.goto(url, {
              waitUntil: 'domcontentloaded',
              timeout: 20000, // Reduced from 30000
            })
          } catch (retryError) {
            throw retryError
          }
        } else {
          throw navError
        }
      }

      // Wait for dynamic content to load (reduced from 3000ms to 2000ms)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Wait for price element to load
      // Torob.com typically shows prices in various formats
      // Common selectors for price on Torob:
      // - Price in product detail page
      // - Price in comparison view
      // We'll try multiple selectors

      let price: number | null = null
      const priceSelectors = [
        // Torob.com specific selectors based on actual page structure
        // Online sellers price (cheapest/first one)
        'a.price.seller-element',
        '.jsx-2036301941.price',
        'a.jsx-2036301941.price',
        // Offline/in-store sellers price
        '.inStoreSellerCard_price__Q3_cf',
        // Fallback selectors
        '[data-price]',
        '.price',
        '.product-price',
        '.price-value',
        '.product-price-value',
        '[class*="price"]',
        '[class*="Price"]',
      ]

      // First, try to get the cheapest price (first online seller price)
      // Torob.com shows prices in order, with cheapest first
      for (const selector of priceSelectors) {
        try {
          // Try to wait for selector, but don't fail if not found
          try {
            await page.waitForSelector(selector, {
              timeout: 3000, // Reduced from 5000
            })
          } catch {
            // Selector not found, try next one
            continue
          }

          // Try to get all matching elements and check each one
          const elements = await page.$$(selector)
          
          const foundPrices: number[] = []
          
          for (const element of elements) {
            try {
              const priceText = await page.evaluate((el) => el.textContent, element)

              if (priceText) {
                // Extract numeric value from price text
                // Handle Persian/Arabic numerals and remove currency symbols
                // Prices are in format: ۱۷۹٫۹۹۹٫۰۰۰ تومان or 179,999,000 تومان
                let cleanedPrice = priceText
                  .replace(/[^\d.,\u0660-\u0669\u06F0-\u06F9]/g, '') // Keep digits, dots, commas, and Persian/Arabic numerals
                  .replace(/,/g, '')
                  .trim()

                // Convert Persian/Arabic numerals to Western numerals if needed
                const persianToEnglish: { [key: string]: string } = {
                  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
                  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
                  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
                  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
                }
                
                cleanedPrice = cleanedPrice.replace(/[۰-۹٠-٩]/g, (char) => persianToEnglish[char] || char)
                
                // Remove dots that are used as thousands separators in Persian format
                // But keep decimal points if any
                const parts = cleanedPrice.split('.')
                if (parts.length > 1) {
                  // If last part is 3 digits, it's likely thousands separator, not decimal
                  if (parts[parts.length - 1].length === 3) {
                    cleanedPrice = parts.join('')
                  } else {
                    // Otherwise keep first part as integer
                    cleanedPrice = parts[0]
                  }
                }

                const parsedPrice = parseFloat(cleanedPrice)
                // Check if it's a reasonable price (between 1000 and 1 billion)
                if (!isNaN(parsedPrice) && parsedPrice >= 1000 && parsedPrice <= 1000000000) {
                  foundPrices.push(parsedPrice)
                }
              }
            } catch {
              continue
            }
          }

          // If we found prices, use the cheapest one (first in list, as Torob shows cheapest first)
          if (foundPrices.length > 0) {
            foundPrices.sort((a, b) => a - b)
            price = foundPrices[0] // Cheapest price
            break
          }
        } catch {
          // Continue to next selector
          continue
        }
      }

      // If no price found with selectors, try to find any number that looks like a price
      if (!price) {
        try {
          const bodyText = await page.evaluate(() => document.body.textContent)
          if (bodyText) {
            // Look for price patterns like: 1,234,567 تومان or 1234567 تومان
            const pricePatterns = [
              /(\d{1,3}(?:[,\s]\d{3})*(?:[,\s]\d{3})*)\s*تومان/gi,
              /(\d{1,3}(?:[,\s]\d{3})*(?:[,\s]\d{3})*)\s*ريال/gi,
              /قیمت[:\s]*(\d{1,3}(?:[,\s]\d{3})*(?:[,\s]\d{3})*)/gi,
              // More patterns
              /قیمت\s*:?\s*(\d{1,3}(?:[,\s]\d{3})*(?:[,\s]\d{3})*)/gi,
              /(\d{1,3}(?:[,\s]\d{3})*(?:[,\s]\d{3})*)\s*ت\.?و\.?م\.?ان/gi,
            ]

            const foundPrices: number[] = []

            for (const pattern of pricePatterns) {
              const matches = bodyText.match(pattern)
              if (matches && matches.length > 0) {
                for (const match of matches) {
                  const cleanedPrice = match
                    .replace(/[^\d.,]/g, '')
                    .replace(/,/g, '')
                    .trim()

                  const parsedPrice = parseFloat(cleanedPrice)
                  // Only accept reasonable prices
                  if (!isNaN(parsedPrice) && parsedPrice >= 1000 && parsedPrice <= 1000000000) {
                    foundPrices.push(parsedPrice)
                  }
                }
              }
            }

            // If we found multiple prices, use the most common one or the first reasonable one
            if (foundPrices.length > 0) {
              // Sort and take the median or first
              foundPrices.sort((a, b) => a - b)
              price = foundPrices[Math.floor(foundPrices.length / 2)]
            }
          }
        } catch {
          // Fallback failed
        }
      }

      if (price === null) {
        if (page) await this.releasePage(page)
        return {
          success: false,
          price: null,
          error: 'Could not find price on page',
        }
      }

      if (page) await this.releasePage(page)

      return {
        success: true,
        price,
      }
    } catch (error) {
      if (page) await this.releasePage(page)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error(`[TorobCrawler] Crawl error for ${url}:`, errorMessage)
      return {
        success: false,
        price: null,
        error: errorMessage,
      }
    }
  }

  async close(): Promise<void> {
    // Close all pages in pool
    for (const page of this.pagePool) {
      await page.close().catch(() => {})
    }
    this.pagePool = []

    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

