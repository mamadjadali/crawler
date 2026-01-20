'use client'

import { useState, useEffect } from 'react'

interface Category {
  id: string
  name: string
}

interface CategorySelectProps {
  value?: string
  onChange: (categoryId: string) => void
}

export default function CategorySelect({ value = '', onChange }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selected, setSelected] = useState(value)

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories))
      .catch((err) => console.error('Failed to fetch categories', err))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelected(e.target.value)
    onChange(e.target.value)
  }

  return (
    <select
      value={selected}
      onChange={handleChange}
      className="border rounded-lg px-3 py-2 text-white bg-transparent border-gray-400"
    >
      <option value="">همه دسته‌بندی‌ها</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  )
}
