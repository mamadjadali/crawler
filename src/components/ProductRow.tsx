'use client'

import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { formatPrice } from '@/lib/utils/formatPrice'
import Image from 'next/image'
import { useState } from 'react'
import ProductSheet from './ProductSheet'

interface PriceHistoryItem {
  price: number
  crawledAt: string | Date
  site?: string
  url?: string
}

interface ProductUrl {
  url: string
  site: string
  currentPrice: number | null
  lastCrawledAt: Date | string | null
  crawlStatus: 'pending' | 'success' | 'failed'
  crawlError?: string | null
  priceHistory?: PriceHistoryItem[]
}

interface ProductRowProps {
  id: string
  name: string
  productId?: string | null
  productImageUrl?: string | null
  productUrls: ProductUrl[]
}

export default function ProductRow({
  id,
  name,
  productId,
  productImageUrl,
  productUrls = [],
}: ProductRowProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [urlsState, setUrlsState] = useState<ProductUrl[]>(productUrls)

  // Compute lowest price and site
  const lowestPriceEntry = urlsState
    .filter(
      (u): u is ProductUrl & { currentPrice: number } =>
        u.crawlError !== 'Product not available' && u.currentPrice !== null,
    )
    .reduce<(ProductUrl & { currentPrice: number }) | null>((lowest, current) => {
      if (!lowest) return current
      return current.currentPrice < lowest.currentPrice ? current : lowest
    }, null)

  const displayPrice = lowestPriceEntry?.currentPrice ?? null
  const lowestPriceSite = lowestPriceEntry?.site ?? null

  // Compute last crawl date
  const allCrawlDates = urlsState
    .map((u) => u.lastCrawledAt)
    .filter((d) => d != null)
    .map((d) => (typeof d === 'string' ? new Date(d) : d))
  const displayLastCrawledAt =
    allCrawlDates.length > 0 ? new Date(Math.max(...allCrawlDates.map((d) => d.getTime()))) : null

  // Unique sites
  const sites = [...new Set(urlsState.map((u) => u.site))]

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <div className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg cursor-pointer hover:shadow-md transition">
          {/* Image */}
          {productImageUrl && (
            <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={productImageUrl}
                alt={name}
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
          )}

          {/* Product Info */}
          <div className="w-full  items-center flex justify-between">
            <div className="font-medium text-neutral-700">{name}</div>
            {/* <div className="flex items-center gap-2 text-xs text-neutral-600 mt-2">
              <ClockFadingIcon className="w-3 h-3" />
              {displayLastCrawledAt ? formatDate(displayLastCrawledAt) : 'هنوز بروزرسانی نشده'}
            </div> */}
            <div className="flex flex-col gap-2">
              {displayPrice !== null ? (
                <div className="font-bold text-neutral-700">{formatPrice(displayPrice, true)}</div>
              ) : (
                <div className="text-sm text-orange-400">ناموجود</div>
              )}

              {/* Last crawled */}
              <span className="w-full border text-center border-gray-400 text-neutral-700 py-1 px-4 rounded-lg text-xs">
                {displayLastCrawledAt &&
                  (() => {
                    const now = Date.now()
                    const last = new Date(displayLastCrawledAt).getTime()
                    const diffMs = now - last
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                    const diffMinutes = Math.floor(diffMs / (1000 * 60))

                    if (diffDays >= 1) {
                      return `${new Intl.NumberFormat('fa-IR').format(diffDays)} روز قبل`
                    } else if (diffHours >= 1) {
                      return `${new Intl.NumberFormat('fa-IR').format(diffHours)} ساعت قبل`
                    } else {
                      return `${new Intl.NumberFormat('fa-IR').format(diffMinutes)} دقیقه قبل`
                    }
                  })()}
              </span>
            </div>
          </div>
        </div>
      </SheetTrigger>

      <ProductSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        productId={id}
        collectionProductId={productId}
        name={name}
        productImageUrl={productImageUrl}
        productUrls={urlsState}
        onUrlsUpdate={setUrlsState}
      />
    </Sheet>
  )
}
