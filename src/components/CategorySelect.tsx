'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  const [categories, setCategories] = useState<Category[]>([])
  const [selected, setSelected] = useState<string>(value || '__all__')
  useEffect(() => {
    fetch('/api/custom/category')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories))
      .catch((err) => console.error('Failed to fetch categories', err))
  }, [])

  useEffect(() => {
    setSelected(value && value !== '' ? value : '__all__')
  }, [value])

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
      <SelectTrigger className="w-full rounded-lg border border-blue-400 bg-transparent text-neutral-700">
        <SelectValue placeholder="همه دسته‌بندی‌ها" />
      </SelectTrigger>
      <SelectContent className="rounded-lg bg-white border border-gray-400">
        <SelectItem value="__all__">همه دسته‌بندی‌ها</SelectItem>
        {categories.map((cat) => (
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
