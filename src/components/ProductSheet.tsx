'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import RefreshPriceIcon from './RefreshPriceIcon'
import { formatPrice, formatDate } from '@/lib/utils/formatPrice'
import { ArrowBigLeftDash, ChevronsLeft, ExternalLink, PencilIcon, TrendingUp, Copy, Check } from 'lucide-react'

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
}

export default function ProductSheet({
  open,
  onOpenChange,
  productId,
  collectionProductId,
  name,
  productImageUrl,
  productUrls = [],
}: ProductSheetProps) {
  const [refreshedProductUrls, setRefreshedProductUrls] = useState<ProductUrl[]>(productUrls)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Sync state when props change (e.g., when opening sheet with different product)
  useEffect(() => {
    setRefreshedProductUrls(productUrls)
  }, [productUrls])

  const handleCopyPrice = async (price: number, index: number) => {
    try {
      await navigator.clipboard.writeText(price.toString())
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy price:', err)
    }
  }

  const handleRefreshComplete = (data: {
    productUrls?: ProductUrl[]
  }) => {
    if (data.productUrls) {
      setRefreshedProductUrls(data.productUrls.map((urlEntry) => ({
        ...urlEntry,
        lastCrawledAt: urlEntry.lastCrawledAt
          ? (typeof urlEntry.lastCrawledAt === 'string' ? new Date(urlEntry.lastCrawledAt) : urlEntry.lastCrawledAt)
          : null,
        priceHistory: (urlEntry.priceHistory || []).map((item) => ({
          ...item,
          crawledAt: typeof item.crawledAt === 'string' ? new Date(item.crawledAt) : item.crawledAt,
        })),
      })))
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
      .map((urlEntry) => ({
        price: urlEntry.currentPrice,
        site: urlEntry.site,
        siteName: urlEntry.site === 'torob' ? 'تربـــ' : urlEntry.site === 'technolife' ? 'تکنولایفــ' : urlEntry.site,
      }))
      .filter((item) => item.price !== null && item.price !== undefined)
    
    if (pricesWithSites.length === 0) return null
    
    const lowest = pricesWithSites.reduce((min, current) => 
      (current.price as number) < (min.price as number) ? current : min
    )
    
    return {
      price: lowest.price as number,
      site: lowest.site,
      siteName: lowest.siteName,
    }
  }, [refreshedProductUrls])

  // Get most recent crawl date
  const allCrawlDates = refreshedProductUrls
    .map((urlEntry) => urlEntry.lastCrawledAt)
    .filter((date) => date !== null && date !== undefined)
    .map((date) => typeof date === 'string' ? new Date(date) : date)
  const mostRecentCrawl = allCrawlDates.length > 0
    ? new Date(Math.max(...allCrawlDates.map((d: Date) => d.getTime())))
    : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto p-4 bg-[#0a0a0a] w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center justify-center gap-4">
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
            <div className="flex flex-col gap-2">
              <SheetTitle className="mb-2">{name}</SheetTitle>
              <div className="flex items-center w-full gap-2">
                {refreshedProductUrls.length > 0 && (
                  <a
                    href={refreshedProductUrls[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-1/2"
                  >
                    <Button variant="default" size="icon" className="cursor-pointer border border-gray-400 rounded-lg w-full">
                      <ExternalLink className="size-4" />
                    </Button>
                  </a>
                )}
                {collectionProductId && (
                  <a
                    href={`https://mobile140.com/dashboard/store/product/${collectionProductId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-1/2"
                  >
                    <Button variant="default" size="icon" className="cursor-pointer border border-blue-400 rounded-lg w-full">
                      <PencilIcon className="size-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
          <SheetDescription>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                آخرین بروزرسانی
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {mostRecentCrawl ? formatDate(mostRecentCrawl) : 'هنوز بروزرسانی نشده'}
              </span>
            </div>
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Lowest Price Indicator Section */}
          {lowestPriceInfo && (
            <div className="bg-transparent rounded-lg p-4 border border-gray-400">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white flex items-center gap-2">
                  پایین ترین قیمت 
                  <ChevronsLeft className="size-4 text-green-400" />
                   {lowestPriceInfo.siteName === 'technolife' ? 'تکنولایفــ' : lowestPriceInfo.siteName === 'torob' ? 'تربـــ' : lowestPriceInfo.siteName}
                </span>
                <RefreshPriceIcon
                  productId={productId}
                  onRefreshComplete={handleRefreshComplete}
                />
              </div>
            </div>
          )}

          {/* Current Prices List */}
          <div className="bg-transparent rounded-lg p-4 border border-gray-400">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              قیمت‌های فعلی
            </h4>
            <div className="space-y-2">
              {refreshedProductUrls.map((urlEntry, index) => {
                const siteName = urlEntry.site === 'torob' ? 'تربـــ' : urlEntry.site === 'technolife' ? 'تکنولایفــ' : urlEntry.site
                const siteColorClass = urlEntry.site === 'technolife'
                  ? 'text-blue-400'
                  : 'text-rose-400'
                return (
                  <div key={index} className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${siteColorClass}`}>{siteName} :</span>
                    {urlEntry.currentPrice !== null ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-white">
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
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">قیمت نامشخص</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Per-Site Sections */}
          {refreshedProductUrls.map((urlEntry, index) => {
            const siteName = urlEntry.site === 'torob' ? 'تربـــ' : urlEntry.site === 'technolife' ? 'تکنولایفــ' : urlEntry.site
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
                            ? 'border border-blue-900 bg-[#223266]/50 text-white'
                            : 'border border-rose-400 bg-rose-400/20 text-white'
                        }`}
                      >
                        {siteName}
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
                    <a
                      href={urlEntry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                        <ExternalLink className="size-4" />
                      </Button>
                    </a>
                  </div>

                  {/* Last crawled */}
                  {urlEntry.lastCrawledAt && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      آخرین بروزرسانی: {formatDate(urlEntry.lastCrawledAt)}
                    </div>
                  )}

                  {/* Error message */}
                  {urlEntry.crawlError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 mb-3">
                      <p className="text-xs text-red-800 dark:text-red-200">{urlEntry.crawlError}</p>
                    </div>
                  )}

                  {/* Price Change */}
                  {priceChange && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400 dark:text-gray-500">
                          تغییر قیمت ({siteName}):
                        </span>
                        {priceChange.isIncrease && (
                          <div className="flex items-center gap-1 text-green-500">
                            <span>
                              افزایش {formatPrice(Math.abs(priceChange.change), true)} ({new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(priceChange.percentage))}%)
                            </span>
                            <TrendingUp className="h-4 w-4" />
                          </div>
                        )}
                        {priceChange.isDecrease && (
                          <div className="flex items-center gap-1 text-red-500">
                            <span>
                              کاهش {formatPrice(Math.abs(priceChange.change), true)} ({new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(priceChange.percentage))}%)
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
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      تاریخچه قیمت ({siteName})
                    </h4>
                    <div className="space-y-2 scrollbar-hide max-h-64 overflow-y-auto">
                      {urlEntry.priceHistory
                        .slice()
                        .sort((a, b) => {
                          const dateA = typeof a.crawledAt === 'string' ? new Date(a.crawledAt) : a.crawledAt
                          const dateB = typeof b.crawledAt === 'string' ? new Date(b.crawledAt) : b.crawledAt
                          return dateB.getTime() - dateA.getTime() // Newest first
                        })
                        .map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="flex items-center justify-between py-2 px-3 bg-transparent rounded-lg border border-gray-400"
                          >
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatPrice(item.price, true)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
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
