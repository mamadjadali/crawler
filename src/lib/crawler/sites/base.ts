export interface CrawlResult {
  success: boolean
  price: number | null
  error?: string
}

export interface SiteCrawler {
  /**
   * Crawl a product URL and extract the price
   * @param url - The product URL to crawl
   * @returns Promise resolving to crawl result with price
   */
  crawl(url: string): Promise<CrawlResult>
}

