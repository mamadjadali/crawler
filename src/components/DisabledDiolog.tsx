'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { ProductLink } from '@/payload-types'
import { useState } from 'react'
import { GiSightDisabled } from 'react-icons/gi'
import DisableProductButton from './DisableProduct'

export default function DisabledProductsDialog() {
  const [products, setProducts] = useState<ProductLink[]>([])
  const [loading, setLoading] = useState(false)

  const loadProducts = async () => {
    setLoading(true)
    const res = await fetch('/api/custom/disabled')
    const json = await res.json()
    setProducts(json.data ?? [])
    setLoading(false)
  }

  const hideProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId))
  }

  return (
    <Dialog onOpenChange={(open) => open && loadProducts()}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-lg shadow-none cursor-pointer hover:-translate-y-1 duration-100 border-none bg-white text-[#212a72]"
        >
          <GiSightDisabled />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] sm:max-w-xl overflow-y-auto">
        <DialogTitle />
        <DialogHeader className="mt-8 font-medium text-base text-[#212a72]">
          محصولاتـ غیرفعال
        </DialogHeader>
        {loading && (
          <div className="my-20 flex flex-col items-center gap-4 text-sm text-gray-500">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-gray-300 border-t-[#212a72]" />
            در حال جستجو …
          </div>
        )}

        {/* Empty state */}
        {!loading && products.length === 0 && (
          <div className="my-24 flex flex-col items-center gap-4 text-sm text-gray-500">
            <GiSightDisabled className="h-10 w-10 text-gray-400" />
            هیچ محصول غیرفعالی وجود ندارد
          </div>
        )}

        {!loading &&
          products.map((p) => (
            <div
              key={p.id}
              className="flex gap-1 text-[#212a72] justify-between items-center hover:-translate-y-1 duration-100 border-none bg-white p-4 rounded-lg"
            >
              {p.name}
              <DisableProductButton
                productId={p.id}
                initialDisabled={true}
                onHide={() => hideProduct(p.id)}
              />
            </div>
          ))}
      </DialogContent>
    </Dialog>
  )
}
