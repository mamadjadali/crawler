import type { CrawlResult } from './sites/base'
import type { SiteCrawler } from './sites/base'
import { TorobCrawler } from './sites/torob'
import { TechnolifeCrawler } from './sites/technolife'
import { Mobile140Crawler } from './sites/mobile140'
import { GooshiOnlineCrawler } from './sites/gooshionline'
import { KasraParsCrawler } from './sites/kasrapars'
import { detectSite } from '../utils/detectSite'

// Re-export detectSite for backward compatibility
export { detectSite }

// Cache crawler instances
const crawlerInstances: Map<string, SiteCrawler> = new Map()

/**
 * Get or create a crawler instance for a specific site
 */
function getCrawler(site: string): SiteCrawler {
  if (!crawlerInstances.has(site)) {
    if (site === 'torob') {
      crawlerInstances.set(site, new TorobCrawler())
    } else if (site === 'technolife') {
      crawlerInstances.set(site, new TechnolifeCrawler())
    } else if (site === 'mobile140') {
      crawlerInstances.set(site, new Mobile140Crawler())
    } else if (site === 'gooshionline') {
      crawlerInstances.set(site, new GooshiOnlineCrawler())
    } else if (site === 'kasrapars') {
      crawlerInstances.set(site, new KasraParsCrawler())
    } else {
      throw new Error(`Unsupported site: ${site}`)
    }
  }
  return crawlerInstances.get(site)!
}

/**
 * Crawl a product URL and extract the price
 * @param url - The product URL to crawl
 * @param site - Optional site identifier (will be auto-detected if not provided)
 * @returns Promise resolving to crawl result
 */
export async function crawlProduct(
  url: string,
  site?: string
): Promise<CrawlResult> {
  try {
    // Detect site if not provided
    const detectedSite = site || detectSite(url)

    // Get appropriate crawler
    const crawler = getCrawler(detectedSite)

    // Perform crawl
    const result = await crawler.crawl(url)

    return result
  } catch (error) {
    return {
      success: false,
      price: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Close all crawler instances (cleanup)
 */
export async function closeAllCrawlers(): Promise<void> {
  for (const crawler of crawlerInstances.values()) {
    if (crawler.close) {
      await crawler.close()
    }
  }
  crawlerInstances.clear()
}

