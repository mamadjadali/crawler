'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import SearchInput from './SearchInput'
import ProductList from './ProductList'
import { detectSite } from '@/lib/utils/detectSite'

interface ProductUrl {
  url: string
  site: string
  currentPrice: number | null
  lastCrawledAt: Date | string | null
  crawlStatus: 'pending' | 'success' | 'failed'
  crawlError?: string | null
  priceHistory?: Array<{
    price: number
    crawledAt: string | Date
  }>
}

interface Product {
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
  priceHistory?: Array<{
    price: number
    crawledAt: string | Date
  }>
}

interface ProductsPageClientProps {
  initialProducts: Product[]
}

export default function ProductsPageClient({ initialProducts }: ProductsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [isSearching, setIsSearching] = useState(false)
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('')

  const searchQuery = searchParams.get('q') || ''

  useEffect(() => {
    // Only perform search if query actually changed
    if (searchQuery === lastSearchQuery) {
      return
    }

    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setProducts(initialProducts)
        setIsSearching(false)
        setLastSearchQuery('')
        return
      }

      setIsSearching(true)
      setLastSearchQuery(searchQuery)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          // Transform search results to match Product interface
          const transformedProducts = data.docs.map((product: any) => {
            let productImageUrl: string | null = null
            if (product.productImage && typeof product.productImage === 'object' && product.productImage.url) {
              productImageUrl = product.productImage.url
            } else if (typeof product.productImage === 'string') {
              productImageUrl = product.productImage
            }

            // Handle productUrls array
            const productUrls = product.productUrls || []
            const prices = productUrls
              .map((urlEntry: any) => urlEntry.currentPrice)
              .filter((price: any) => price !== null && price !== undefined)
            const lowestPrice = prices.length > 0 ? Math.min(...prices) : null

            const allCrawlDates = productUrls
              .map((urlEntry: any) => urlEntry.lastCrawledAt)
              .filter((date: any) => date !== null && date !== undefined)
              .map((date: string) => new Date(date))
            const mostRecentCrawl = allCrawlDates.length > 0
              ? new Date(Math.max(...allCrawlDates.map((d: Date) => d.getTime())))
              : null

            const hasSuccess = productUrls.some((urlEntry: any) => urlEntry.crawlStatus === 'success')
            const hasFailed = productUrls.some((urlEntry: any) => urlEntry.crawlStatus === 'failed')
            const overallStatus: 'pending' | 'success' | 'failed' = hasSuccess
              ? 'success'
              : hasFailed
                ? 'failed'
                : 'pending'

            const allPriceHistory = productUrls.flatMap((urlEntry: any) =>
              (urlEntry.priceHistory || []).map((item: any) => ({
                price: item.price,
                crawledAt: item.crawledAt ? new Date(item.crawledAt) : new Date(),
                site: urlEntry.site,
                url: urlEntry.url,
              }))
            )

            return {
              id: product.id,
              name: product.name || 'بدون نام',
              productId: product.productId || null,
              productImageUrl,
              productUrls: productUrls.map((urlEntry: any) => {
                // Always verify site matches URL to ensure correctness
                let site = urlEntry.site
                try {
                  const detectedSite = detectSite(urlEntry.url || '')
                  // If site field is missing, invalid, or doesn't match URL, use detected site
                  if (!site || (site !== 'torob' && site !== 'technolife' && site !== 'mobile140' && site !== 'gooshionline' && site !== 'kasrapars') || site !== detectedSite) {
                    site = detectedSite
                  }
                } catch {
                  // If URL is invalid, keep original site or default to torob
                  if (!site || (site !== 'torob' && site !== 'technolife' && site !== 'mobile140' && site !== 'gooshionline' && site !== 'kasrapars')) {
                    site = 'torob'
                  }
                }
                
                return {
                  url: urlEntry.url || '',
                  site: site,
                  currentPrice: urlEntry.currentPrice ?? null,
                  lastCrawledAt: urlEntry.lastCrawledAt
                    ? new Date(urlEntry.lastCrawledAt)
                    : null,
                  crawlStatus: (urlEntry.crawlStatus as 'pending' | 'success' | 'failed') || 'pending',
                  crawlError: urlEntry.crawlError || null,
                  priceHistory: (urlEntry.priceHistory || []).map((item: any) => ({
                    price: item.price,
                    crawledAt: item.crawledAt ? new Date(item.crawledAt) : new Date(),
                  })),
                }
              }),
              // Legacy fields
              url: productUrls.length > 0 ? productUrls[0].url : '',
              site: productUrls.length > 0 ? productUrls[0].site : 'torob',
              currentPrice: lowestPrice,
              lastCrawledAt: mostRecentCrawl,
              crawlStatus: overallStatus,
              crawlError: productUrls.find((urlEntry: any) => urlEntry.crawlError)?.crawlError || null,
              priceHistory: allPriceHistory,
            }
          })
          setProducts(transformedProducts)
        } else {
          setProducts([])
        }
      } catch (error) {
        console.error('Search error:', error)
        setProducts([])
      } finally {
        setIsSearching(false)
      }
    }

    performSearch()
  }, [searchQuery, lastSearchQuery, initialProducts])

  const handleSearch = useCallback((query: string) => {
    const currentQuery = searchParams.get('q') || ''
    // Only navigate if query actually changed
    if (query === currentQuery) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    if (query) {
      params.set('q', query)
    } else {
      params.delete('q')
    }
    router.push(`/products?${params.toString()}`)
  }, [router, searchParams])

  return (
    <>
      {/* Search Input */}
      <div className="mb-8">
        <div className="max-w-md">
          <SearchInput
            onSearch={handleSearch}
            placeholder="جستجو بر اساس نام، شناسه یا لینک محصول..."
            initialValue={searchQuery}
          />
        </div>
      </div>

      {/* Product List */}
      {isSearching ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          <p className="mt-4 text-gray-400">در حال جستجو...</p>
        </div>
      ) : (
        <ProductList products={products} />
      )}
    </>
  )
}

