/* eslint-disable @typescript-eslint/no-explicit-any */
import * as cheerio from 'cheerio'
import type { SiteCrawler, CrawlResult } from './base'

export class EmpratourCrawler implements SiteCrawler {
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

      // ────────────────────────────────────────────────
      //  Priority 1: Try variation JSON (good practice)
      // ────────────────────────────────────────────────
      const variationsAttr = $('form.variations_form').attr('data-product_variations')

      if (variationsAttr) {
        try {
          const variations = JSON.parse(variationsAttr)

          if (Array.isArray(variations) && variations.length > 0) {
            const valid = variations.filter(
              (v: any) =>
                v &&
                v.is_in_stock === true &&
                v.is_purchasable === true &&
                typeof v.display_price === 'number' &&
                v.display_price >= 10000,
            )

            if (valid.length > 0) {
              const lowest = Math.min(...valid.map((v) => v.display_price))
              return { success: true, price: lowest }
            }
          }
        } catch {
          // silent → fallback
        }
      }

      // ────────────────────────────────────────────────
      //  Priority 2: Main single-product price (THIS PAGE)
      // ────────────────────────────────────────────────
      // Targets: <p class="current-price">…<bdi>3,500,000&nbsp;<span>تومان</span></bdi>…
      const priceCandidates = [
        $('.current-price .woocommerce-Price-amount bdi').first().text(),
        $('.current-price').first().text(),
        $('.price-box .current-price').first().text(),
        $('[class*="price"] .amount bdi').first().text(),
        $('.amount bdi').first().text(),
      ]

      for (const raw of priceCandidates) {
        const cleaned = raw?.trim()
        if (!cleaned) continue

        const price = this.parsePrice(cleaned)
        if (price !== null && price >= 50000) {
          return {
            success: true,
            price,
          }
        }
      }

      // ────────────────────────────────────────────────
      //  Priority 3: Very last fallback – any large number + تومان
      // ────────────────────────────────────────────────
      const text = $.root().text()
      const toomanMatch = text.match(/([\d,،\s]+)\s*تومان/i)
      if (toomanMatch && toomanMatch[1]) {
        const price = this.parsePrice(toomanMatch[1])
        if (price !== null && price >= 50000) {
          return { success: true, price }
        }
      }

      // ────────────────────────────────────────────────
      //  Final checks
      // ────────────────────────────────────────────────
      const hasOutOfStockHint =
        text.includes('ناموجود') ||
        text.includes('اتمام موجودی') ||
        text.includes('خبرم کن') ||
        $('.single_add_to_cart_button').text().toLowerCase().includes('ناموجود')

      return {
        success: false,
        price: null,
        error: hasOutOfStockHint ? 'Product appears unavailable' : 'Price not found',
      }
    } catch (err) {
      return {
        success: false,
        price: null,
        error: err instanceof Error ? err.message : 'Unexpected error',
      }
    }
  }

  private parsePrice(input: string): number | null {
    if (!input) return null

    // Normalize Persian & Arabic digits + Persian comma
    const normalized = input
      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .replace(/[،,]/g, '')
      .replace(/\s+/g, '')

    const digitsOnly = normalized.replace(/\D/g, '')
    if (digitsOnly.length < 5) return null // reasonable min price filter

    const num = Number(digitsOnly)
    return Number.isFinite(num) ? num : null
  }

  async close(): Promise<void> {}
}
