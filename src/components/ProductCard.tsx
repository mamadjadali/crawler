'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import ProductSheet from './ProductSheet'
import { formatDate, formatPrice } from '@/lib/utils/formatPrice'
import { Separator } from './ui/separator'
import { ClockFadingIcon } from 'lucide-react'

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

  // Use productUrls if available, otherwise fall back to legacy fields
  const urls =
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

  // Get lowest price from all URLs
  const prices = urls
    .map((urlEntry) => urlEntry.currentPrice)
    .filter((price) => price !== null && price !== undefined)
  const displayPrice = prices.length > 0 ? Math.min(...prices) : null

  // Get most recent crawl date
  const allCrawlDates = urls
    .map((urlEntry) => urlEntry.lastCrawledAt)
    .filter((date) => date !== null && date !== undefined)
    .map((date) => (typeof date === 'string' ? new Date(date) : date))
  const displayLastCrawledAt =
    allCrawlDates.length > 0
      ? new Date(Math.max(...allCrawlDates.map((d: Date) => d.getTime())))
      : null

  // Get overall status
  const hasSuccess = urls.some((urlEntry) => urlEntry.crawlStatus === 'success')
  const hasFailed = urls.some((urlEntry) => urlEntry.crawlStatus === 'failed')
  const isNotAvailable = urls.some((urlEntry) => urlEntry.crawlError === 'Product not available')
  const displayStatus: 'pending' | 'success' | 'failed' = hasSuccess
    ? 'success'
    : hasFailed
      ? 'failed'
      : 'pending'

  // Get unique sites
  const sites = [...new Set(urls.map((urlEntry) => urlEntry.site))]

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Card className="cursor-pointer border border-gray-400 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <CardTitle className="leading-6 text-left text-lg">{name}</CardTitle>
            <Separator className="mt-2 mb-4 border-gray-400 border-b" />
            {/* Top Section: Price and Image */}
            <div className="flex items-center gap-4 mb-4">
              {/* Price Section */}
              <div className="flex-1">
                {displayPrice !== null ? (
                  <div>
                    <div className="text-xs text-gray-400 mb-1">
                      {urls.length > 1 ? 'کمترین قیمت' : 'قیمت فعلی'}
                      {}
                    </div>
                    <div className="text-xl font-bold text-white">
                      {formatPrice(displayPrice, true)}
                    </div>
                    {urls.length > 1 && (
                      <div className="text-xs text-gray-500 mt-1">
                        از {new Intl.NumberFormat('fa-IR').format(urls.length)} منبع
                      </div>
                    )}
                  </div>
                ) : isNotAvailable ? (
                  <div className="text-sm text-orange-400">موجود نیست</div>
                ) : (
                  <div className="text-sm text-gray-400">قیمت نامشخص</div>
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
              {/* <CardTitle className="leading-6">{name}</CardTitle> */}
              <CardDescription className="text-xs">
                {/* {url} */}
                <Separator className="my-4 border-gray-400 border-b" />
              </CardDescription>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {sites.map((siteName) => (
                    <Badge
                      key={siteName}
                      variant="outline"
                      className={`text-xs rounded-lg px-4 py-1 ${
                        siteName === 'technolife'
                          ? 'border border-blue-900 bg-[#223266]/50 text-white'
                          : siteName === 'mobile140'
                            ? 'border border-sky-400 bg-sky-400/20 text-white'
                            : siteName === 'gooshionline'
                              ? 'border border-gray-400 bg-gray-400/20 text-white'
                              : siteName === 'kasrapars'
                                ? 'border border-yellow-400 bg-yellow-400/20 text-white'
                                : 'border border-rose-400 bg-rose-400/20 text-white'
                      }`}
                    >
                      {siteName === 'torob'
                        ? 'تربـــ'
                        : siteName === 'technolife'
                          ? 'تکنولایفــ'
                          : siteName === 'mobile140'
                            ? 'موبایل۱۴۰'
                            : siteName === 'gooshionline'
                              ? 'گوشی آنلاین'
                              : siteName === 'kasrapars'
                                ? 'کسری پلاس'
                                : siteName}
                    </Badge>
                  ))}
                  {/* <Badge
                    variant={
                      displayStatus === 'success'
                        ? 'success'
                        : displayStatus === 'failed'
                          ? 'destructive'
                          : 'secondary'
                    }
                    className="text-xs rounded-lg px-4 py-1"
                  >
                    {displayStatus === 'success'
                      ? 'موفق'
                      : displayStatus === 'failed'
                        ? 'ناموفق'
                        : 'در انتظار'}
                  </Badge> */}
                </div>
                <div className="mt-4 text-sm w-full text-gray-300 flex justify-between items-center-safe">
                  <ClockFadingIcon className="size-4" />
                  {displayLastCrawledAt ? formatDate(displayLastCrawledAt) : 'هنوز بروزرسانی نشده'}
                  <span className="bg-white/10 border border-gray-400 py-1 px-4 rounded-lg text-xs">
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
        productUrls={urls}
      />
    </Sheet>
  )
}
