import puppeteer, { type Browser, type Page } from 'puppeteer'
import type { SiteCrawler, CrawlResult } from './base'

export class YaranCrawler implements SiteCrawler {
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
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
        console.error(`[YaranCrawler] Navigation failed for ${url}:`, errorMsg)

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

      // --- Check if product is available ---
      let available = false
      try {
        available = await page.$eval('.product-availability span.text-blue', (el) => !!el)
      } catch {
        // Element not found, treat as unavailable
        available = false
      }

      if (!available) {
        if (page) await this.releasePage(page)
        return {
          success: false,
          price: null,
          error: 'Product unavailable',
        }
      }

      let price: number | null = null
      const priceSelectors = [
        // Main product price on PDP - specific selectors from HTML structure
        '.product-price-wrap .product-price span.ng-binding', // Specific selector from provided HTML
        '.product-price-wrap span.ng-binding',
        'h5.product-price span.ng-binding',
        '.product-price span[ng-bind]',
        '.product-price-wrap span',
        '#product-price',
      ]

      // Try to find price using CSS selectors
      for (const selector of priceSelectors) {
        try {
          // Try to wait for selector, but don't fail if not found
          try {
            await page.waitForSelector(selector, {
              timeout: 4000, // Reduced from 5000
            })
          } catch {
            // Selector not found, try next one
            continue
          }

          // Try to get the first matching element (main product price, not seller prices)
          try {
            // const priceText = await page.$eval(selector, (el) => el.textContent)
            const priceText = await page.$eval(selector, (el) => {
              // Ignore if inside alternative product section
              if (
                el.closest('#index-products-carousel') ||
                el.closest('h2#محصولاتی که مشاهده کرده اید')
              )
                return null
              return el.textContent
            })
            if (!priceText) continue

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
                '۰': '0',
                '۱': '1',
                '۲': '2',
                '۳': '3',
                '۴': '4',
                '۵': '5',
                '۶': '6',
                '۷': '7',
                '۸': '8',
                '۹': '9',
                '٠': '0',
                '١': '1',
                '٢': '2',
                '٣': '3',
                '٤': '4',
                '٥': '5',
                '٦': '6',
                '٧': '7',
                '٨': '8',
                '٩': '9',
              }

              cleanedPrice = cleanedPrice.replace(
                /[۰-۹٠-٩]/g,
                (char) => persianToEnglish[char] || char,
              )

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
                price = parsedPrice // Use the first/main product price found
                break
              }
            }
          } catch {
            // Element evaluation failed, try next selector
            continue
          }
        } catch {
          // Continue to next selector
          continue
        }
      }

      if (price === null) {
        if (page) await this.releasePage(page)
        return {
          success: false,
          price: null,
          error: 'Product not available',
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
      console.error(`[YaranCrawler] Crawl error for ${url}:`, errorMessage)
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
