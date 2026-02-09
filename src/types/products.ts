export interface ProductUrl {
  url: string
  site: string
  currentPrice?: number | null | undefined
  lastCrawledAt: Date | string | null
  crawlStatus: 'pending' | 'success' | 'failed'
  crawlError?: string | null
  priceHistory?: PriceHistoryItem[]
}

export interface PriceHistoryItem {
  price: number
  crawledAt: string | Date
  site?: string
  url?: string
}
