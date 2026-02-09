'use client'

import { useState } from 'react'
import RefreshPriceIcon from './RefreshPriceIcon'
import { formatPrice, formatDate } from '@/lib/utils/formatPrice'
import { ProductLink } from '@/payload-types'

interface PriceHistoryItem {
  price: number
  crawledAt: string | Date
}

interface PriceDropdownProps {
  productId: string
  currentPrice: number | null
  lastCrawledAt: Date | string | null
  priceHistory?: PriceHistoryItem[]
  crawlStatus?: 'pending' | 'success' | 'failed'
  crawlError?: string | null
}

export default function PriceDropdown({
  productId,
  currentPrice,
  lastCrawledAt,
  priceHistory = [],
  crawlStatus = 'pending',
  crawlError,
}: PriceDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [refreshedPrice, setRefreshedPrice] = useState<number | null>(currentPrice)

  const handleRefreshComplete = (data: { productUrls?: ProductLink['productUrls'] }) => {
    // Extract the first available price from the refreshed URLs
    const firstPrice =
      data.productUrls?.find((url) => url.currentPrice !== null)?.currentPrice ?? null
    setRefreshedPrice(firstPrice)
    // Refresh the page after a short delay to show updated data
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    }
  }

  const displayPrice = refreshedPrice ?? currentPrice

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="font-medium text-gray-700 dark:text-gray-300">جزئیات قیمت</span>
        <svg
          className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4 animate-fade-in">
          {/* Current Price */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                قیمت فعلی
              </span>
              <RefreshPriceIcon productId={productId} onRefreshComplete={handleRefreshComplete} />
            </div>
            {displayPrice !== null ? (
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(displayPrice, true)}
              </div>
            ) : (
              <div className="text-lg text-gray-500 dark:text-gray-400">قیمت نامشخص</div>
            )}
          </div>

          {/* Status and Last Crawled */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">وضعیت</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  crawlStatus === 'success'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : crawlStatus === 'failed'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}
              >
                {crawlStatus === 'success'
                  ? 'موفق'
                  : crawlStatus === 'failed'
                    ? 'ناموفق'
                    : 'در انتظار'}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                آخرین بروزرسانی
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {lastCrawledAt ? formatDate(lastCrawledAt) : 'هنوز بروزرسانی نشده'}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {crawlError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{crawlError}</p>
            </div>
          )}

          {/* Price History */}
          {priceHistory && priceHistory.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تاریخچه قیمت
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {priceHistory
                  .slice()
                  .reverse()
                  .map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
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
      )}
    </div>
  )
}
