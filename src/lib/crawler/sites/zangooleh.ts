/* eslint-disable @typescript-eslint/no-explicit-any */

import * as cheerio from 'cheerio'
import type { SiteCrawler, CrawlResult } from './base'

export class ZangoolehCrawler implements SiteCrawler {
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

      /// --------------------------------
      // 1️⃣ PRIMARY: data-product_variations
      // --------------------------------
      const variationsRaw = $('.variations_form').attr('data-product_variations')

      if (variationsRaw) {
        try {
          const variations = JSON.parse(variationsRaw)

          // prefer active variation, otherwise first
          const v = variations.find((v: any) => v.variation_is_active) || variations[0]

          if (v?.display_price && v.display_price >= 1000) {
            return {
              success: true,
              price: Number(v.display_price),
            }
          }
        } catch {
          // ignore JSON errors and fallback
        }
      }

      // --------------------------------
      // 2️⃣ FALLBACK: server-rendered price
      // --------------------------------
      const priceBox = $('.product-info-box').first()

      let wcPriceText =
        priceBox.find('span.price ins bdi').first().text().trim() ||
        priceBox.find('span.price bdi').first().text().trim()

      const wcParsed = this.parsePrice(wcPriceText)

      if (wcParsed) {
        return { success: true, price: wcParsed }
      }

      // --------------------------------
      // 3️⃣ Availability check (LAST)
      // --------------------------------
      const addToCartBtn = $('button.single_add_to_cart_button')

      if (
        !addToCartBtn.length ||
        addToCartBtn.hasClass('disabled') ||
        addToCartBtn.attr('aria-disabled') === 'true'
      ) {
        return { success: false, price: null, error: 'Product not available' }
      }

      return { success: false, price: null, error: 'Price not found' }
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
