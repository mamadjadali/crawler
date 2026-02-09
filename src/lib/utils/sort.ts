import { toSiteKey } from '@/lib/utils/site'
import { ProductLink } from '@/payload-types'

export function isMobile140Unavailable(urls: ProductLink['productUrls']) {
  const entry = urls.find((u) => toSiteKey(u.site) === 'mobile140')

  if (!entry) return true

  return (
    entry.currentPrice == null ||
    entry.crawlError === 'Product not available' ||
    entry.crawlError === 'Price not found'
  )
}
