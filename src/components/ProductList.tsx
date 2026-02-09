'use client'

import { isMobile140Unavailable } from '@/lib/utils/sort'
import { ProductLink, Setting } from '@/payload-types'
import { useMemo } from 'react'
import ProductRowDetail from './ProductRowDetail'

interface ProductListProps {
  products: ProductLink[]
  settings?: Setting
}

export default function ProductList({ products, settings }: ProductListProps) {
  // Enrich once
  const enrichedProducts = useMemo(
    () =>
      products.map((product) => ({
        ...product,
        _mobile140Unavailable: isMobile140Unavailable(product.productUrls ?? []),
      })),
    [products],
  )

  // Always sort – stable (keeps original order when availability is equal)
  const displayedProducts = useMemo(() => {
    return [...enrichedProducts].sort((a, b) => {
      const aUn = a._mobile140Unavailable
      const bUn = b._mobile140Unavailable

      if (aUn !== bUn) {
        return aUn ? 1 : -1
      }

      return 0 // stable – original order preserved
    })
  }, [enrichedProducts])

  if (displayedProducts.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-600">
        <svg
          className="mx-auto h-16 w-16 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-neutral-900">محصولی یافت نشد</h3>
        <p className="mt-2 text-sm text-neutral-500">
          برای شروع، یک لینک محصول در پنل مدیریت اضافه کنید.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-4 md:gap-5">
        {displayedProducts.map((product) => (
          <ProductRowDetail
            key={product.id}
            {...(product as ProductLink)}
            settings={settings}
            crawlStatus={product.crawlStatus ?? 'pending'}
            productImageUrl={
              typeof product.productImage === 'object' && product.productImage?.url
                ? product.productImage.url
                : typeof product.productImage === 'string'
                  ? product.productImage
                  : undefined
            }
          />
        ))}
      </div>{' '}
    </div>
  )
}

// 'use client'

// import { useEffect, useMemo, useState, useTransition } from 'react'
// import ProductCard from './ProductCard'
// import ProductRow from './ProductRow'
// import ProductRowDetail from './ProductRowDetail'
// import { PriceHistoryItem, ProductUrl } from '@/types/products'
// import { Setting } from '@/payload-types'
// import { isMobile140Unavailable } from '@/lib/utils/sort'
// import { Button } from './ui/button'

// interface Product {
//   id: string
//   name: string
//   productId?: string | null
//   productImageUrl?: string | null
//   usd?: number | null
//   aed?: number | null
//   productUrls: ProductUrl[]
//   url: string
//   site: string
//   currentPrice: number | null
//   lastCrawledAt: Date | string | null
//   crawlStatus: 'pending' | 'success' | 'failed'
//   crawlError?: string | null
//   priceHistory?: PriceHistoryItem[]
// }

// interface ProductListProps {
//   products: Product[]
//   view: 'grid' | 'list' | 'detail'
//   onViewChange?: (view: 'grid' | 'list' | 'detail') => void
//   settings?: Setting
// }

// const VIEW_KEY = 'products:view'

// export default function ProductList({ products, view, onViewChange, settings }: ProductListProps) {
//   const [sortByMobile140, setSortByMobile140] = useState(true)
//   const [isPending, startTransition] = useTransition()
//   // const sortedProducts = useMemo(() => {
//   //   if (!sortByMobile140) return products

//   //   return [...products].sort((a, b) => {
//   //     const aUnavailable = isMobile140Unavailable(a.productUrls)
//   //     const bUnavailable = isMobile140Unavailable(b.productUrls)

//   //     // available first
//   //     if (aUnavailable && !bUnavailable) return 1
//   //     if (!aUnavailable && bUnavailable) return -1
//   //     return 0
//   //   })
//   // }, [products, sortByMobile140])
//   // Precompute mobile availability once per product
//   const productsWithAvailability = useMemo(
//     () =>
//       products.map((p) => ({
//         ...p,
//         mobile140Unavailable: isMobile140Unavailable(p.productUrls),
//       })),
//     [products],
//   )

//   // Sort based on mobile availability
//   const sortedProducts = useMemo(() => {
//     if (!sortByMobile140) return productsWithAvailability
//     return [...productsWithAvailability].sort((a, b) => {
//       if (a.mobile140Unavailable && !b.mobile140Unavailable) return 1
//       if (!a.mobile140Unavailable && b.mobile140Unavailable) return -1
//       return 0
//     })
//   }, [productsWithAvailability, sortByMobile140])

//   useEffect(() => {
//     localStorage.setItem(VIEW_KEY, view)
//   }, [view])

//   // Persist view on change
//   useEffect(() => {
//     localStorage.setItem(VIEW_KEY, view)
//   }, [view])

//   if (products.length === 0) {
//     return (
//       <div className="text-center py-12">
//         <svg
//           className="mx-auto h-12 w-12 text-neutral-700"
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth={2}
//             d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
//           />
//         </svg>
//         <h3 className="mt-2 text-sm font-medium text-gray-900">محصولی یافت نشد</h3>
//         <p className="mt-1 text-sm text-gray-500">
//           برای شروع، یک لینک محصول در پنل مدیریت اضافه کنید.
//         </p>
//       </div>
//     )
//   }

//   return (
//     <div>
//       <div className="flex gap-2 mb-4">
//         <Button
//           onClick={() => {
//             startTransition(() => {
//               setSortByMobile140((v) => !v)
//             })
//           }}
//           disabled={isPending}
//           className={`border cursor-pointer px-3 py-1 rounded-lg text-xs flex items-center gap-2
//   ${sortByMobile140 ? 'bg-sky-600 border-none text-white' : 'border-gray-400 text-gray-500'}
//   ${isPending ? 'opacity-60 cursor-not-allowed' : ''}
// `}
//         >
//           {isPending && (
//             <span className="size-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
//           )}
//           مرتب‌سازی بر اساس موجودی موبایل ۱۴۰
//         </Button>
//       </div>
//       {view === 'grid' ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {sortedProducts.map((product) => (
//             <ProductCard
//               key={product.id}
//               id={product.id}
//               name={product.name}
//               productId={product.productId}
//               productUrls={product.productUrls}
//               url={product.url}
//               site={product.site || 'torob'}
//               productImageUrl={product.productImageUrl}
//               currentPrice={product.currentPrice}
//               lastCrawledAt={product.lastCrawledAt}
//               crawlStatus={product.crawlStatus}
//               crawlError={product.crawlError}
//               priceHistory={product.priceHistory}
//             />
//           ))}
//         </div>
//       ) : view === 'list' ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//           {sortedProducts.map((product) => (
//             <ProductRow
//               key={product.id}
//               id={product.id}
//               name={product.name}
//               productId={product.productId}
//               productImageUrl={product.productImageUrl}
//               productUrls={product.productUrls}
//             />
//           ))}
//         </div>
//       ) : view === 'detail' ? (
//         <div className="flex flex-col gap-4">
//           {sortedProducts.map((product) => (
//             <ProductRowDetail
//               key={product.id}
//               id={product.id}
//               name={product.name}
//               productId={product.productId}
//               productImageUrl={product.productImageUrl}
//               usd={product.usd}
//               aed={product.aed}
//               settings={settings}
//               productUrls={product.productUrls}
//             />
//           ))}
//         </div>
//       ) : null}
//     </div>
//   )
// }
