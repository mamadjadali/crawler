'use client'

import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { formatPrice } from '@/lib/utils/formatPrice'
import Image from 'next/image'
import { useState } from 'react'
import ProductSheet from './ProductSheet'
import { ProductUrl } from '@/types/products'

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
            <div className="flex flex-col justify-center items-center gap-2">
              {displayPrice !== null ? (
                <div className="font-bold text-neutral-700">{formatPrice(displayPrice, true)}</div>
              ) : (
                <div className="text-sm text-orange-400">ناموجود</div>
              )}

              {/* Last crawled */}
              {displayLastCrawledAt &&
                (() => {
                  const now = Date.now()
                  const last = new Date(displayLastCrawledAt).getTime()
                  const diffMs = now - last
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                  const diffMinutes = Math.floor(diffMs / (1000 * 60))

                  // Determine color & icon
                  let className =
                    'border py-1 text-center px-4 rounded-lg text-xs flex items-center border-gray-400 text-neutral-700'
                  let icon: React.ReactNode = null

                  if (diffMinutes <= 10) {
                    className =
                      'border-green-500 text-center text-green-600 border py-2 px-4 rounded-lg text-xs flex items-center gap-2'
                    icon = (
                      <span className="relative flex size-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex size-3 rounded-full bg-green-500"></span>
                      </span>
                    )
                  } else if (diffDays >= 2) {
                    className =
                      'border-red-500 text-center text-red-600 border py-2 px-4 rounded-lg text-xs flex items-center gap-2'
                    icon = (
                      <span className="relative flex size-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex size-3 rounded-full bg-red-500"></span>
                      </span>
                    )
                  } else if (diffDays >= 1) {
                    className =
                      'border-yellow-400 text-center text-yellow-700 border justify-center py-2 px-4 rounded-lg text-xs flex items-center gap-2'
                    icon = (
                      <span className="relative flex size-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex size-3 rounded-full bg-yellow-500"></span>
                      </span>
                    )
                  }

                  // Determine display text
                  let text = ''
                  if (diffDays >= 1)
                    text = `${new Intl.NumberFormat('fa-IR').format(diffDays)} روز قبل`
                  else if (diffHours >= 1)
                    text = `${new Intl.NumberFormat('fa-IR').format(diffHours)} ساعت قبل`
                  else text = `${new Intl.NumberFormat('fa-IR').format(diffMinutes)} دقیقه قبل`

                  return (
                    <span className={className}>
                      {icon}
                      {text}
                    </span>
                  )
                })()}
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
