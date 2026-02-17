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

// 'use client'

// import { detectSiteFromUrl, type Site } from '@/domain/product/site'
// import type { ProductLink, Setting } from '@/payload-types'
// import { useRouter, useSearchParams } from 'next/navigation'
// import { useCallback, useEffect, useMemo, useState } from 'react'
// import BrandsSelect from './BrandsSelect'
// import CategorySelect from './CategorySelect'
// import ProductList from './ProductList'
// import RefreshCategoryButton from './RefreshCategoryButton'
// import SearchInput from './SearchInput'

// interface ProductsPageClientProps {
//   initialProducts: ProductLink[]
//   settings: Setting
// }

// export default function ProductsPageClient({ initialProducts, settings, initialFilters }: ProductsPageClientProps) {
//   const router = useRouter()
//   const searchParams = useSearchParams()

//   const searchQuery = searchParams.get('q') || ''
//   // const selectedCategory = searchParams.get('category') || ''
//   const rawCategory = searchParams.get('category')
//   const selectedCategory = rawCategory === null ? undefined : rawCategory
//   const selectedBrand = searchParams.get('brand') || ''

//   const hasFilters = useMemo(
//     () => !!(searchQuery || selectedCategory || selectedBrand),
//     [searchQuery, selectedCategory, selectedBrand],
//   )

//   const [products, setProducts] = useState<ProductLink[]>(initialProducts)
//   const [isSearching, setIsSearching] = useState(false)

//   // Helper to update URL params cleanly
//   const updateParams = useCallback(
//     (updates: Record<string, string | undefined>) => {
//       const next = new URLSearchParams(searchParams.toString())
//       Object.entries(updates).forEach(([key, value]) => {
//         if (value) next.set(key, value)
//         else next.delete(key)
//       })
//       router.push(`/products?${next.toString()}`)
//     },
//     [router, searchParams],
//   )

//   const handleSearch = useCallback(
//     (query: string) => {
//       if (query.trim() === searchQuery.trim()) return
//       updateParams({ q: query || undefined })
//     },
//     [updateParams, searchQuery],
//   )

//   // Re-fetch when filters change
//   useEffect(() => {
//     // Reset to initial products when no filters are active
//     if (!searchQuery && !selectedCategory && !selectedBrand) {
//       setProducts(initialProducts)
//       setIsSearching(false)
//       return
//     }

//     let isCurrent = true

//     const doSearch = async () => {
//       setIsSearching(true)
//       try {
//         const qs = new URLSearchParams({
//           ...(searchQuery && { q: searchQuery }),
//           ...(selectedCategory && { category: selectedCategory }),
//           ...(selectedBrand && { brand: selectedBrand }),
//         })

//         const res = await fetch(`/api/search?${qs}`)
//         if (!res.ok) throw new Error(`Search failed: ${res.status}`)

//         const data = await res.json()
//         const searchResults = (data.docs || []) as ProductLink[]

//         const normalized = searchResults.map((product) => {
//           const fixedUrls = (product.productUrls ?? []).map((entry) => {
//             const normalizedEntry = {
//               ...entry,
//               site: (entry.site ?? detectSiteFromUrl(entry.url ?? '') ?? 'torob') as Site,
//             }

//             return {
//               ...normalizedEntry,
//               // No currentPrice here, but if you add other fields later, cast them too
//             }
//           }) satisfies ProductLink['productUrls']

//           return {
//             ...product,
//             productUrls: fixedUrls,
//           }
//         })

//         if (isCurrent) {
//           setProducts(normalized)
//         }
//       } catch (err) {
//         console.error('Search failed:', err)
//         if (isCurrent) setProducts([])
//       } finally {
//         if (isCurrent) setIsSearching(false)
//       }
//     }

//     doSearch()

//     return () => {
//       isCurrent = false
//     }
//   }, [hasFilters, searchQuery, selectedCategory, selectedBrand, initialProducts])

//   return (
//     <>
//       {/* Filters & Controls */}
//       <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:flex-wrap">
//         <div className="w-full md:max-w-md">
//           <SearchInput
//             onSearch={handleSearch}
//             value={searchQuery}
//             placeholder="جستجو بر اساس نام یا شناسه ..."
//           />
//         </div>

//         <div className="w-full md:w-56">
//           <CategorySelect
//             value={selectedCategory}
//             onChange={(cat) => updateParams({ category: cat || undefined })}
//           />
//         </div>

//         <div className="w-full md:w-56">
//           <BrandsSelect
//             value={selectedBrand}
//             onChange={(brand) => updateParams({ brand: brand || undefined })}
//           />
//         </div>

//         <div className="flex items-center gap-3">
//           <RefreshCategoryButton category={selectedCategory ?? ''} brand={selectedBrand} />
//         </div>
//       </div>

//       {/* Content */}
//       {hasFilters ? (
//         isSearching ? (
//           <div className="flex flex-col items-center justify-center py-20 text-gray-500">
//             <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600" />
//             <p className="mt-4">در حال بارگذاری...</p>
//           </div>
//         ) : (
//           <ProductList products={products} settings={settings} />
//         )
//       ) : (
//         <ProductList products={initialProducts} settings={settings} />
//       )}
//     </>
//   )
// }

// 'use client'

// import { detectSite } from '@/lib/utils/detectSite'
// import { Form, LayoutGrid, LayoutList } from 'lucide-react'
// import { useRouter, useSearchParams } from 'next/navigation'
// import { useCallback, useEffect, useState } from 'react'
// import BrandsSelect from './BrandsSelect'
// import CategorySelect from './CategorySelect'
// import ProductList from './ProductList'
// import RefreshCategoryButton from './RefreshCategoryButton'
// import SearchInput from './SearchInput'
// import { Button } from './ui/button'
// import { ProductUrl } from '@/types/products'
// import { Setting } from '@/payload-types'

// interface Product {
//   id: string
//   name: string
//   productId?: string | null
//   productImageUrl?: string | null
//   usd?: number | null
//   aed?: number | null
//   productUrls: ProductUrl[]
//   // Legacy fields for backward compatibility
//   url: string
//   site: string
//   currentPrice: number | null
//   lastCrawledAt: Date | string | null
//   crawlStatus: 'pending' | 'success' | 'failed'
//   crawlError?: string | null
//   priceHistory?: Array<{
//     price: number
//     crawledAt: string | Date
//   }>
// }

// interface ProductsPageClientProps {
//   initialProducts: Product[]
//   settings: Setting
// }

// // interface Brand {
// //   id: string
// //   name: string
// //   categoryId: string // <-- add this
// //   count?: number
// // }

// type ViewMode = 'grid' | 'list' | 'detail'
// const VIEW_KEY = 'products:view'

// export default function ProductsPageClient({ initialProducts, settings }: ProductsPageClientProps) {
//   const router = useRouter()
//   const searchParams = useSearchParams()
//   const [products, setProducts] = useState<Product[]>(initialProducts)
//   const [isSearching, setIsSearching] = useState(false)
//   const [lastSearchQuery, setLastSearchQuery] = useState<string>('')
//   const [lastCategory, setLastCategory] = useState<string>('')
//   const [lastSelectedBrand, setLastSelectedBrand] = useState<string>('')

//   const [view, setView] = useState<ViewMode>('detail')
//   const [isViewLoaded, setIsViewLoaded] = useState(false)

//   // Load persisted view
//   useEffect(() => {
//     const saved = localStorage.getItem(VIEW_KEY) as ViewMode | null
//     if (saved === 'grid' || saved === 'list' || saved === 'detail') setView(saved)
//     setIsViewLoaded(true) // mark view as loaded
//   }, [])

//   // Persist changes
//   useEffect(() => {
//     localStorage.setItem(VIEW_KEY, view)
//   }, [view])

//   const searchQuery = searchParams.get('q') || ''
//   const selectedCategory = searchParams.get('category') || ''
//   const selectedBrand = searchParams.get('brand') || ''

//   useEffect(() => {
//     // Only perform fetch if the inputs actually changed
//     if (
//       searchQuery === lastSearchQuery &&
//       selectedCategory === lastCategory &&
//       selectedBrand === lastSelectedBrand
//     ) {
//       return
//     }

//     const performSearch = async () => {
//       const q = searchQuery.trim()
//       const category = selectedCategory.trim()

//       if (!q && !category && !selectedBrand) {
//         setProducts(initialProducts)
//         setIsSearching(false)
//         setLastSearchQuery('')
//         setLastCategory('')
//         setLastSelectedBrand('')
//         return
//       }

//       setIsSearching(true)
//       setLastSearchQuery(searchQuery)
//       setLastCategory(selectedCategory)
//       setLastSelectedBrand(selectedBrand)
//       try {
//         const params = new URLSearchParams()
//         if (q) params.set('q', q)
//         if (category) params.set('category', category)
//         if (selectedBrand) params.set('brand', selectedBrand)
//         const response = await fetch(`/api/search?${params.toString()}`)
//         if (response.ok) {
//           const data = await response.json()
//           // Transform search results to match Product interface
//           const transformedProducts = data.docs.map((product: any) => {
//             let productImageUrl: string | null = null
//             if (
//               product.productImage &&
//               typeof product.productImage === 'object' &&
//               product.productImage.url
//             ) {
//               productImageUrl = product.productImage.url
//             } else if (typeof product.productImage === 'string') {
//               productImageUrl = product.productImage
//             }

//             // Handle productUrls array
//             const productUrls = product.productUrls || []
//             const prices = productUrls
//               .map((urlEntry: any) => urlEntry.currentPrice)
//               .filter((price: any) => price !== null && price !== undefined)
//             const lowestPrice = prices.length > 0 ? Math.min(...prices) : null

//             const allCrawlDates = productUrls
//               .map((urlEntry: any) => urlEntry.lastCrawledAt)
//               .filter((date: any) => date !== null && date !== undefined)
//               .map((date: string) => new Date(date))
//             const mostRecentCrawl =
//               allCrawlDates.length > 0
//                 ? new Date(Math.max(...allCrawlDates.map((d: Date) => d.getTime())))
//                 : null

//             const hasSuccess = productUrls.some(
//               (urlEntry: any) => urlEntry.crawlStatus === 'success',
//             )
//             const hasFailed = productUrls.some((urlEntry: any) => urlEntry.crawlStatus === 'failed')
//             const overallStatus: 'pending' | 'success' | 'failed' = hasSuccess
//               ? 'success'
//               : hasFailed
//                 ? 'failed'
//                 : 'pending'

//             const allPriceHistory = productUrls.flatMap((urlEntry: any) =>
//               (urlEntry.priceHistory || []).map((item: any) => ({
//                 price: item.price,
//                 crawledAt: item.crawledAt ? new Date(item.crawledAt) : new Date(),
//                 site: urlEntry.site,
//                 url: urlEntry.url,
//               })),
//             )

//             return {
//               id: product.id,
//               name: product.name || 'بدون نام',
//               productId: product.productId || null,
//               productImageUrl,
//               usd: product.usd,
//               aed: product.aed,
//               productUrls: productUrls.map((urlEntry: any) => {
//                 // Always verify site matches URL to ensure correctness
//                 let site = urlEntry.site
//                 try {
//                   const detectedSite = detectSite(urlEntry.url || '')
//                   // If site field is missing, invalid, or doesn't match URL, use detected site
//                   if (
//                     !site ||
//                     (site !== 'torob' &&
//                       site !== 'technolife' &&
//                       site !== 'mobile140' &&
//                       site !== 'gooshionline' &&
//                       site !== 'kasrapars' &&
//                       site !== 'farnaa' &&
//                       site !== 'yaran' &&
//                       site !== 'zitro' &&
//                       site !== 'greenlion' &&
//                       site !== 'plazadigital' &&
//                       site !== 'zangooleh' &&
//                       site !== 'ithome' &&
//                       site !== 'xiaomi360' &&
//                       site !== 'positron' &&
//                       site !== 'empratour' &&
//                       site !== 'royalpart' &&
//                       site !== 'parhantech' &&
//                       site !== 'mobopart' &&
//                       site !== 'farako') ||
//                     site !== detectedSite
//                   ) {
//                     site = detectedSite
//                   }
//                 } catch {
//                   // If URL is invalid, keep original site or default to torob
//                   if (
//                     !site ||
//                     (site !== 'torob' &&
//                       site !== 'technolife' &&
//                       site !== 'mobile140' &&
//                       site !== 'gooshionline' &&
//                       site !== 'kasrapars' &&
//                       site !== 'farnaa' &&
//                       site !== 'yaran' &&
//                       site !== 'zitro' &&
//                       site !== 'greenlion' &&
//                       site !== 'plazadigital' &&
//                       site !== 'zangooleh' &&
//                       site !== 'ithome' &&
//                       site !== 'xiaomi360' &&
//                       site !== 'positron' &&
//                       site !== 'empratour' &&
//                       site !== 'royalpart' &&
//                       site !== 'parhantech' &&
//                       site !== 'mobopart' &&
//                       site !== 'farako')
//                   ) {
//                     site = 'torob'
//                   }
//                 }

//                 return {
//                   url: urlEntry.url || '',
//                   site: site,
//                   currentPrice: urlEntry.currentPrice ?? null,
//                   lastCrawledAt: urlEntry.lastCrawledAt ? new Date(urlEntry.lastCrawledAt) : null,
//                   crawlStatus:
//                     (urlEntry.crawlStatus as 'pending' | 'success' | 'failed') || 'pending',
//                   crawlError: urlEntry.crawlError || null,
//                   priceHistory: (urlEntry.priceHistory || []).map((item: any) => ({
//                     price: item.price,
//                     crawledAt: item.crawledAt ? new Date(item.crawledAt) : new Date(),
//                   })),
//                 }
//               }),
//               // Legacy fields
//               url: productUrls.length > 0 ? productUrls[0].url : '',
//               site: productUrls.length > 0 ? productUrls[0].site : 'torob',
//               currentPrice: lowestPrice,
//               lastCrawledAt: mostRecentCrawl,
//               crawlStatus: overallStatus,
//               crawlError:
//                 productUrls.find((urlEntry: any) => urlEntry.crawlError)?.crawlError || null,
//               priceHistory: allPriceHistory,
//             }
//           })
//           setProducts(transformedProducts)
//         } else {
//           setProducts([])
//         }
//       } catch (error) {
//         console.error('Search error:', error)
//         setProducts([])
//       } finally {
//         setIsSearching(false)
//       }
//     }

//     performSearch()
//   }, [
//     searchQuery,
//     selectedCategory,
//     selectedBrand,
//     lastSearchQuery,
//     lastCategory,
//     lastSelectedBrand,
//     initialProducts,
//   ])

//   const handleSearch = useCallback(
//     (query: string) => {
//       const currentQuery = searchParams.get('q') || ''
//       // Only navigate if query actually changed
//       if (query === currentQuery) {
//         return
//       }

//       const params = new URLSearchParams(searchParams.toString())
//       if (query) {
//         params.set('q', query)
//       } else {
//         params.delete('q')
//       }
//       router.push(`/products?${params.toString()}`)
//     },
//     [router, searchParams],
//   )

//   return (
//     <>
//       {/* Search Input */}
//       <div className="mb-8">
//         <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center md:gap-4">
//           <div className="w-full md:max-w-md">
//             <SearchInput
//               onSearch={handleSearch}
//               placeholder="جستجو بر اساس نام یا شناسه ..."
//               value={searchQuery}
//             />
//           </div>
//           <div className="w-full">
//             <CategorySelect
//               value={selectedCategory}
//               onChange={(catId) => {
//                 const params = new URLSearchParams(searchParams.toString())
//                 if (catId) params.set('category', catId)
//                 else params.delete('category')
//                 router.push(`/products?${params.toString()}`)
//               }}
//             />
//           </div>
//           <div className="w-full">
//             <BrandsSelect
//               value={selectedBrand}
//               onChange={(brandId) => {
//                 const params = new URLSearchParams(searchParams.toString())
//                 if (brandId) params.set('brand', brandId)
//                 else params.delete('brand')
//                 router.push(`/products?${params.toString()}`)
//               }}
//             />
//           </div>
//           {/* category Refresh */}
//           <RefreshCategoryButton category={selectedCategory} brand={selectedBrand} />

//           {/* View Toggle */}
//           <div className="flex border-none rounded-lg text-sm">
//             <Button
//               className={`px-3 py-1 ${view === 'grid' ? 'bg-neutral-700 text-white cursor-pointer' : 'bg-white text-neutral-700 cursor-pointer'}`}
//               onClick={() => setView('grid')}
//             >
//               <LayoutGrid />
//             </Button>
//             <Button
//               className={`px-3 py-1 ${view === 'list' ? 'bg-neutral-700 text-white cursor-pointer' : 'bg-white text-neutral-700 cursor-pointer'}`}
//               onClick={() => setView('list')}
//             >
//               <LayoutList />
//             </Button>
//             <Button
//               className={`px-3 py-1 ${view === 'detail' ? 'bg-neutral-700 text-white cursor-pointer' : 'bg-white text-neutral-700 cursor-pointer'}`}
//               onClick={() => setView('detail')}
//             >
//               <Form />
//             </Button>
//           </div>
//         </div>
//         {/* <ThemeSelector /> */}
//       </div>

//       {/* Product List */}
//       {isSearching || !isViewLoaded ? (
//         <div className="text-center py-12">
//           <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
//           <p className="mt-4 text-gray-400">در حال جستجو...</p>
//         </div>
//       ) : (
//         <ProductList products={products} view={view} settings={settings} />
//       )}
//     </>
//   )
// }
