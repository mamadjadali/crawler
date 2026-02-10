/* eslint-disable */

import * as cheerio from 'cheerio'
import type { SiteCrawler, CrawlResult } from './base'

export class MoboPartCrawler implements SiteCrawler {
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

      // Quick availability check (optional but recommended)
      const hasAddToCart =
        $('#add_to_basket, .btn-basket, .add_basket, [data-id][class*="basket"]').length > 0

      if (!hasAddToCart) {
        return {
          success: false,
          price: null,
          error: 'Product not available',
        }
      }

      // ────────────────────────────────────────────────
      //  1. Best option: data-price attribute (clean & numeric)
      // ────────────────────────────────────────────────
      const priceSpan = $('span.price#ProductPrice[data-price]')
      if (priceSpan.length > 0) {
        const dataPrice = priceSpan.attr('data-price')?.trim()
        if (dataPrice && /^\d+$/.test(dataPrice)) {
          const priceNum = Number(dataPrice)
          if (priceNum >= 10000) {
            // reasonable min price filter
            return { success: true, price: priceNum }
          }
        }
      }

      // ────────────────────────────────────────────────
      //  2. Fallback: parse visible text inside .price
      // ────────────────────────────────────────────────
      const priceText = $('span.price#ProductPrice')
        .first()
        .contents()
        .filter((_, el) => el.type === 'text')
        .text()
        .trim()

      const parsed = this.parsePrice(priceText)
      if (parsed !== null) {
        return { success: true, price: parsed }
      }

      // ────────────────────────────────────────────────
      //  3. Extra fallback: any big number inside .price-box
      // ────────────────────────────────────────────────
      const priceBoxText = $('.price-box .price').first().text().trim()
      const fallbackParsed = this.parsePrice(priceBoxText)
      if (fallbackParsed !== null) {
        return { success: true, price: fallbackParsed }
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

  private parsePrice(text: string): number | null {
    if (!text) return null

    // Replace Persian/Arabic digits → Latin
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹'
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩'
    let normalized = text

    for (let i = 0; i < 10; i++) {
      normalized = normalized.replace(new RegExp(persianDigits[i], 'g'), String(i))
      normalized = normalized.replace(new RegExp(arabicDigits[i], 'g'), String(i))
    }

    // Remove everything except digits
    const digitsOnly = normalized.replace(/\D+/g, '')

    if (!digitsOnly) return null

    const price = Number(digitsOnly)
    return Number.isNaN(price) || price < 10000 ? null : price
  }

  async close(): Promise<void> {}
}
