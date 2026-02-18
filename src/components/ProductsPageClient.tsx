'use client'

import type { ProductLink, Setting } from '@/payload-types'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import BrandsSelect from './BrandsSelect'
import CategorySelect from './CategorySelect'
import ProductList from './ProductList'
import RefreshCategoryButton from './RefreshCategoryButton'
import SearchInput from './SearchInput'

interface ProductsPageClientProps {
  initialProducts: ProductLink[]
  settings: Setting
  // initialFilters?: { q?: string; category?: string; brand?: string } // optional / unused now
}

export default function ProductsPageClient({ initialProducts, settings }: ProductsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Use local state that syncs with prop when it changes
  const [products, setProducts] = useState(initialProducts)

  // Sync when server sends new data (important after navigation)
  useEffect(() => {
    setProducts(initialProducts)
    console.log('initialProducts updated →', initialProducts.length) // debug
  }, [initialProducts])

  const searchQuery = searchParams.get('q') || ''
  const selectedCategory = searchParams.get('category') ?? undefined
  const selectedBrand = searchParams.get('brand') || ''

  const hasActiveFilters = useMemo(
    () => !!(searchQuery || selectedCategory || selectedBrand),
    [searchQuery, selectedCategory, selectedBrand],
  )

  // Helper to update URL params cleanly
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          next.set(key, value)
        } else {
          next.delete(key)
        }
      })
      startTransition(() => {
        router.push(`/products?${next.toString()}`)
      })
    },
    [router, searchParams],
  )

  const handleSearch = useCallback(
    (query: string) => {
      if (query.trim() === searchQuery.trim()) return
      updateParams({ q: query || undefined })
    },
    [updateParams, searchQuery],
  )

  return (
    <>
      {/* Filters & Controls */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:flex-wrap">
        <div className="grow-7">
          <SearchInput
            onSearch={handleSearch}
            value={searchQuery}
            placeholder="جستجو بر اساس نام یا شناسه ..."
          />
        </div>

        <div className="w-full md:w-48 grow-3">
          <CategorySelect
            value={selectedCategory}
            onChange={(cat) => updateParams({ category: cat || undefined })}
          />
        </div>

        <div className="w-full md:w-48 grow-3">
          <BrandsSelect
            value={selectedBrand}
            onChange={(brand) => updateParams({ brand: brand || undefined })}
          />
        </div>

        <div className="flex items-center gap-3">
          <RefreshCategoryButton category={selectedCategory ?? ''} brand={selectedBrand} />
        </div>
      </div>

      {/* 1️⃣ Loading has top priority */}
      {isPending ? (
        <div className="my-40 flex flex-col items-center gap-4 text-sm text-gray-500">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-gray-300 border-t-[#212a72]" />
          در حال جستجو …
        </div>
      ) : products.length === 0 && hasActiveFilters ? (
        /* 2️⃣ Empty state (only when not loading) */
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">هیچ محصولی با فیلترهای انتخاب‌شده یافت نشد</p>
          <p className="mt-2 text-sm">فیلترها را تغییر دهید یا همه دسته‌بندی‌ها را انتخاب کنید</p>
        </div>
      ) : (
        /* 3️⃣ Normal content */
        <ProductList products={products} settings={settings} />
      )}
    </>
  )
}
