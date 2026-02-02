'use client'

import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { formatPricev2 } from '@/lib/utils/formatPrice'
import { getSiteClass, getSiteLabel, toSiteKey } from '@/lib/utils/site'
import { Setting } from '@/payload-types'
import { ProductUrl } from '@/types/products'
import { DollarSign, MoveDown } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import ProductSheet from './ProductSheet'

interface ProductRowProps {
  id: string
  name: string
  productId?: string | null
  productImageUrl?: string | null
  usd?: number | null
  settings?: Setting
  productUrls: ProductUrl[]
}

export default function ProductRowDetail({
  id,
  name,
  productId,
  productImageUrl,
  usd,
  settings,
  productUrls = [],
}: ProductRowProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [urlsState, setUrlsState] = useState<ProductUrl[]>(productUrls)
  const [usdValue, setUsdValue] = useState(usd ?? 0)

  console.log('ProductRowDetail rendered → id:', id, 'usd prop:', usd, 'local usdValue:', usdValue)

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

  const mobile140Entry = urlsState.find(
    (u) => toSiteKey(u.site) === 'mobile140',
    // u.crawlError !== 'Product not available' &&
    // u.currentPrice !== null,
  )

  const otherEntries = urlsState.filter((u) => toSiteKey(u.site) !== 'mobile140')

  const sortedCurrentPrices = [...otherEntries].sort((a, b) => {
    // const aIsMobile140 = toSiteKey(a.site) === 'mobile140'
    // const bIsMobile140 = toSiteKey(b.site) === 'mobile140'

    // 0. mobile140 always first
    // if (aIsMobile140 && !bIsMobile140) return -1
    // if (!aIsMobile140 && bIsMobile140) return 1

    const aUnavailable =
      a.currentPrice == null ||
      a.crawlError === 'Product not available' ||
      a.crawlError === 'Price not found'

    const bUnavailable =
      b.currentPrice == null ||
      b.crawlError === 'Product not available' ||
      b.crawlError === 'Price not found'

    // Unavailable / unknown prices go to bottom
    if (aUnavailable && !bUnavailable) return 1
    if (!aUnavailable && bUnavailable) return -1
    if (aUnavailable && bUnavailable) return 0 // both unavailable, keep order

    // Both have valid prices, sort lowest first
    return a.currentPrice! - b.currentPrice!
  })

  console.log('Rendering row with displayed USD:', usdValue)

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <div className="flex flex-col justify-center items-center gap-4 p-4 border border-gray-300 rounded-lg cursor-pointer hover:shadow-md transition">
          {/* Product Info */}
          <div className="flex w-full justify-between items-center border-b border-gray-200 pb-2">
            <div className="font-medium text-neutral-700">{name}</div>
            <div className="font-medium text-green-500">
              <span className="ml-2 text-sm text-neutral-400">پایین‌ترین قیمتــ :</span>
              {getSiteLabel(toSiteKey(lowestPriceSite))}
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
          <div className="w-full items-center flex justify-between">
            <div className=" flex flex-col gap-4 items-start text-neutral-700">
              <div className="ml-2 flex items-center">
                <span className="text-sm text-neutral-500">
                  قیمت دلاری: <b className="">{usd?.toLocaleString('fa-IR')}</b>
                </span>
                <DollarSign className="text-green-700 size-3" />
              </div>
              <div className=" flex items-center text-neutral-700">
                <span className="text-sm text-neutral-500">
                  قیمت تمام شده:{' '}
                  <b className="">
                    {usd && settings?.importFee && settings?.usdprice
                      ? (usd * (1 + settings.importFee / 100) * settings.usdprice).toLocaleString(
                          'fa-IR',
                        )
                      : '-'}
                  </b>
                </span>
              </div>
            </div>
            <div className="flex  items-center gap-2">
              <div className="flex flex-col md:flex-row gap-4">
                {sortedCurrentPrices.map((urlEntry, index) => {
                  const siteKey = toSiteKey(urlEntry.site)

                  return (
                    <div
                      key={index}
                      className="flex flex-col mx-4 gap-1 justify-between items-center font-medium"
                    >
                      <span className={getSiteClass(siteKey)}>{getSiteLabel(siteKey)}</span>

                      <MoveDown className="size-2 text-gray-400" />

                      {urlEntry.crawlError === 'Product not available' ? (
                        <span className="text-orange-400">ناموجود</span>
                      ) : urlEntry.crawlError === 'Price not found' ? (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          قیمت نامشخص (احتمالا ناموجود)
                        </span>
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

            {mobile140Entry && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg p-2">
                <Image src="/icon/140-blue.svg" alt="Mobile140" width={70} height={70} />

                <MoveDown className="size-2 text-sky-800" />

                {mobile140Entry.crawlError === 'Product not available' ? (
                  <span className="text-sky-800 text-sm">ناموجود</span>
                ) : mobile140Entry.crawlError === 'Price not found' ? (
                  <span className="text-sky-800 text-sm">قیمت نامشخص (احتمالا ناموجود)</span>
                ) : mobile140Entry.currentPrice !== null ? (
                  <span className="font-semibold text-sky-700">
                    {formatPricev2(mobile140Entry.currentPrice, true)}
                  </span>
                ) : (
                  <span className="text-sky-800 text-sm">قیمت نامشخص</span>
                )}
              </div>
            )}
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
        usd={usdValue}
        onUsdChange={setUsdValue}
        productUrls={urlsState}
        onUrlsUpdate={setUrlsState}
      />
    </Sheet>
  )
}
