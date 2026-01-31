'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { formatDate, formatPrice } from '@/lib/utils/formatPrice'
import { getSiteClass, getSiteLabel, toSiteKey } from '@/lib/utils/site'
import { PriceHistoryItem, ProductUrl } from '@/types/products'
import { ClockFadingIcon } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import ProductSheet from './ProductSheet'
import { Separator } from './ui/separator'

interface ProductCardProps {
  id: string
  name: string
  productId?: string | null
  productImageUrl?: string | null
  productUrls: ProductUrl[]
  // Legacy fields for backward compatibility
  url: string
  site: string
  currentPrice: number | null
  lastCrawledAt: Date | string | null
  crawlStatus: 'pending' | 'success' | 'failed'
  crawlError?: string | null
  priceHistory?: PriceHistoryItem[]
}

export default function ProductCard({
  id,
  name,
  productId,
  productImageUrl,
  productUrls = [],
  // Legacy fields
  url,
  site,
  currentPrice,
  lastCrawledAt,
  crawlStatus,
  crawlError,
  priceHistory = [],
}: ProductCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const initialUrls =
    productUrls.length > 0
      ? productUrls
      : [
          {
            url,
            site,
            currentPrice,
            lastCrawledAt,
            crawlStatus,
            crawlError,
            priceHistory: priceHistory || [],
          },
        ]

  const [urlsState, setUrlsState] = useState<ProductUrl[]>(initialUrls)

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

  // Get most recent crawl date
  // const allCrawlDates = urls
  const allCrawlDates = urlsState
    .map((urlEntry) => urlEntry.lastCrawledAt)
    .filter((date) => date !== null && date !== undefined)
    .map((date) => (typeof date === 'string' ? new Date(date) : date))
  const displayLastCrawledAt =
    allCrawlDates.length > 0
      ? new Date(Math.max(...allCrawlDates.map((d: Date) => d.getTime())))
      : null

  let lastCrawlClass = 'border border-gray-400 text-neutral-700'

  if (displayLastCrawledAt) {
    const now = Date.now()
    const last = new Date(displayLastCrawledAt).getTime()
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24))

    if (diffDays >= 3) {
      lastCrawlClass = 'border-2 border-red-500 text-red-600'
    } else if (diffDays >= 2) {
      lastCrawlClass = 'border-2 animate-pulse border-yellow-400 text-yellow-700'
    }
  }
  // Get overall status
  const hasSuccess = urlsState.some((urlEntry) => urlEntry.crawlStatus === 'success')
  const hasFailed = urlsState.some((urlEntry) => urlEntry.crawlStatus === 'failed')
  const isNotAvailable = urlsState.some(
    (urlEntry) => urlEntry.crawlError === 'Product not available',
  )
  const displayStatus: 'pending' | 'success' | 'failed' = hasSuccess
    ? 'success'
    : hasFailed
      ? 'failed'
      : 'pending'

  // Get unique sites
  const sites = [...new Set(urlsState.map((urlEntry) => urlEntry.site))]

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Card className="cursor-pointer border shadow-none border-gray-400 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <CardTitle className="text-neutral-700 leading-6 text-left text-lg">{name}</CardTitle>
            <Separator className="mt-2 mb-4 border-gray-400 border-b" />
            {/* Top Section: Price and Image */}
            <div className="flex items-center gap-4 mb-4">
              {/* Price Section */}
              <div className="flex-1">
                {displayPrice !== null ? (
                  <div>
                    <div className="text-xs flex gap-1 text-gray-500 mb-2">
                      {urlsState.length > 1 ? 'کمترین قیمت' : 'قیمت فعلی'}
                      {lowestPriceSite && (
                        <div className="text-xs font-bold text-green-600">
                          {getSiteLabel(toSiteKey(lowestPriceSite))}
                        </div>
                      )}
                    </div>

                    <div className="text-xl font-bold text-neutral-700">
                      {formatPrice(displayPrice, true)}
                    </div>

                    {urlsState.length > 1 && (
                      <div className="text-xs text-gray-500 mt-1">
                        از {new Intl.NumberFormat('fa-IR').format(urlsState.length)} منبع
                      </div>
                    )}
                  </div>
                ) : isNotAvailable ? (
                  <div className="text-sm text-orange-400">موجود نیست</div>
                ) : (
                  <div className="text-sm text-gray-500">قیمت نامشخص</div>
                )}
              </div>

              {/* Product Image */}
              {productImageUrl && (
                <div className="relative w-1/4 h-24 bg-white flex-shrink-0 rounded-lg overflow-hidden">
                  <Image
                    src={productImageUrl}
                    alt={name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 25vw, 25vw"
                  />
                </div>
              )}
            </div>

            {/* Bottom Section: Name, URL, Badges */}
            <div className="space-y-2">
              <CardDescription className="text-xs">
                {/* {url} */}
                <Separator className="my-4 border-gray-400 border-b" />
              </CardDescription>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {sites.map((site) => {
                    const siteKey = toSiteKey(site)

                    return (
                      <Badge
                        key={site}
                        variant="outline"
                        className={`text-[10px] rounded-lg px-2 py-0 ${getSiteClass(siteKey)}`}
                      >
                        {getSiteLabel(siteKey)}
                      </Badge>
                    )
                  })}
                </div>

                <div className="mt-4 text-sm w-full text-neutral-700 flex justify-between items-center-safe">
                  <ClockFadingIcon className="size-4" />
                  {displayLastCrawledAt ? formatDate(displayLastCrawledAt) : 'هنوز بروزرسانی نشده'}
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
          </CardContent>
        </Card>
      </SheetTrigger>

      <ProductSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        productId={id}
        collectionProductId={productId}
        name={name}
        productImageUrl={productImageUrl}
        // productUrls={urls}
        productUrls={urlsState}
        onUrlsUpdate={setUrlsState}
      />
    </Sheet>
  )
}
