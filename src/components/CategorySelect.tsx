'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SlidersHorizontal } from 'lucide-react'
import { useAuth } from '@/context/AuthProvider'

interface Category {
  id: string
  name: string
  count?: number
}

interface CategorySelectProps {
  value?: string
  onChange: (categoryId: string) => void
}

export default function CategorySelect({ value = '', onChange }: CategorySelectProps) {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [selected, setSelected] = useState<string>(value || '__all__')

  const allowedCategoryIds = user.visibleCategories?.map((c: any) => c.id)

  useEffect(() => {
    fetch('/api/custom/category')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories))
      .catch((err) => console.error('Failed to fetch categories', err))
  }, [])

  useEffect(() => {
    setSelected(value && value !== '' ? value : '__all__')
  }, [value])

  const visibleCategories = categories.filter((cat) => {
    // keep selected to avoid broken state
    if (cat.id === selected) return true

    // no preference set → show all
    if (!allowedCategoryIds || allowedCategoryIds.length === 0) {
      return true
    }

    return allowedCategoryIds.includes(cat.id)
  })

  return (
    <Select
      dir="rtl"
      value={selected}
      onValueChange={(next) => {
        if (next === '__all__') {
          setSelected('__all__')
          onChange('')
          return
        }
        setSelected(next)
        onChange(next)
      }}
    >
      <SelectTrigger className="w-full rounded-lg border border-gray-400 bg-transparent text-neutral-700">
        <SelectValue placeholder="همه دسته‌بندی‌ها" />
      </SelectTrigger>
      <SelectContent className="rounded-lg bg-white border border-gray-400">
        <SelectItem value="__all__">
          <SlidersHorizontal />
          همه دسته‌بندی‌ها
        </SelectItem>
        {visibleCategories.map((cat) => (
          <SelectItem className="hover:text-blue-400 cursor-pointer" key={cat.id} value={cat.id}>
            {cat.name}
            <span className="text-gray-400 text-xs">
              {(cat.count ?? 0).toLocaleString('fa-IR')}
            </span>{' '}
            {/* ← count */}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
