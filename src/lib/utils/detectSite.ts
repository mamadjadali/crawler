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

    if (hostname.includes('farnaa.com')) {
      return 'farnaa'
    }

    if (hostname.includes('zitro.ir')) {
      return 'zitro'
    }

    if (hostname.includes('yaranstore.ir')) {
      return 'yaran'
    }
    if (hostname.includes('greenlionofficial.ir')) {
      return 'greenlion'
    }

    if (hostname.includes('plazadigital.ir')) {
      return 'plazadigital'
    }

    if (hostname.includes('ithome.ir')) {
      return 'ithome'
    }

    // Default fallback
    return 'torob'
  } catch {
    throw new Error('Invalid URL')
  }
}
