'use client'

import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { formatPrice, formatPricev2 } from '@/lib/utils/formatPrice'
import { MoveDown } from 'lucide-react'
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

export default function ProductRowDetail({
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

  const sortedCurrentPrices = [...productUrls].sort((a, b) => {
    const aUnavailable = a.currentPrice == null || a.crawlError === 'Product not available'
    const bUnavailable = b.currentPrice == null || b.crawlError === 'Product not available'
    // Unavailable / unknown prices go to bottom
    if (a.currentPrice == null) return 1
    if (b.currentPrice == null) return -1
    if (aUnavailable && !bUnavailable) return 1 // a goes after b
    if (!aUnavailable && bUnavailable) return -1 // a goes before b
    if (aUnavailable && bUnavailable) return 0 // both unavailable, keep order
    return a.currentPrice - b.currentPrice // lowest first
  })

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <div className="flex flex-col justify-center items-center gap-4 p-4 border border-gray-300 rounded-lg cursor-pointer hover:shadow-md transition">
          {/* Product Info */}
          <div className="flex w-full justify-between items-center border-b border-gray-200 pb-2">
            <div className="font-medium text-neutral-700">{name}</div>
            <div className="font-medium text-green-500">
              <span className="ml-2 text-sm text-neutral-400">پایین‌ترین قیمتــ :</span>
              {lowestPriceSite === 'torob'
                ? 'تربـــ'
                : lowestPriceSite === 'technolife'
                  ? 'تکنولایفــ'
                  : lowestPriceSite === 'mobile140'
                    ? 'موبایل۱۴۰'
                    : lowestPriceSite === 'gooshionline'
                      ? 'گوشی آنلاین'
                      : lowestPriceSite === 'kasrapars'
                        ? 'کسری پلاس'
                        : lowestPriceSite === 'farnaa'
                          ? 'فرنا'
                          : lowestPriceSite === 'zitro'
                            ? 'زیــتـرو'
                            : lowestPriceSite === 'yaran'
                              ? 'یــاران'
                              : (lowestPriceSite ?? '-')}
            </div>
            <div className="w-auto">
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
          <div className="w-full items-center flex justify-center">
            <div className="flex  items-center gap-2">
              <div className="flex flex-col md:flex-row gap-4">
                {sortedCurrentPrices.map((urlEntry, index) => {
                  const siteName =
                    urlEntry.site === 'torob'
                      ? 'تربـــ'
                      : urlEntry.site === 'technolife'
                        ? 'تکنولایفــ'
                        : urlEntry.site === 'mobile140'
                          ? 'موبایل۱۴۰'
                          : urlEntry.site === 'gooshionline'
                            ? 'گوشی آنلاین'
                            : urlEntry.site === 'kasrapars'
                              ? 'کسری پلاس'
                              : urlEntry.site === 'farnaa'
                                ? 'فرنا'
                                : urlEntry.site === 'zitro'
                                  ? 'زیــتـرو'
                                  : urlEntry.site === 'yaran'
                                    ? 'یــاران'
                                    : urlEntry.site === 'greenlion'
                                      ? 'گرین لاین'
                                      : urlEntry.site

                  const siteColorClass =
                    urlEntry.site === 'technolife'
                      ? 'text-white bg-blue-700 px-3 py-1 rounded-lg text-xs'
                      : urlEntry.site === 'mobile140'
                        ? 'bg-sky-600 text-white px-3 py-1 rounded-lg text-xs'
                        : urlEntry.site === 'gooshionline'
                          ? 'bg-gray-400 text-white px-3 py-1 rounded-lg text-xs'
                          : urlEntry.site === 'kasrapars'
                            ? 'bg-yellow-400 text-white px-3 py-1 rounded-lg text-xs'
                            : urlEntry.site === 'farnaa'
                              ? 'bg-[#d90268] text-white px-3 py-1 rounded-lg text-xs'
                              : urlEntry.site === 'zitro'
                                ? 'bg-[#ff6000] text-white px-3 py-1 rounded-lg text-xs'
                                : urlEntry.site === 'yaran'
                                  ? 'bg-[#9b0505] text-white px-3 py-1 rounded-lg text-xs'
                                  : urlEntry.site === 'greenlion'
                                    ? 'bg-[#0d452b] text-white px-3 py-1 rounded-lg text-xs'
                                    : 'bg-rose-400 text-white px-3 py-1 rounded-lg text-xs' // torob as default

                  return (
                    <div
                      key={index}
                      className="flex flex-col mx-4 gap-1 justify-between items-center font-medium"
                    >
                      <span className={siteColorClass}>{siteName}</span>
                      <MoveDown className="size-2 text-gray-400" />
                      {urlEntry.crawlError === 'Product not available' ? (
                        <span className="text-orange-400">ناموجود</span>
                      ) : urlEntry.currentPrice !== null ? (
                        <span className="text-neutral-700 text-base font-semibold">
                          {formatPricev2(urlEntry.currentPrice, true)}
                        </span>
                      ) : (
                        <span className="text-gray-500">قیمت نامشخص</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Last crawled */}
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

// {/* Image */}
//           {productImageUrl && (
//             <div className="w-16 h-16 hidden md:block bg-white rounded-lg overflow-hidden flex-shrink-0">
//               <Image
//                 src={productImageUrl}
//                 alt={name}
//                 width={64}
//                 height={64}
//                 className="object-contain"
//               />
//             </div>
//           )}
