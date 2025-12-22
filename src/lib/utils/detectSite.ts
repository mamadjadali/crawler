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

    if (hostname.includes('mobile140.com')) {
      return 'mobile140'
    }

    if (hostname.includes('gooshi.online')) {
      return 'gooshionline'
    }

    if (hostname.includes('kasrapars.ir') || hostname.includes('plus.kasrapars.ir')) {
      return 'kasrapars'
    }

    // Default fallback
    return 'torob'
  } catch {
    throw new Error('Invalid URL')
  }
}

