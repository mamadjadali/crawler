'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchInputProps {
  value?: string
  onSearch: (query: string) => void
  placeholder?: string
  debounceMs?: number
}

export default function SearchInput({
  value = '',
  onSearch,
  placeholder = 'جستجو...',
  debounceMs = 300,
}: SearchInputProps) {
  const [query, setQuery] = useState(value)

  // Keep local state in sync with URL / parent
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => {
      onSearch(query.trim())
    }, debounceMs)

    return () => clearTimeout(id)
  }, [query, debounceMs, onSearch])

  return (
    <div className="relative w-full">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-700" />

      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pr-10 pl-10 bg-transparent shadow-none rounded-lg border border-gray-400 text-neutral-700 placeholder:text-sm placeholder:text-gray-500"
        dir="rtl"
      />

      {query && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setQuery('')}
          className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-neutral-700"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
