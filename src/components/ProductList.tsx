'use client'

import { isMobile140Unavailable } from '@/lib/utils/sort'
import { ProductLink, Setting } from '@/payload-types'
import { useEffect, useMemo, useState } from 'react'
import ProductRowDetail from './ProductRowDetail'

interface ProductListProps {
  products: ProductLink[]
  settings?: Setting
}

export default function ProductList({ products: initialProducts, settings }: ProductListProps) {
  const [products, setProducts] = useState(initialProducts)

  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])
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

  // if (displayedProducts.length === 0) {
  //   return (
  //     <div className="text-center py-16 text-neutral-600">
  //       <svg
  //         className="mx-auto h-16 w-16 text-neutral-400"
  //         fill="none"
  //         stroke="currentColor"
  //         viewBox="0 0 24 24"
  //         aria-hidden="true"
  //       >
  //         <path
  //           strokeLinecap="round"
  //           strokeLinejoin="round"
  //           strokeWidth={1.5}
  //           d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
  //         />
  //       </svg>
  //       <h3 className="mt-4 text-lg font-medium text-neutral-900">محصولی یافت نشد</h3>
  //       <p className="mt-2 text-sm text-neutral-500">
  //         برای شروع، یک لینک محصول در پنل مدیریت اضافه کنید.
  //       </p>
  //     </div>
  //   )
  // }

  // Callback to update a single product in the list
  const handleProductUpdate = (updatedProduct: ProductLink) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p)),
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
            onProductUpdate={handleProductUpdate}
          />
        ))}
      </div>{' '}
    </div>
  )
}
