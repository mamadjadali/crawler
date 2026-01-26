'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Origami } from 'lucide-react'

interface Brands {
  id: string
  name: string
  count?: number
}

interface BrandsSelectProps {
  value?: string
  onChange: (brandId: string) => void
}

export default function BrandsSelect({ value = '', onChange }: BrandsSelectProps) {
  const [brands, setBrands] = useState<Brands[]>([])
  const [selected, setSelected] = useState<string>(value || '__all__')
  useEffect(() => {
    fetch('/api/custom/brands')
      .then((res) => res.json())
      .then((data) => setBrands(data.brands))
      .catch((err) => console.error('Failed to fetch brands', err))
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
      <SelectTrigger className="w-full rounded-lg border border-gray-400 bg-transparent text-neutral-700">
        <SelectValue placeholder="همه برنــدها" />
      </SelectTrigger>
      <SelectContent className="rounded-lg bg-white border border-gray-400">
        <SelectItem value="__all__">
          <Origami />
          همه برنــدها
        </SelectItem>
        {brands.map((brand) => (
          <SelectItem
            className="hover:text-blue-400 cursor-pointer"
            key={brand.id}
            value={brand.id}
          >
            {brand.name}
            <span className="text-gray-400 text-xs">
              {(brand.count ?? 0).toLocaleString('fa-IR')}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
