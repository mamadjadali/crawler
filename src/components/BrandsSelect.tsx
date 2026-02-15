'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Origami, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton' // ← make sure this is imported (shadcn/ui)

interface Brands {
  id: string
  name: string
  count?: number
}

interface BrandsSelectProps {
  value?: string
  onChange: (brandId: string) => void
}

export default function BrandsSelect({ value, onChange }: BrandsSelectProps) {
  const [brands, setBrands] = useState<Brands[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/custom/brands')
      .then((res) => res.json())
      .then((data) => {
        setBrands(data.brands || [])
      })
      .catch((err) => {
        console.error('Failed to fetch brands', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // ────────────────────────────────────────────────
  // Loading / undefined value states
  // ────────────────────────────────────────────────
  // if (value === undefined) {
  //   return null // parent hasn't hydrated value yet — hide completely
  // }

  if (loading) {
    return (
      <div className="relative w-full">
        <Skeleton className="h-9 w-full rounded-lg bg-gray-400/70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────
  // Real select — now safe to render
  // ────────────────────────────────────────────────
  const currentValue = value || '__all__'

  return (
    <Select
      dir="rtl"
      value={currentValue}
      onValueChange={(next) => {
        onChange(next === '__all__' ? '' : next)
      }}
      disabled={loading} // extra safety
    >
      <SelectTrigger className="w-full rounded-lg border border-gray-400 bg-transparent text-neutral-700">
        <SelectValue placeholder="همه برنــدها" />
        {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-70" />}
      </SelectTrigger>

      <SelectContent className="rounded-lg bg-white border border-gray-400 max-h-[320px]">
        <SelectItem value="__all__" className="py-2.5">
          <div className="flex items-center gap-2">
            <Origami className="h-4 w-4" />
            همه برنــدها
          </div>
        </SelectItem>

        {brands.map((brand) => (
          <SelectItem
            key={brand.id}
            value={brand.id}
            className="py-2.5 hover:text-blue-400 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span>{brand.name}</span>
              <span className="text-gray-400 text-xs tabular-nums">
                {(brand.count ?? 0).toLocaleString('fa-IR')}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
