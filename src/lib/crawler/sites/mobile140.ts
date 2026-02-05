import * as cheerio from 'cheerio'
import type { SiteCrawler, CrawlResult } from './base'

export class Mobile140Crawler implements SiteCrawler {
  async crawl(url: string): Promise<CrawlResult> {
    try {
      // Fetch HTML
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })

      if (!response.ok) {
        return {
          success: false,
          price: null,
          error: `HTTP error: ${response.status}`,
        }
      }

      const html = await response.text()

      // Parse with Cheerio
      const $ = cheerio.load(html)
      // $('*')
      //   .filter((_, el) => {
      //     const text = $(el).text()
      //     return text.includes('بیمه')
      //   })
      //   .remove()
      const mainPriceText = $('.flex.justify-start.flex-col.items-end.mr-auto.text-xl.leading-7')
        .first()
        .text()
        .trim()

      if (mainPriceText.includes('تماس بگیرید')) {
        return {
          success: false,
          price: null,
          error: 'Product not available',
        }
      }

      let price: number | null = null

      // Try primary selector for main product price
      const priceSelectors = [
        // Main product price selector
        '.flex.justify-start.flex-col.items-end.mr-auto.text-xl.leading-7 .flex.flex-row.items-center span.ml-1.text-neutral-800.text-lg.font-bold',
        // Alternative selectors (fallback)
        '.rounded-lg.border.border-neutral-200.bg-neutral-100 .flex.justify-start.flex-col.items-end span.text-neutral-800.text-lg.font-bold',
        'span.text-neutral-800.text-lg.font-bold',
        // Generic fallbacks
        '[data-price]',
        '.price',
        '.product-price',
        '.current-price',
        '.final-price',
      ]

      // Try each selector
      for (const selector of priceSelectors) {
        try {
          const priceElement = $(selector).first()

          if (priceElement.length > 0) {
            const priceText = priceElement.text().trim()

            if (priceText) {
              // Extract numeric value from price text
              // Handle Persian/Arabic numerals and remove currency symbols
              // Prices are in format: 10,499,000 or ۱۰,۴۹۹,۰۰۰
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
                price = parsedPrice // Use the main product price found
                break
              }
            }
          }
        } catch {
          // Continue to next selector
          continue
        }
      }

      // If no price found with selectors, try to find any number that looks like a price
      if (!price) {
        try {
          const bodyText = $('body').text()
          if (bodyText) {
            // Look for price patterns like: 10,499,000 تومان or 10499000 تومان
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
            // For Mobile140, we want the main product price, not seller prices
            if (foundPrices.length > 0) {
              // Use the first price found (main product price), not the lowest
              price = foundPrices[0]
            }
          }
        } catch {
          // Fallback failed
        }
      }

      // If no price found, check if product is not available (only for the main/default variant)
      if (price === null) {
        // Check if product is not available - only check main product area, not variant-specific messages
        const notAvailableSelectors = [
          '.rounded-lg.border.border-neutral-200.bg-neutral-100',
          '.text-neutral-700.text-right.leading-8.text-sm',
        ]

        let isNotAvailable = false
        for (const selector of notAvailableSelectors) {
          const element = $(selector).first() // Only check the first/main instance
          if (element.length > 0) {
            const text = element.text().trim()
            // Check for the "not available" message in Persian
            if (
              text.includes('موجود نیست') ||
              text.includes('موجود شد خبرم کنید') ||
              text.includes('فعلا موجود نیست') ||
              text.includes('تماس بگیرید')
            ) {
              // Verify this is in the main product area, not just a variant option
              const parent = element.parent()
              const isMainProductArea =
                parent.hasClass('container-item') ||
                parent.closest('.container-item').length > 0 ||
                element.closest('.flex.justify-start.flex-col.items-end').length > 0

              if (isMainProductArea || element.length === 1) {
                isNotAvailable = true
                break
              }
            }
          }
        }

        if (isNotAvailable) {
          return {
            success: false,
            price: null,
            error: 'Product not available',
          }
        }

        return {
          success: false,
          price: null,
          error: 'Price not found',
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
    // No-op: no browser to close
  }
}
