import EditableAED from '@/components/AedGlobal'
import EditableFee from '@/components/FeeGlobal'
import ProductsPageClient from '@/components/ProductsPageClient'
import EditableUSD from '@/components/UsdGlobal'
import { detectSite } from '@/lib/utils/detectSite'
import { getSettings } from '@/lib/utils/getSettings'
import config from '@/payload.config'
import { getPayload } from 'payload'
import { Suspense } from 'react'

export const metadata = {
  title: 'Products - Price Tracker',
  description: 'View and manage product prices from Torob.com',
}

export default async function ProductsPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  // Fetch all product links with media relationship
  const { docs: products } = await payload.find({
    collection: 'product-links',
    where: {
      or: [{ disable: { equals: false } }, { disable: { exists: false } }],
    },
    sort: '-createdAt',
    limit: 200,
    depth: 1, // Populate media relationship
  })

  const settings = await getSettings()

  // Transform products to match component props
  const transformedProducts = products.map((product: any) => {
    // Get product image URL from media relationship
    let productImageUrl: string | null = null
    if (
      product.productImage &&
      typeof product.productImage === 'object' &&
      product.productImage.url
    ) {
      productImageUrl = product.productImage.url
    } else if (typeof product.productImage === 'string') {
      // If it's just an ID, we'd need to fetch it, but for now assume it's a URL
      productImageUrl = product.productImage
    }

    // Handle productUrls array - get lowest price and most recent crawl info
    const productUrls = product.productUrls || []
    const prices = productUrls
      .map((urlEntry: any) => urlEntry.currentPrice)
      .filter((price: any) => price !== null && price !== undefined)
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : null

    // Get most recent crawl info
    const allCrawlDates = productUrls
      .map((urlEntry: any) => urlEntry.lastCrawledAt)
      .filter((date: any) => date !== null && date !== undefined)
      .map((date: string) => new Date(date))
    const mostRecentCrawl =
      allCrawlDates.length > 0
        ? new Date(Math.max(...allCrawlDates.map((d: Date) => d.getTime())))
        : null

    // Get overall crawl status (success if any URL succeeded)
    const hasSuccess = productUrls.some((urlEntry: any) => urlEntry.crawlStatus === 'success')
    const hasFailed = productUrls.some((urlEntry: any) => urlEntry.crawlStatus === 'failed')
    const overallStatus: 'pending' | 'success' | 'failed' = hasSuccess
      ? 'success'
      : hasFailed
        ? 'failed'
        : 'pending'

    // Combine all price histories
    const allPriceHistory = productUrls.flatMap((urlEntry: any) =>
      (urlEntry.priceHistory || []).map((item: any) => ({
        price: item.price,
        crawledAt: item.crawledAt ? new Date(item.crawledAt) : new Date(),
        site: urlEntry.site,
        url: urlEntry.url,
      })),
    )

    return {
      id: product.id,
      disable: product.disable ?? false,
      name: product.name || 'بدون نام',
      productId: product.productId || null,
      productImageUrl,
      usd: product.usd,
      aed: product.aed,
      productUrls: productUrls.map((urlEntry: any) => {
        // Always verify site matches URL to ensure correctness
        let site = urlEntry.site
        try {
          const detectedSite = detectSite(urlEntry.url || '')
          // If site field is missing, invalid, or doesn't match URL, use detected site
          if (
            !site ||
            (site !== 'torob' &&
              site !== 'technolife' &&
              site !== 'mobile140' &&
              site !== 'gooshionline' &&
              site !== 'kasrapars' &&
              site !== 'farnaa' &&
              site !== 'yaran' &&
              site !== 'zitro' &&
              site !== 'greenlion' &&
              site !== 'plazadigital' &&
              site !== 'zangooleh' &&
              site !== 'ithome' &&
              site !== 'xiaomi360' &&
              site !== 'positron' &&
              site !== 'empratour' &&
              site !== 'royalpart' &&
              site !== 'parhantech' &&
              site !== 'mobopart' &&
              site !== 'farako') ||
            site !== detectedSite
          ) {
            site = detectedSite
          }
        } catch {
          // If URL is invalid, keep original site or default to torob
          if (
            !site ||
            (site !== 'torob' &&
              site !== 'technolife' &&
              site !== 'mobile140' &&
              site !== 'gooshionline' &&
              site !== 'kasrapars' &&
              site !== 'farnaa' &&
              site !== 'yaran' &&
              site !== 'zitro' &&
              site !== 'greenlion' &&
              site !== 'plazadigital' &&
              site !== 'zangooleh' &&
              site !== 'ithome' &&
              site !== 'xiaomi360' &&
              site !== 'positron' &&
              site !== 'empratour' &&
              site !== 'royalpart' &&
              site !== 'parhantech' &&
              site !== 'mobopart' &&
              site !== 'farako')
          ) {
            site = 'torob'
          }
        }

        return {
          url: urlEntry.url || '',
          site: site,
          currentPrice: urlEntry.currentPrice ?? null,
          lastCrawledAt: urlEntry.lastCrawledAt ? new Date(urlEntry.lastCrawledAt) : null,
          crawlStatus: (urlEntry.crawlStatus as 'pending' | 'success' | 'failed') || 'pending',
          crawlError: urlEntry.crawlError || null,
          priceHistory: (urlEntry.priceHistory || []).map((item: any) => ({
            price: item.price,
            crawledAt: item.crawledAt ? new Date(item.crawledAt) : new Date(),
          })),
        }
      }),
      // Legacy fields for backward compatibility (lowest price, most recent crawl)
      url: productUrls.length > 0 ? productUrls[0].url : '',
      site: productUrls.length > 0 ? productUrls[0].site : 'torob',
      currentPrice: lowestPrice,
      lastCrawledAt: mostRecentCrawl,
      crawlStatus: overallStatus,
      crawlError: productUrls.find((urlEntry: any) => urlEntry.crawlError)?.crawlError || null,
      priceHistory: allPriceHistory,
    }
  })

  const visibleProducts = transformedProducts.filter((p) => p.disable !== true)

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <EditableUSD settings={settings} />
          <EditableAED settings={settings} />
          <EditableFee settings={settings} />
          <div className="flex items-center text-base text-gray-400 justify-between border border-gray-300 rounded-[10px] p-2">
            کل محصولاتـ
            <span className="font-semibold text-xl text-neutral-700">
              {new Intl.NumberFormat('fa-IR').format(products.length)}
            </span>
          </div>
        </div>

        {/* Products Page Client Component with Search */}
        <Suspense
          fallback={
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700"></div>
              <p className="mt-4 text-gray-700">در حال بارگذاری...</p>
            </div>
          }
        >
          <ProductsPageClient initialProducts={visibleProducts} settings={settings} />
        </Suspense>
      </div>
    </div>
  )
}
