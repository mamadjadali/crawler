/**
 * Detect site from URL
 * Browser-safe utility (no Puppeteer dependencies)
 */
export function detectSite(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    if (hostname.includes('torob.com')) {
      return 'torob'
    }

    if (hostname.includes('technolife.com')) {
      return 'technolife'
    }

    // Default fallback
    return 'torob'
  } catch {
    throw new Error('Invalid URL')
  }
}

