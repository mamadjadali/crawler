import * as cheerio from 'cheerio'
import type { SiteCrawler, CrawlResult } from './base'

export class PositronCrawler implements SiteCrawler {
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
      // const hasReplacement = $('span')
      //   .toArray()
      //   .some((el) => $(el).text().includes('نیازت میشه'))

      // if (hasReplacement) {
      //   return {
      //     success: false,
      //     price: null,
      //     error: 'Product not available',
      //   }
      // }

      const hasAddToCart = $('.zebline-add-basket, .add_basket').length > 0

      if (!hasAddToCart) {
        return {
          success: false,
          price: null,
          error: 'Product not available',
        }
      }

      // -------------------------------
      // 1️⃣ JSON-LD (MOST RELIABLE)
      // -------------------------------
      let price: number | null = null

      $('script[type="application/ld+json"]').each((_, el) => {
        if (price !== null) return

        try {
          const json = JSON.parse($(el).html() || '{}')
          const offers = json?.offers
          if (!offers) return

          const list = Array.isArray(offers) ? offers : [offers]

          for (const o of list) {
            if (o?.price) {
              const parsed = this.parsePrice(String(o.price))
              if (parsed) {
                price = parsed
                return
              }
            }
          }
        } catch {
          // ignore broken JSON
        }
      })

      if (price !== null) {
        return { success: true, price }
      }

      // -------------------------------
      // 2️⃣ MAIN PRODUCT CONTAINER
      // -------------------------------
      let $root = $('.products-page').first()
      $('.products-page').each((_, el) => {
        if ($(el).find('.js-add-to-cart,.js-btn-add-to-cart').length > 0) {
          $root = $(el)
          return false
        }
      })

      const priceText = $('.product_price_box .entityPrice .price span').first().text().trim()

      const parsed = this.parsePrice(priceText)

      if (parsed) {
        return {
          success: true,
          price: parsed,
        }
      }

      return {
        success: false,
        price: null,
        error: 'Price not found',
      }
    } catch (error) {
      return {
        success: false,
        price: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // --------------------------------
  // PRICE PARSER (INLINE)
  // --------------------------------
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
    if (Number.isNaN(price) || price < 1000) return null

    return price
  }

  async close(): Promise<void> {}
}
