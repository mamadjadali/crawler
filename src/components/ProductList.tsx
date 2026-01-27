'use client'

import { useState, useEffect } from 'react'
import ProductCard from './ProductCard'
import ProductRow from './ProductRow'

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

interface Product {
  id: string
  name: string
  productId?: string | null
  productImageUrl?: string | null
  productUrls: ProductUrl[]
  url: string
  site: string
  currentPrice: number | null
  lastCrawledAt: Date | string | null
  crawlStatus: 'pending' | 'success' | 'failed'
  crawlError?: string | null
  priceHistory?: PriceHistoryItem[]
}

interface ProductListProps {
  products: Product[]
  view: 'grid' | 'list'
  onViewChange?: (view: 'grid' | 'list') => void
}

const VIEW_KEY = 'products:view'

export default function ProductList({ products, view, onViewChange }: ProductListProps) {
  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view)
  }, [view])

  // Persist view on change
  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view)
  }, [view])

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-neutral-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">محصولی یافت نشد</h3>
        <p className="mt-1 text-sm text-gray-500">
          برای شروع، یک لینک محصول در پنل مدیریت اضافه کنید.
        </p>
      </div>
    )
  }

  return (
    <div>
      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              productId={product.productId}
              productUrls={product.productUrls}
              url={product.url}
              site={product.site || 'torob'}
              productImageUrl={product.productImageUrl}
              currentPrice={product.currentPrice}
              lastCrawledAt={product.lastCrawledAt}
              crawlStatus={product.crawlStatus}
              crawlError={product.crawlError}
              priceHistory={product.priceHistory}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {products.map((product) => (
            <ProductRow
              key={product.id}
              id={product.id}
              name={product.name}
              productId={product.productId}
              productImageUrl={product.productImageUrl}
              productUrls={product.productUrls}
            />
          ))}
        </div>
      )}
    </div>
  )
}
