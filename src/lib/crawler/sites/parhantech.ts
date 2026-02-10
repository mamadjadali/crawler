/* eslint-disable @typescript-eslint/no-explicit-any */

import * as cheerio from 'cheerio'
import type { SiteCrawler, CrawlResult } from './base'

export class ParhanTechCrawler implements SiteCrawler {
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
      //  STEP 1 – Try to get visible price FIRST (most reliable in this shop)
      // ────────────────────────────────────────────────
      let priceText = $('.price .woocommerce-Price-amount bdi').first().text().trim()

      // sometimes it's wrapped differently
      if (!priceText) {
        priceText = $('p.price .amount, .price ins, .price del + ins, .price').first().text().trim()
      }

      let visiblePrice = this.parsePrice(priceText)

      // ────────────────────────────────────────────────
      //  STEP 2 – Check variation data (for confirmation / multi-variation cases)
      // ────────────────────────────────────────────────
      const variationsAttr = $('form.variations_form').attr('data-product_variations')
      let variationPrice: number | null = null
      let isAvailableViaVariation = false

      if (variationsAttr) {
        try {
          const variations: any[] = JSON.parse(variationsAttr)

          // Find the **default / selected** variation or the only one
          const selected =
            variations.find((v) => v.variation_is_active && v.variation_is_visible) || variations[0] // fallback to first

          if (selected && typeof selected.display_price === 'number') {
            variationPrice = selected.display_price

            if (selected.is_in_stock === true && selected.is_purchasable === true) {
              isAvailableViaVariation = true
            }
          }

          // If multiple in-stock → take cheapest (optional)
          const inStock = variations.filter((v) => v.is_in_stock && v.is_purchasable)
          if (inStock.length > 1) {
            variationPrice = Math.min(...inStock.map((v) => v.display_price))
            isAvailableViaVariation = true
          }
        } catch {}
      }

      // ────────────────────────────────────────────────
      //  Decision logic – prioritize visible price in your case
      // ────────────────────────────────────────────────
      if (visiblePrice !== null && visiblePrice > 150_000) {
        // Most reliable signal in this particular store
        return {
          success: true,
          price: visiblePrice, // 1210000
          // optional: available: isAvailableViaVariation || true
        }
      }

      if (variationPrice !== null) {
        return {
          success: isAvailableViaVariation,
          price: variationPrice,
          error: isAvailableViaVariation ? undefined : 'Variation out of stock',
        }
      }

      // Last resort – look for known out-of-stock phrases
      const bodyText = $.root().text().toLowerCase()
      if (
        bodyText.includes('ناموجود') ||
        bodyText.includes('اتمام موجودی') ||
        bodyText.includes('برای استعلام موجودی تماس بگیرید') ||
        bodyText.includes('out of stock')
      ) {
        return { success: false, price: null, error: 'Out of stock text found' }
      }

      return { success: false, price: null, error: 'No usable price found' }
    } catch (err) {
      return {
        success: false,
        price: null,
        error: err instanceof Error ? err.message : 'Unknown error',
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
