'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SlidersHorizontal, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthProvider'
import { Skeleton } from '@/components/ui/skeleton' // ← add this import (shadcn/ui)

interface Category {
  id: string
  name: string
  count?: number
}

interface CategorySelectProps {
  value?: string
  onChange: (categoryId: string) => void
}

export default function CategorySelect({ value, onChange }: CategorySelectProps) {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const allowedCategoryIds = user?.visibleCategories?.map((c: Category) => c.id) ?? []

  useEffect(() => {
    setLoading(true)
    fetch('/api/custom/category')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || [])
      })
      .catch((err) => {
        console.error('Failed to fetch categories', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const visibleCategories = categories.filter(
    (cat) => allowedCategoryIds.length === 0 || allowedCategoryIds.includes(cat.id),
  )

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
      disabled={loading} // optional: extra safety
    >
      <SelectTrigger className="w-full rounded-lg border border-gray-400 bg-transparent text-neutral-700">
        <SelectValue placeholder="همه دسته‌بندی‌ها" />
        {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-70" />}
      </SelectTrigger>

      <SelectContent className="rounded-lg bg-white border border-gray-400 max-h-[320px]">
        <SelectItem value="__all__" className="py-2.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            همه دسته‌بندی‌ها
          </div>
        </SelectItem>

        {visibleCategories.map((cat) => (
          <SelectItem
            key={cat.id}
            value={cat.id}
            className="py-2.5 hover:text-blue-400 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span>{cat.name}</span>
              <span className="text-gray-400 mr-2 text-xs tabular-nums">
                {(cat.count ?? 0).toLocaleString('fa-IR')}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
