import EditableAED from '@/components/AedGlobal'
import EditableFee from '@/components/FeeGlobal'
import ProductsPageClient from '@/components/ProductsPageClient'
import EditableProfit from '@/components/ProfitGlobal'
import EditableUSD from '@/components/UsdGlobal'
import { detectSiteFromUrl, type Site } from '@/domain/product/site'
import { getSettings } from '@/lib/utils/getSettings'
import { ProductLink } from '@/payload-types'
import config from '@/payload.config'
import { Metadata } from 'next'
import { getPayload } from 'payload'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Products - Price Tracker',
  description: 'View and manage product prices from Torob.com',
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const category = typeof params.category === 'string' ? params.category : undefined
  const brand = typeof params.brand === 'string' ? params.brand : undefined

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Decide which query to run
  let products: ProductLink[] = []

  if (q || category || brand) {
    const qs = new URLSearchParams()
    if (q) qs.set('q', q)
    if (category) qs.set('category', category)
    if (brand) qs.set('brand', brand)

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/search?${qs}`,
      {
        cache: 'no-store', // or force-dynamic if needed
      },
    )

    if (res.ok) {
      const data = await res.json()
      products = (data.docs || []) as ProductLink[]
    }
  } else {
    // No filters → get recent products like before
    const { docs } = await payload.find({
      collection: 'product-links',
      where: {
        or: [{ disable: { equals: false } }, { disable: { exists: false } }],
      },
      sort: '-createdAt',
      limit: 400,
      depth: 1,
    })
    products = docs as ProductLink[]
  }

  const settings = await getSettings()

  const transformedProducts = products.map((product: ProductLink): ProductLink => {
    const safeProductUrls = (product.productUrls ?? []).map((entry) => {
      const normalizedEntry = {
        ...entry,
        url: entry.url ?? '',
        site: (entry.site ?? detectSiteFromUrl(entry.url ?? '') ?? 'torob') as Site,
        currentPrice: entry.currentPrice,
        lastCrawledAt: entry.lastCrawledAt ?? null,
        crawlStatus: (entry.crawlStatus ?? 'pending') as 'pending' | 'success' | 'failed',
        crawlError: entry.crawlError ?? null,
        priceHistory: (entry.priceHistory ?? []).map((item) => ({
          ...item,
          price: item.price ?? 0,
          crawledAt: item.crawledAt ?? null,
        })),
      }

      // Force TS to see currentPrice as number | null (no undefined)
      return {
        ...normalizedEntry,
        currentPrice: normalizedEntry.currentPrice as number | null,
      }
    }) satisfies ProductLink['productUrls']

    // Return original + overrides
    return {
      ...product, // keeps createdAt, updatedAt, etc.
      name: product.name || 'بدون نام',
      disable: product.disable ?? false,
      productUrls: safeProductUrls,
    }
  })

  // Filter visible (disable !== true)
  const visibleProducts = transformedProducts.filter((p) => p.disable !== true)

  return (
    <div className="min-h-screen bg-[#e6f3ff] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          <div className="flex items-center font-medium justify-between bg-white border-none rounded-[10px] p-2 text-base text-[#212a72]">
            کل محصولاتـــ
            <span className="font-semibold text-xl text-[#212a72]">
              {new Intl.NumberFormat('fa-IR').format(visibleProducts.length)}
            </span>
          </div>
          <EditableUSD settings={settings} />
          <EditableAED settings={settings} />
          <EditableFee settings={settings} />
          <EditableProfit settings={settings} />
        </div>

        <Suspense
          fallback={
            <div className="my-40 flex flex-col items-center gap-4 text-sm text-gray-500">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-gray-300 border-t-[#212a72]" />
              در حال بارگذاری...
            </div>
          }
        >
          <ProductsPageClient initialProducts={visibleProducts} settings={settings} />
        </Suspense>
      </div>
    </div>
  )
}
