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
import { formatDate, formatPrice } from '@/lib/utils/formatPrice'
import { cn } from '@/lib/utils/utils'
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
import RefreshPriceIcon from './RefreshPriceIcon'

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

interface ProductSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  collectionProductId?: string | null
  name: string
  productImageUrl?: string | null
  productUrls: ProductUrl[]
  onUrlsUpdate?: React.Dispatch<React.SetStateAction<ProductUrl[]>> //
}

export default function ProductSheet({
  open,
  onOpenChange,
  productId,
  collectionProductId,
  name,
  productImageUrl,
  productUrls = [],
  onUrlsUpdate, // ← add this
}: ProductSheetProps) {
  const [refreshedProductUrls, setRefreshedProductUrls] = useState<ProductUrl[]>(productUrls)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Sync state when props change (e.g., when opening sheet with different product)
  useEffect(() => {
    setRefreshedProductUrls(productUrls)
  }, [productUrls])

  const torobUrl = useMemo(() => {
    return productUrls.find((u) => u.site === 'torob')?.url ?? null
  }, [productUrls])
  // const handleCopyPrice = async (price: number, index: number) => {
  //   try {
  //     await navigator.clipboard.writeText(price.toString())
  //     setCopiedIndex(index)
  //     setTimeout(() => setCopiedIndex(null), 2000)
  //   } catch (err) {
  //     console.error('Failed to copy price:', err)
  //   }
  // }

  const handleCopyPrice = (price: number, index: number) => {
    if (typeof window === 'undefined') return // ensure client
    const text = price.toString()

    const copyText = async () => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text)
        } else {
          const textArea = document.createElement('textarea')
          textArea.value = text
          textArea.style.position = 'fixed'
          textArea.style.top = '-1000px'
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
        }
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
      } catch (err) {
        console.error('Copy failed', err)
        alert('کپی انجام نشد. لطفاً دستی کپی کنید.')
      }
    }

    copyText()
  }

  // const handleRefreshComplete = (data: { productUrls?: ProductUrl[] }) => {
  //   if (data.productUrls) {
  //     setRefreshedProductUrls(
  //       data.productUrls.map((urlEntry) => ({
  //         ...urlEntry,
  //         lastCrawledAt: urlEntry.lastCrawledAt
  //           ? typeof urlEntry.lastCrawledAt === 'string'
  //             ? new Date(urlEntry.lastCrawledAt)
  //             : urlEntry.lastCrawledAt
  //           : null,
  //         priceHistory: (urlEntry.priceHistory || []).map((item) => ({
  //           ...item,
  //           crawledAt:
  //             typeof item.crawledAt === 'string' ? new Date(item.crawledAt) : item.crawledAt,
  //         })),
  //       })),
  //     )
  //   }
  // }
  const handleRefreshComplete = (data: { productUrls?: ProductUrl[] }) => {
    if (data.productUrls) {
      const updatedUrls = data.productUrls.map((urlEntry) => ({
        ...urlEntry,
        lastCrawledAt: urlEntry.lastCrawledAt
          ? typeof urlEntry.lastCrawledAt === 'string'
            ? new Date(urlEntry.lastCrawledAt)
            : urlEntry.lastCrawledAt
          : null,
        priceHistory: (urlEntry.priceHistory || []).map((item) => ({
          ...item,
          crawledAt: typeof item.crawledAt === 'string' ? new Date(item.crawledAt) : item.crawledAt,
        })),
      }))

      setRefreshedProductUrls(updatedUrls)

      // Sync back to parent
      onUrlsUpdate?.(updatedUrls)
    }
  }

  // Helper function to calculate price change per site
  const calculatePriceChange = (priceHistory: PriceHistoryItem[]) => {
    if (!priceHistory || priceHistory.length < 2) return null

    const sorted = [...priceHistory].sort((a, b) => {
      const dateA = typeof a.crawledAt === 'string' ? new Date(a.crawledAt) : a.crawledAt
      const dateB = typeof b.crawledAt === 'string' ? new Date(b.crawledAt) : b.crawledAt
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

  // Get lowest price and which site has it
  const lowestPriceInfo = useMemo(() => {
    const pricesWithSites = refreshedProductUrls
      .filter((urlEntry) => urlEntry.currentPrice !== null && !urlEntry.crawlError)
      .map((urlEntry) => ({
        price: urlEntry.currentPrice,
        site: urlEntry.site,
        siteName:
          urlEntry.site === 'torob'
            ? 'تربـــ'
            : urlEntry.site === 'technolife'
              ? 'تکنولایفــ'
              : urlEntry.site === 'mobile140'
                ? 'موبایل۱۴۰'
                : urlEntry.site,
      }))
      .filter((item) => item.price !== null && item.price !== undefined)

    if (pricesWithSites.length === 0) return null

    const lowest = pricesWithSites.reduce((min, current) =>
      (current.price as number) < (min.price as number) ? current : min,
    )

    return {
      price: lowest.price as number,
      site: lowest.site,
      siteName: lowest.siteName,
    }
  }, [refreshedProductUrls])

  const sortedCurrentPrices = useMemo(() => {
    return [...refreshedProductUrls].sort((a, b) => {
      // unavailable / unknown prices go to bottom
      if (a.currentPrice == null) return 1
      if (b.currentPrice == null) return -1

      return a.currentPrice - b.currentPrice // lowest first
    })
  }, [refreshedProductUrls])

  // Get most recent crawl date
  const allCrawlDates = refreshedProductUrls
    .map((urlEntry) => urlEntry.lastCrawledAt)
    .filter((date) => date !== null && date !== undefined)
    .map((date) => (typeof date === 'string' ? new Date(date) : date))
  const mostRecentCrawl =
    allCrawlDates.length > 0
      ? new Date(Math.max(...allCrawlDates.map((d: Date) => d.getTime())))
      : null

  const isRecentlyUpdated = useMemo(() => {
    if (!mostRecentCrawl) return false
    const FIVE_MINUTES = 5 * 60 * 1000
    return Date.now() - mostRecentCrawl.getTime() < FIVE_MINUTES
  }, [mostRecentCrawl])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id="sheet"
        side="right"
        className="overflow-y-auto p-4 bg-white w-full sm:max-w-lg"
      >
        <SheetHeader>
          <div className="w-full flex items-center justify-center gap-4">
            {/* Product Image */}
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
              <SheetTitle className="mb-2 text-neutral-700 text-xl text-left">{name}</SheetTitle>
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
                      className="cursor-pointer border border-gray-400 rounded-lg w-full"
                    >
                      <ExternalLink className="size-4" />
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
                      className="cursor-pointer border border-blue-400 rounded-lg w-full"
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
                    className="cursor-pointer border text-red-400 border-red-400 rounded-lg w-full"
                  >
                    <RefreshCcw className="size-4" />
                    رفــرش تربـــــ
                  </Button>
                </a>
              )}
            </div>
          </div>
          <SheetDescription>
            {/* <div> */}
            <span className="text-xs text-neutral-700 block my-1">آخرین بروزرسانی</span>
            <span className="text-sm text-neutral-700">
              {mostRecentCrawl ? formatDate(mostRecentCrawl) : 'هنوز بروزرسانی نشده'}
            </span>
            {/* </div> */}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Lowest Price Indicator Section */}
          {lowestPriceInfo && (
            // <div className="bg-transparent rounded-lg p-4 border border-gray-400">
            <div
              className={cn(
                'bg-transparent rounded-lg p-4 border transition-colors',
                isRecentlyUpdated ? 'border-green-600 bg-green-500/20' : 'border-gray-400',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                  پایین ترین قیمت
                  <ChevronsLeft className="size-4 text-green-400" />
                  {lowestPriceInfo.siteName === 'technolife'
                    ? 'تکنولایفــ'
                    : lowestPriceInfo.siteName === 'torob'
                      ? 'تربـــ'
                      : lowestPriceInfo.siteName === 'mobile140'
                        ? 'موبایل۱۴۰'
                        : lowestPriceInfo.siteName === 'gooshionline'
                          ? 'گوشی آنلاین'
                          : lowestPriceInfo.siteName === 'kasrapars'
                            ? 'کسری پلاس'
                            : lowestPriceInfo.siteName}
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
                <RefreshPriceIcon productId={productId} onRefreshComplete={handleRefreshComplete} />
              </div>
            </div>
          )}

          {/* Current Prices List */}
          <div className="bg-transparent rounded-lg p-4 border border-gray-400">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                قیمت‌های فعلی
              </h4>
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
                              : urlEntry.site
                const siteColorClass =
                  urlEntry.site === 'technolife'
                    ? 'text-blue-700'
                    : urlEntry.site === 'mobile140'
                      ? 'text-sky-600'
                      : urlEntry.site === 'gooshionline'
                        ? 'text-gray-400'
                        : urlEntry.site === 'kasrapars'
                          ? 'text-yellow-400'
                          : urlEntry.site === 'farnaa'
                            ? 'text-[#d90268]'
                            : 'text-rose-400'
                return (
                  <div key={index} className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${siteColorClass}`}>
                      <a href={urlEntry.url} target="_blank" rel="noopener noreferrer">
                        {siteName} :
                      </a>
                    </span>
                    {urlEntry.crawlError === 'Product not available' ? (
                      <span className="text-base text-orange-400">ناموجود</span>
                    ) : urlEntry.currentPrice !== null ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-neutral-700">
                          {formatPrice(urlEntry.currentPrice, true)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer"
                          onClick={() => handleCopyPrice(urlEntry.currentPrice!, index)}
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
                            className="h-8 w-8 cursor-pointer text-blue-400"
                          >
                            <ExternalLink className="size-4" />
                          </Button>
                        </a>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">قیمت نامشخص</span>
                    )}
                    {/* <Separator className="my-2 border-gray-400 border-b" /> */}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Per-Site Sections */}
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
                          : urlEntry.site
            const priceChange = calculatePriceChange(urlEntry.priceHistory || [])

            return (
              <div key={index} className="space-y-4">
                {/* Site Section */}
                <div className="bg-transparent rounded-lg p-4 border border-gray-400">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`rounded-lg px-4 py-1 ${
                          urlEntry.site === 'technolife'
                            ? 'border border-blue-900 bg-[#223266]/50 text-blue-900'
                            : urlEntry.site === 'mobile140'
                              ? 'border border-sky-600 bg-sky-600/20 text-sky-600'
                              : urlEntry.site === 'gooshionline'
                                ? 'border border-gray-400 bg-gray-400/20 text-gray-400'
                                : urlEntry.site === 'kasrapars'
                                  ? 'border border-yellow-400 bg-yellow-400/20 text-yellow-400'
                                  : urlEntry.site === 'farnaa'
                                    ? 'border border-pink-600 bg-pink-600/20 text-pink-600'
                                    : 'border border-rose-400 bg-rose-400/20 text-rose-400'
                        }`}
                      >
                        <a href={urlEntry.url} target="_blank" rel="noopener noreferrer">
                          {siteName}
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
                        <ExternalLink className="size-4" />
                      </Button>
                    </a>
                  </div>

                  {/* Last crawled */}
                  {urlEntry.lastCrawledAt && (
                    <div className="text-xs text-neutral-700 mb-3">
                      آخرین بروزرسانی: {formatDate(urlEntry.lastCrawledAt)}
                    </div>
                  )}

                  {/* Error message */}
                  {urlEntry.crawlError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-800 rounded-lg p-2 mb-3">
                      <p className="text-xs text-red-800 ">
                        {urlEntry.crawlError === 'Product not available'
                          ? 'ناموجود'
                          : urlEntry.crawlError}
                      </p>
                    </div>
                  )}

                  {/* Price Change */}
                  {priceChange && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-neutral-700">تغییر قیمت ({siteName}):</span>
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

                {/* Price History List for this Site */}
                {urlEntry.priceHistory && urlEntry.priceHistory.length > 0 && (
                  <div className="bg-transparent rounded-lg p-4 border border-gray-400">
                    <h4 className="text-sm font-medium text-neutral-700 mb-4">
                      تاریخچه قیمت ({siteName})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {urlEntry.priceHistory
                        .slice()
                        .sort((a, b) => {
                          const dateA =
                            typeof a.crawledAt === 'string' ? new Date(a.crawledAt) : a.crawledAt
                          const dateB =
                            typeof b.crawledAt === 'string' ? new Date(b.crawledAt) : b.crawledAt
                          return dateB.getTime() - dateA.getTime() // Newest first
                        })
                        .map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="flex items-center justify-between py-2 px-3 bg-transparent rounded-lg border border-gray-400"
                          >
                            <span className="text-sm font-medium text-neutral-700">
                              {formatPrice(item.price, true)}
                            </span>
                            <span className="text-xs text-gray-600">
                              {formatDate(item.crawledAt)}
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
