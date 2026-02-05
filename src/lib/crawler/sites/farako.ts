import * as cheerio from 'cheerio'
import type { SiteCrawler, CrawlResult } from './base'

export class FrakoCrawler implements SiteCrawler {
  async crawl(url: string): Promise<CrawlResult> {
    try {
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
          error: `HTTP ${response.status}`,
        }
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // =================================================
      // 1️⃣ VARIATION JSON (SOURCE OF TRUTH)
      // =================================================
      const variationsAttr = $('form.variations_form').attr('data-product_variations')

      let variationError: string | null = null

      if (variationsAttr) {
        try {
          const variations = JSON.parse(variationsAttr)

          if (!Array.isArray(variations)) {
            variationError = 'Variation data is not an array'
          } else {
            const validVariation = variations.find(
              (v: any) =>
                v &&
                v.is_in_stock === true &&
                v.is_purchasable === true &&
                typeof v.display_price === 'number',
            )

            if (validVariation) {
              return {
                success: true,
                price: validVariation.display_price,
              }
            }

            return {
              success: false,
              price: null,
              error: 'Product not available',
            }
          }
        } catch (err) {
          variationError =
            err instanceof Error
              ? `Variation JSON parse failed: ${err.message}`
              : 'Variation JSON parse failed'
        }
      }

      // =================================================
      // 2️⃣ FALLBACK PRICE (ONLY IF VARIATION FAILED)
      // =================================================
      const mainPriceText = $('.js-product-sidebar span.price ins, span.price ins')
        .first()
        .text()
        .trim()

      const parsedFallback = this.parsePrice(mainPriceText)

      if (parsedFallback !== null) {
        return {
          success: true,
          price: parsedFallback,
        }
      }

      // =================================================
      // 3️⃣ TEXT AVAILABILITY (LAST RESORT)
      // =================================================
      const pageText = $.root().text()

      const hasOutOfStockText =
        pageText.includes('ناموجود') ||
        pageText.includes('در انبار موجود نیست') ||
        pageText.includes('خبرم کن') ||
        pageText.includes('خبرم‌کن') ||
        pageText.toLowerCase().includes('out of stock')

      if (hasOutOfStockText) {
        return {
          success: false,
          price: null,
          error: 'Product not available',
        }
      }

      // =================================================
      // 4️⃣ FINAL FAILURE (HONEST)
      // =================================================
      return {
        success: false,
        price: null,
        error: variationError ?? 'Price not found',
      }
    } catch (error) {
      return {
        success: false,
        price: null,
        error: error instanceof Error ? error.message : 'Unhandled crawler error',
      }
    }
  }

  // =================================================
  // PRICE PARSER (FA / AR / EN SAFE)
  // =================================================
  private parsePrice(text: string): number | null {
    if (!text) return null

    const persian = '۰۱۲۳۴۵۶۷۸۹'
    const arabic = '٠١٢٣٤٥٦٧٨٩'

    const normalized = text.replace(/[۰-۹٠-٩]/g, (d) => {
      const p = persian.indexOf(d)
      if (p !== -1) return String(p)
      const a = arabic.indexOf(d)
      if (a !== -1) return String(a)
      return d
    })

    const digits = normalized.replace(/\D/g, '')
    if (!digits) return null

    const price = Number(digits)
    if (!Number.isFinite(price) || price < 1000) return null

    return price
  }

  async close(): Promise<void> {}
}
