import puppeteer, { type Browser, type Page } from 'puppeteer'
import type { SiteCrawler, CrawlResult } from './base'

export class TechnolifeCrawler implements SiteCrawler {
  private browser: Browser | null = null

  async crawl(url: string): Promise<CrawlResult> {
    try {
      // Launch browser if not already launched
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
          ],
          timeout: 60000,
        })
      }

      const page = await this.browser.newPage()

      // Set default navigation timeout
      page.setDefaultNavigationTimeout(60000)
      page.setDefaultTimeout(60000)

      // Set user agent to mimic a real browser
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      // Navigate to the product page
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      })

      // Wait a bit for dynamic content to load
      await new Promise((resolve) => setTimeout(resolve, 3000))

      let price: number | null = null
      const priceSelectors = [
        // Main product price on PDP - specific selectors from HTML structure
        '.flex.w-full.justify-end.px-4.pb-4.pt-5 .text-\\[19px\\].font-semiBold', // Specific selector from provided HTML
        '.flex.w-full.justify-end.px-4.pb-4.pt-5 .text-\\[22px\\].font-semiBold', // Another variation
        '.flex.w-full.flex-row-reverse.flex-wrap .text-\\[19px\\]', // General price in main section
        '.flex.w-full.flex-row-reverse.flex-wrap .text-\\[22px\\]', // General price in main section
        // Fallback selectors for main product price area
        '.flex.w-full.justify-end [class*="text-"]', // Any text in the main price container
        '.flex.w-full.flex-row-reverse [class*="text-"]', // Any text in flex container
        // Generic fallbacks (but prioritize main product price, not seller prices)
        '.price-value',
        '[data-price]',
        '.product-price',
        '.current-price',
        '.final-price',
      ]

      // Try to find price using CSS selectors
      for (const selector of priceSelectors) {
        try {
          // Try to wait for selector, but don't fail if not found
          try {
            await page.waitForSelector(selector, {
              timeout: 5000,
            })
          } catch {
            // Selector not found, try next one
            continue
          }

          // Try to get the first matching element (main product price, not seller prices)
          try {
            const priceText = await page.$eval(selector, (el) => el.textContent)

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

            // If we found multiple prices, use the first/main product price (not necessarily the lowest)
            // For Technolife, we want the main product price, not seller prices
            if (foundPrices.length > 0) {
              // Use the first price found (main product price), not the lowest
              price = foundPrices[0]
            }
          }
        } catch {
          // Fallback failed
        }
      }

      await page.close()

      if (price === null) {
        return {
          success: false,
          price: null,
          error: 'Could not find price on page',
        }
      }

      return {
        success: true,
        price,
      }
    } catch (error) {
      return {
        success: false,
        price: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

