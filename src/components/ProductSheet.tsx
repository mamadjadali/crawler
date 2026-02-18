'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SITES } from '@/constants/sites'
import { formatDate, formatPrice } from '@/lib/utils/formatPrice'
import { getSiteClass, getSiteLabel, toSiteKey } from '@/lib/utils/site'
import { cn } from '@/lib/utils/utils'
import { ProductLink } from '@/payload-types'
import {
  Check,
  ChevronsLeft,
  Copy,
  ExternalLink,
  PencilIcon,
  RefreshCcw,
  SquareStack,
  TrendingUp,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import EditableAedProduct from './ProductAed'
import EditableUSDProduct from './ProductUsd'
import RefreshPriceIcon from './RefreshPriceIcon'

interface ProductSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  collectionProductId?: string | null
  name: string
  productImageUrl?: string | null
  usd?: number
  aed?: number
  onUsdChange?: (value: number) => void
  onAedChange?: (value: number) => void
  productUrls: ProductLink['productUrls']
  onUrlsUpdate?: React.Dispatch<React.SetStateAction<ProductLink['productUrls']>>
}

export default function ProductSheet({
  open,
  onOpenChange,
  productId,
  collectionProductId,
  name,
  productImageUrl,
  usd,
  aed,
  onUsdChange,
  onAedChange,
  productUrls = [],
  onUrlsUpdate,
}: ProductSheetProps) {
  const [refreshedProductUrls, setRefreshedProductUrls] = useState(productUrls)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  useEffect(() => {
    setRefreshedProductUrls(productUrls)
  }, [productUrls])

  const torobUrl = useMemo(() => {
    return refreshedProductUrls.find((u) => u.site === 'torob')?.url ?? null
  }, [refreshedProductUrls])

  const handleCopyPrice = (price: number, index: number) => {
    const text = price.toString()
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
      })
      .catch((err) => {
        console.error('Copy failed', err)
        alert('کپی انجام نشد. لطفاً دستی کپی کنید.')
      })
  }

  const handleRefreshComplete = (data: { productUrls?: ProductLink['productUrls'] }) => {
    if (data.productUrls) {
      // Keep dates as strings
      setRefreshedProductUrls(data.productUrls)
      onUrlsUpdate?.(data.productUrls)
    }
  }

  // Calculate price change (use string dates, parse for sort)
  const calculatePriceChange = (
    priceHistory: ProductLink['productUrls'][number]['priceHistory'],
  ) => {
    if (!priceHistory || priceHistory.length < 2) return null

    const sorted = [...priceHistory].sort((a, b) => {
      const dateA = a.crawledAt ? new Date(a.crawledAt) : new Date(0)
      const dateB = b.crawledAt ? new Date(b.crawledAt) : new Date(0)
      return dateA.getTime() - dateB.getTime()
    })

    const firstPrice = sorted[0].price
    const lastPrice = sorted[sorted.length - 1].price
    const change = lastPrice - firstPrice
    const percentage = firstPrice > 0 ? (change / firstPrice) * 100 : 0

    return {
      change,
      percentage,
      isIncrease: change > 0,
      isDecrease: change < 0,
    }
  }

  // Lowest price info (use DB lowestPrice if available, else compute)
  const lowestPriceInfo = useMemo(() => {
    const validEntries = refreshedProductUrls.filter(
      (u): u is typeof u & { currentPrice: number } => u.currentPrice != null && !u.crawlError,
    )

    if (validEntries.length === 0) return null

    const lowest = validEntries.reduce((min, current) => {
      return current.currentPrice < min.currentPrice ? current : min
    }, validEntries[0]) // safe: at least one entry

    return {
      price: lowest.currentPrice,
      site: toSiteKey(lowest.site),
      siteName: getSiteLabel(toSiteKey(lowest.site)),
    }
  }, [refreshedProductUrls])

  const sortedCurrentPrices = useMemo(() => {
    return [...refreshedProductUrls].sort((a, b) => {
      const aUnavailable = a.currentPrice == null || a.crawlError
      const bUnavailable = b.currentPrice == null || b.crawlError

      if (aUnavailable && !bUnavailable) return 1
      if (!aUnavailable && bUnavailable) return -1
      if (aUnavailable && bUnavailable) return 0

      return a.currentPrice! - b.currentPrice!
    })
  }, [refreshedProductUrls])

  // Most recent crawl (parse string for comparison)
  // const allCrawlDates = refreshedProductUrls
  //   .map((u) => u.lastCrawledAt)
  //   .filter((d) => d != null)
  //   .map((d) => new Date(d))

  const mostRecentCrawl = useMemo(() => {
    const allCrawlDates = refreshedProductUrls
      .map((u) => u.lastCrawledAt)
      .filter((d) => d != null)
      .map((d) => new Date(d!)) // d is non-null here

    if (allCrawlDates.length === 0) return null

    return new Date(Math.max(...allCrawlDates.map((d) => d.getTime())))
  }, [refreshedProductUrls])

  // const mostRecentCrawl =
  //   allCrawlDates.length > 0 ? new Date(Math.max(...allCrawlDates.map((d) => d.getTime()))) : null

  const isRecentlyUpdated = useMemo(() => {
    if (!mostRecentCrawl) return false
    const TEN_MINUTES = 10 * 60 * 1000
    return Date.now() - mostRecentCrawl.getTime() < TEN_MINUTES
  }, [mostRecentCrawl])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id="sheet"
        side="right"
        className="overflow-y-auto p-4 bg-[#e6f3ff] w-full sm:max-w-lg"
      >
        <SheetHeader>
          <div className="w-full flex items-center justify-center gap-4">
            {productImageUrl && (
              <div className="relative w-28 h-28 bg-white flex-shrink-0 rounded-lg overflow-hidden">
                <Image
                  src={productImageUrl}
                  alt={name}
                  fill
                  className="object-contain"
                  sizes="96px"
                />
              </div>
            )}
            <div className="w-full flex flex-col gap-2">
              <SheetTitle className="mb-2 text-[#212a72] text-xl text-left">{name}</SheetTitle>
              <div className="flex items-center w-full gap-2">
                {refreshedProductUrls.length > 0 && (
                  <a
                    href={refreshedProductUrls[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-1/2"
                  >
                    <Button
                      variant="default"
                      size="icon"
                      className="cursor-pointer border border-[#212a72] hover:bg-white hover:border-none duration-150 rounded-lg w-full"
                    >
                      <ExternalLink className="size-4 text-[#212a72]" />
                    </Button>
                  </a>
                )}
                {collectionProductId && (
                  <a
                    href={`https://mobile140.com/dashboard/store/products?id=${collectionProductId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-1/2"
                  >
                    <Button
                      variant="default"
                      size="icon"
                      className="cursor-pointer text-white border-none bg-[#212a72] hover:bg-white hover:text-[#212a72] duration-150 rounded-lg w-full"
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                  </a>
                )}
              </div>
              {torobUrl && (
                <a
                  href={`https://panel.torob.com/s/product?error_reason=all&was_accessible=all&availability=all&is_active=all&torob_category=0&q=${torobUrl}&pageSize=50&sortById=&sortByDesc=false&checked_for_merge=all&stock_status=all&show_as_offline=all&instance_id=9327&problems=all`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full"
                >
                  <Button
                    variant="default"
                    size="icon"
                    className="cursor-pointer border border-transparent bg-white text-red-400 hover:border-red-400 duration-150 rounded-lg w-full"
                  >
                    <RefreshCcw className="size-4" />
                    رفــرش تربـــــ
                  </Button>
                </a>
              )}
              <div className="w-full flex flex-col md:flex-row gap-2">
                <EditableUSDProduct id={productId} usd={usd ?? 0} onUsdChange={onUsdChange} />
                <EditableAedProduct id={productId} aed={aed ?? 0} onAedChange={onAedChange} />
              </div>
            </div>
          </div>
          <SheetDescription>
            <span className="text-xs text-neutral-700 block my-1">آخرین بروزرسانی</span>
            <span className="text-sm text-neutral-700">
              {mostRecentCrawl ? formatDate(mostRecentCrawl) : 'هنوز بروزرسانی نشده'}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            {lowestPriceInfo && (
              <div
                className={cn(
                  'bg-transparent rounded-lg p-4 border-white duration-150 transition-colors',
                  isRecentlyUpdated ? 'border-green-600 bg-green-500/20' : 'bg-white',
                )}
              >
                <div className="flex items-center justify-between gap-6">
                  <span className="text-sm font-medium text-[#212a72] flex items-center gap-2">
                    پایین ترین قیمت
                    <ChevronsLeft className="size-4 text-green-400" />
                    {getSiteLabel(lowestPriceInfo.site)}
                  </span>
                  {isRecentlyUpdated && (
                    <Badge
                      variant="outline"
                      className="text-green-600 gap-3 rounded-lg border-green-600 bg-white text-xs px-3 py-2"
                    >
                      <span className="relative flex size-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex size-3 rounded-full bg-green-500"></span>
                      </span>
                      تازه بروز شده
                    </Badge>
                  )}
                </div>
              </div>
            )}
            <RefreshPriceIcon productId={productId} onRefreshComplete={handleRefreshComplete} />
          </div>
          {/* Current Prices List */}
          <div className="rounded-lg p-4 border-none bg-white">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-medium text-gray-600">قیمت‌های فعلی</h4>
              <Button
                className="cursor-pointer text-[#284e8f] text-xs bg-[#e6f3ff] rounded-lg"
                onClick={() => {
                  const urls = refreshedProductUrls.map((u) => u.url).filter(Boolean)
                  const encoded = encodeURIComponent(JSON.stringify(urls))
                  window.open(`/open-all?urls=${encoded}`, '_blank')
                }}
              >
                باز کردن همه سایت‌ها
                <SquareStack className="size-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {sortedCurrentPrices.map((urlEntry, index) => {
                const siteKey = toSiteKey(urlEntry.site)

                const isUnavailable = urlEntry.crawlError === 'Product not available'
                const isPriceNotFound = urlEntry.crawlError === 'Price not found'

                const price = urlEntry.currentPrice

                return (
                  <div key={index} className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded text-xs ${SITES[siteKey ?? 'torob']?.className || 'bg-gray-200 text-black'}`}
                    >
                      <a href={urlEntry.url} target="_blank" rel="noopener noreferrer">
                        {getSiteLabel(siteKey)}
                      </a>
                    </span>
                    {isUnavailable ? (
                      <span className="text-base text-orange-400">ناموجود</span>
                    ) : isPriceNotFound || price == null ? (
                      <span className="text-sm text-gray-500">
                        قیمت نامشخص (احتمالا ناموجود یا بلاک IP)
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-neutral-700">
                          {formatPrice(price, true)}
                        </span>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer"
                          onClick={() => handleCopyPrice(price, index)}
                          title="کپی قیمت"
                        >
                          {copiedIndex === index ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>

                        <a href={urlEntry.url} target="_blank" rel="noopener noreferrer">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-pointer text-[#212a72]"
                          >
                            <ExternalLink className="size-4" />
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Per-Site Sections */}
          {sortedCurrentPrices.map((urlEntry, index) => {
            const siteKey = toSiteKey(urlEntry.site)

            const siteLabel = getSiteLabel(siteKey)
            const siteClass = getSiteClass(siteKey)

            const priceChange = calculatePriceChange(urlEntry.priceHistory ?? [])

            return (
              <div key={index} className="space-y-4">
                <div className="rounded-lg p-4 border-none bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`rounded-lg px-4 py-1 ${siteClass}`}>
                        <a href={urlEntry.url} target="_blank" rel="noopener noreferrer">
                          {siteLabel}
                        </a>
                      </Badge>

                      <Badge
                        variant={
                          urlEntry.crawlStatus === 'success'
                            ? 'success'
                            : urlEntry.crawlStatus === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className="rounded-lg px-4 py-1"
                      >
                        {urlEntry.crawlStatus === 'success'
                          ? 'موفق'
                          : urlEntry.crawlStatus === 'failed'
                            ? 'ناموفق'
                            : 'در انتظار'}
                      </Badge>
                    </div>

                    <a href={urlEntry.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                        <ExternalLink className="size-4 text-[#212a72]" />
                      </Button>
                    </a>
                  </div>

                  {urlEntry.lastCrawledAt && (
                    <div className="text-xs text-neutral-700 mb-3">
                      آخرین بروزرسانی: {formatDate(new Date(urlEntry.lastCrawledAt))}
                    </div>
                  )}

                  {urlEntry.crawlError && (
                    <div className="bg-red-50 border border-red-800 rounded-lg p-2 mb-3">
                      <p className="text-xs text-red-800">
                        {urlEntry.crawlError === 'Product not available'
                          ? 'ناموجود'
                          : urlEntry.crawlError === 'Price not found'
                            ? 'احتمالا ناموجود'
                            : urlEntry.crawlError}
                      </p>
                    </div>
                  )}

                  {priceChange && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-[#212a72]">تغییر قیمت:</span>

                        {priceChange.isIncrease && (
                          <div className="flex items-center gap-1 text-green-500">
                            <span>
                              افزایش {formatPrice(Math.abs(priceChange.change), true)} (
                              {new Intl.NumberFormat('fa-IR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(Math.abs(priceChange.percentage))}
                              %)
                            </span>
                            <TrendingUp className="h-4 w-4" />
                          </div>
                        )}

                        {priceChange.isDecrease && (
                          <div className="flex items-center gap-1 text-red-500">
                            <span>
                              کاهش {formatPrice(Math.abs(priceChange.change), true)} (
                              {new Intl.NumberFormat('fa-IR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(Math.abs(priceChange.percentage))}
                              %)
                            </span>
                            <TrendingUp className="h-4 w-4 rotate-180" />
                          </div>
                        )}

                        {!priceChange.isIncrease && !priceChange.isDecrease && (
                          <span className="text-gray-400">بدون تغییر</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {urlEntry.priceHistory && urlEntry.priceHistory.length > 0 && (
                  <div className=" rounded-lg p-4 border-none bg-white">
                    <h4 className="text-sm font-medium text-[#212a72] mb-4">
                      تاریخچه قیمت ({siteLabel})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {urlEntry.priceHistory
                        .slice()
                        .sort((a, b) => {
                          const dateA = a.crawledAt ? new Date(a.crawledAt).getTime() : 0
                          const dateB = b.crawledAt ? new Date(b.crawledAt).getTime() : 0
                          return dateB - dateA
                        })
                        .map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="flex items-center justify-between py-2 px-3 rounded-lg border-none bg-[#e6f3ff]"
                          >
                            <span className="text-sm font-medium text-neutral-700">
                              {formatPrice(item.price, true)}
                            </span>
                            <span className="text-xs text-gray-600">
                              {item.crawledAt ? formatDate(new Date(item.crawledAt)) : 'نامشخص'}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
