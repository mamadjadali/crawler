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

    if (hostname.includes('zangooleh.com')) {
      return 'zangooleh'
    }

    if (hostname.includes('farako.com')) {
      return 'farako'
    }

    if (hostname.includes('xiaomi360.ir')) {
      return 'xiaomi360'
    }
    if (hostname.includes('positron-shop.com')) {
      return 'positron'
    }
    if (hostname.includes('empratour.com')) {
      return 'empratour'
    }
    if (hostname.includes('royalpart.co')) {
      return 'royalpart'
    }
    if (hostname.includes('parts.parhantech.com')) {
      return 'parhantech'
    }
    if (hostname.includes('mobopart.com')) {
      return 'mobopart'
    }
    if (hostname.includes('itemsara.ir')) {
      return 'itemsara'
    }
    if (hostname.includes('kavoshteam.com')) {
      return 'kavoshteam'
    }

    // Default fallback
    return 'torob'
  } catch {
    throw new Error('Invalid URL')
  }
}
