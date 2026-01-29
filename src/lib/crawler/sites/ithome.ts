import * as cheerio from 'cheerio'
import type { SiteCrawler, CrawlResult } from './base'

export class ItHomeCrawler implements SiteCrawler {
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

      // Check for replacement/availability messages
      const hasReplacement = $('span')
        .toArray()
        .some((el) => $(el).text().includes('محصولات جایگزین'))
      if (hasReplacement) return { success: false, price: null, error: 'Product not available' }

      const addToCartBtn = $('button.single_add_to_cart_button')
      if (
        !addToCartBtn.length ||
        addToCartBtn.hasClass('disabled') ||
        addToCartBtn.attr('aria-disabled') === 'true'
      ) {
        return { success: false, price: null, error: 'Product not available' }
      }

      const productRoot = addToCartBtn.closest('form.cart')
      if (!productRoot.length)
        return { success: false, price: null, error: 'Product not available' }

      const variationAvailability = productRoot.find('.woocommerce-variation-availability').text()
      if (variationAvailability.includes('ناموجود')) {
        return { success: false, price: null, error: 'Product not available' }
      }

      // Get price from variation or simple product
      let priceText = productRoot.find('.woocommerce-variation-price bdi').first().text().trim()
      if (!priceText) {
        priceText = productRoot
          .closest('.product')
          .children('.summary')
          .find('> p.price bdi')
          .first()
          .text()
          .trim()
      }

      const parsed = this.parsePrice(priceText)
      if (!parsed) return { success: false, price: null, error: 'Price not found' }

      return { success: true, price: parsed }
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
