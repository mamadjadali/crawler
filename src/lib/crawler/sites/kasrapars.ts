import puppeteer, { type Browser, type Page } from 'puppeteer'
import type { SiteCrawler, CrawlResult } from './base'

export class KasraParsCrawler implements SiteCrawler {
  private browser: Browser | null = null

  async crawl(url: string): Promise<CrawlResult> {
    let page: Page | null = null
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

      page = await this.browser.newPage()

      // Set default navigation timeout
      page.setDefaultNavigationTimeout(60000)
      page.setDefaultTimeout(60000)

      // Set user agent to mimic a real browser
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      // Navigate to the product page
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 60000,
      })

      // Wait a bit for dynamic content to load
      await new Promise((resolve) => setTimeout(resolve, 5000))

      // Helper function to parse price text
      const parsePrice = (priceText: string): number | null => {
        if (!priceText) return null

        // Extract numeric value from price text
        // Handle Persian/Arabic numerals and remove currency symbols
        // Prices are in format: 22,450,000 or ۲۲,۴۵۰,۰۰۰
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
          (char) => persianToEnglish[char] || char
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
        if (
          !isNaN(parsedPrice) &&
          parsedPrice >= 1000 &&
          parsedPrice <= 1000000000
        ) {
          return parsedPrice
        }
        return null
      }

      const foundPrices: number[] = []

      // Strategy 0: Direct extraction using page.evaluate - most reliable
      try {
        const directPrices = await page.evaluate(() => {
          const prices: number[] = []
          
          // Helper to parse price text
          const parsePriceText = (text: string): number | null => {
            if (!text) return null
            
            // Clean and convert Persian numerals
            let cleaned = text
              .replace(/[^\d.,\u0660-\u0669\u06F0-\u06F9]/g, '')
              .replace(/,/g, '')
              .trim()
            
            // Convert Persian/Arabic numerals
            const persianToEnglish: { [key: string]: string } = {
              '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
              '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
              '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
              '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
            }
            
            cleaned = cleaned.replace(/[۰-۹٠-٩]/g, (char) => persianToEnglish[char] || char)
            
            // Handle dots (thousands separators)
            const parts = cleaned.split('.')
            if (parts.length > 1 && parts[parts.length - 1].length === 3) {
              cleaned = parts.join('')
            } else if (parts.length > 1) {
              cleaned = parts[0]
            }
            
            const parsed = parseFloat(cleaned)
            if (!isNaN(parsed) && parsed >= 1000 && parsed <= 1000000000) {
              return parsed
            }
            return null
          }
          
          // Find all spans and check their text content
          const allSpans = document.querySelectorAll('span')
          for (const span of allSpans) {
            const text = span.textContent?.trim() || ''
            
            // Check if text looks like a price (only digits, commas, spaces)
            if (/^[\d,\s\u0660-\u0669\u06F0-\u06F9]+$/.test(text) && text.length >= 6) {
              const price = parsePriceText(text)
              if (price !== null) {
                prices.push(price)
              }
            }
          }
          
          return prices
        })
        
        foundPrices.push(...directPrices)
      } catch {
        // Continue to other strategies
      }

      // Strategy 1: Extract price from "از" (from) section - this is typically the lowest price
      // Look for sections with "t-row" class containing "از" text
      try {
        // Wait for price range section to appear
        try {
          await page.waitForSelector('section[class*="t-row"]', {
            timeout: 5000,
          })
        } catch {
          // Continue anyway
        }

        const priceRangeSections = await page.$$('section[class*="t-row"]')
        for (const section of priceRangeSections) {
          const sectionText = await page.evaluate(
            (el) => el.textContent || '',
            section
          )
          if (sectionText.includes('از')) {
            // Find all spans within this section, including nested ones
            const spans = await section.$$('span')
            for (const span of spans) {
              const spanText = await page.evaluate(
                (el) => {
                  // Get direct text content (not from children)
                  let text = ''
                  for (const node of el.childNodes) {
                    if (node.nodeType === 3) {
                      // Text node
                      text += node.textContent || ''
                    }
                  }
                  return text.trim()
                },
                span
              )
              
              // Also try full text content if direct text is empty
              const fullText = spanText || (await page.evaluate(
                (el) => el.textContent?.trim() || '',
                span
              ))
              
              // Check if span contains only price-like numbers (no text, just digits and commas)
              // Prices are typically 6+ digits
              if (
                /^[\d,\s\u0660-\u0669\u06F0-\u06F9]+$/.test(fullText) &&
                fullText.length >= 6
              ) {
                const price = parsePrice(fullText)
                if (price !== null) {
                  foundPrices.push(price)
                }
              }
            }
          }
        }
      } catch {
        // Continue to next strategy
      }

      // Strategy 2: Extract all prices from seller/variant sections
      // Look for spans with classes that typically contain prices
      const priceSelectors = [
        'span[class*="text-sm"][class*="font-medium"]',
        'span[class*="text-base"][class*="font-medium"]',
        'span[class*="text-lg"][class*="font-medium"]',
        'span[class*="text-xl"][class*="font-medium"]',
        'span.font-medium',
        'span[class*="text-primary"]',
        'span[class*="text-error"]',
        'span[class*="text-error-500"]',
        'span[class*="text-black"]',
      ]

      for (const selector of priceSelectors) {
        try {
          // Wait a bit for elements to appear
          try {
            await page.waitForSelector(selector, { timeout: 3000 })
          } catch {
            // Continue anyway
          }

          const elements = await page.$$(selector)
          for (const element of elements) {
            const priceText = await page.evaluate(
              (el) => el.textContent?.trim() || '',
              element
            )
            // Only process if it looks like a price (digits with commas, no other text)
            // Must be at least 6 characters (prices are usually in millions)
            if (
              /^[\d,\s\u0660-\u0669\u06F0-\u06F9]+$/.test(priceText) &&
              priceText.length >= 6
            ) {
              const price = parsePrice(priceText)
              if (price !== null) {
                foundPrices.push(price)
              }
            }
          }
        } catch {
          // Continue to next selector
          continue
        }
      }

      // Strategy 3: Extract prices from spans with empty class or no class
      // Based on HTML: <span class="">22,450,000</span>
      try {
        // Use evaluate to find all spans and check their class attribute
        const priceSpans = await page.evaluate(() => {
          const spans: string[] = []
          const allSpans = document.querySelectorAll('span')
          
          for (const span of allSpans) {
            const className = span.getAttribute('class')
            const text = span.textContent?.trim() || ''
            
            // Check if span has empty class or no class, and contains only price-like numbers
            if (
              (className === '' || className === null) &&
              /^[\d,\s\u0660-\u0669\u06F0-\u06F9]+$/.test(text) &&
              text.length >= 6
            ) {
              spans.push(text)
            }
          }
          
          return spans
        })

        for (const spanText of priceSpans) {
          const price = parsePrice(spanText)
          if (price !== null) {
            foundPrices.push(price)
          }
        }
      } catch {
        // Continue to next strategy
      }

      // Strategy 4: Extract prices from price range section containing "از" and "تا"
      try {
        const sections = await page.$$('section, div')
        for (const section of sections) {
          const text = await page.evaluate((el) => el.textContent || '', section)
          if (text.includes('از') && text.includes('تا')) {
            // Extract all numbers from this section (both Western and Persian numerals)
            const matches = text.match(
              /[\d\u0660-\u0669\u06F0-\u06F9]{1,3}(?:[,\s][\d\u0660-\u0669\u06F0-\u06F9]{3})*(?:[,\s][\d\u0660-\u0669\u06F0-\u06F9]{3})*/g
            )
            if (matches) {
              for (const match of matches) {
                const price = parsePrice(match)
                if (price !== null) {
                  foundPrices.push(price)
                }
              }
            }

            // Also look for nested spans with prices in this section
            const spans = await section.$$('span')
            for (const span of spans) {
              const spanText = await page.evaluate(
                (el) => el.textContent?.trim() || '',
                span
              )
              // Check if it's a price-like number (6+ digits)
              if (
                /^[\d,\s\u0660-\u0669\u06F0-\u06F9]+$/.test(spanText) &&
                spanText.length >= 6
              ) {
                const price = parsePrice(spanText)
                if (price !== null) {
                  foundPrices.push(price)
                }
              }
            }
          }
        }
      } catch {
        // Continue to next strategy
      }

      // Strategy 5: Fallback - search for price patterns in body text
      if (foundPrices.length === 0) {
        try {
          const bodyText = await page.evaluate(
            () => document.body.textContent || ''
          )
          if (bodyText) {
            // Look for price patterns like: 22,450,000 تومان or 22450000 تومان
            // Also handle Persian numerals
            const pricePatterns = [
              /([\d\u0660-\u0669\u06F0-\u06F9]{1,3}(?:[,\s][\d\u0660-\u0669\u06F0-\u06F9]{3})*(?:[,\s][\d\u0660-\u0669\u06F0-\u06F9]{3})*)\s*تومان/gi,
              /([\d\u0660-\u0669\u06F0-\u06F9]{1,3}(?:[,\s][\d\u0660-\u0669\u06F0-\u06F9]{3})*(?:[,\s][\d\u0660-\u0669\u06F0-\u06F9]{3})*)\s*ريال/gi,
              /قیمت[:\s]*([\d\u0660-\u0669\u06F0-\u06F9]{1,3}(?:[,\s][\d\u0660-\u0669\u06F0-\u06F9]{3})*(?:[,\s][\d\u0660-\u0669\u06F0-\u06F9]{3})*)/gi,
              /قیمت\s*:?\s*([\d\u0660-\u0669\u06F0-\u06F9]{1,3}(?:[,\s][\d\u0660-\u0669\u06F0-\u06F9]{3})*(?:[,\s][\d\u0660-\u0669\u06F0-\u06F9]{3})*)/gi,
              /([\d\u0660-\u0669\u06F0-\u06F9]{1,3}(?:[,\s][\d\u0660-\u0669\u06F0-\u06F9]{3})*(?:[,\s][\d\u0660-\u0669\u06F0-\u06F9]{3})*)\s*ت\.?و\.?م\.?ان/gi,
            ]

            for (const pattern of pricePatterns) {
              const matches = bodyText.match(pattern)
              if (matches && matches.length > 0) {
                for (const match of matches) {
                  const price = parsePrice(match)
                  if (price !== null) {
                    foundPrices.push(price)
                  }
                }
              }
            }
          }
        } catch {
          // Fallback failed
        }
      }

      // Strategy 6: Last resort - find any number that looks like a price (6+ digits with commas)
      if (foundPrices.length === 0) {
        try {
          // Use evaluate to search all text content for price patterns
          const allPrices = await page.evaluate(() => {
            const prices: string[] = []
            
            // Search all spans
            const allSpans = document.querySelectorAll('span')
            for (const span of allSpans) {
              const text = span.textContent?.trim() || ''
              // Match price patterns: numbers with commas (e.g., 22,450,000)
              const priceMatch = text.match(
                /^([\d\u0660-\u0669\u06F0-\u06F9]{1,3}(?:[,\s][\d\u0660-\u0669\u06F0-\u06F9]{3}){1,3})$/
              )
              if (priceMatch && priceMatch[1].length >= 6) {
                prices.push(priceMatch[1])
              }
            }
            
            // If no prices in spans, search body text
            if (prices.length === 0) {
              const bodyText = document.body.textContent || ''
              // Match numbers with at least 6 digits (prices are usually in millions)
              const allNumbers = bodyText.match(
                /[\d\u0660-\u0669\u06F0-\u06F9]{1,3}(?:[,\s][\d\u0660-\u0669\u06F0-\u06F9]{3})+/g
              )
              if (allNumbers) {
                for (const numStr of allNumbers) {
                  // Remove commas and spaces, check if it's a reasonable price
                  const cleaned = numStr.replace(/[,\s]/g, '')
                  if (cleaned.length >= 6 && cleaned.length <= 10) {
                    prices.push(numStr)
                  }
                }
              }
            }
            
            return prices
          })

          for (const priceStr of allPrices) {
            const price = parsePrice(priceStr)
            if (price !== null && price >= 1000000) {
              foundPrices.push(price)
            }
          }
        } catch {
          // Last resort failed
        }
      }

      // If we found prices, return the lowest one
      if (foundPrices.length > 0) {
        const lowestPrice = Math.min(...foundPrices)
        await page.close()
        return {
          success: true,
          price: lowestPrice,
        }
      }

      // If no prices found, check if product is not available
      // Only check if NO prices are found at all
      try {
        const errorElements = await page.$$(
          '[class*="error"], [class*="unavailable"], [class*="outofstock"]'
        )
        for (const element of errorElements) {
          const text = await page.evaluate(
            (el) => el.textContent?.trim() || '',
            element
          )
          // Check for the "not available" message in Persian
          if (
            text.includes('موجود نمی‌باشد') ||
            text.includes('موجود نیست') ||
            text.includes('موجود شد خبرم کنید') ||
            text.includes('فعلا موجود نیست')
          ) {
            await page.close()
            return {
              success: false,
              price: null,
              error: 'Product not available',
            }
          }
        }
      } catch {
        // Error check failed, continue
      }

      await page.close()
      return {
        success: false,
        price: null,
        error: 'Could not find price on page',
      }
    } catch (error) {
      if (page) {
        try {
          await page.close()
        } catch {
          // Ignore close errors
        }
      }
      return {
        success: false,
        price: null,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
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
