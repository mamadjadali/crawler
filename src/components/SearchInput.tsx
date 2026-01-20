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
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white" />

      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pr-10 pl-10 bg-transparent rounded-lg border border-gray-400 text-white placeholder:text-sm placeholder:text-gray-500"
        dir="rtl"
      />

      {query && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setQuery('')}
          className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

// 'use client'

// import { useState, useEffect, useRef } from 'react'
// import { Input } from '@/components/ui/input'
// import { Search, X, Loader2 } from 'lucide-react'
// import { Button } from '@/components/ui/button'

// interface SearchInputProps {
//   onSearch: (query: string) => void
//   placeholder?: string
//   initialValue?: string
// }

// export default function SearchInput({
//   onSearch,
//   placeholder = 'جستجو...',
//   initialValue = '',
// }: SearchInputProps) {
//   const [query, setQuery] = useState(initialValue)
//   const [isLoading, setIsLoading] = useState(false)
//   const lastSearchRef = useRef<string>(initialValue)
//   const timeoutRef = useRef<NodeJS.Timeout | null>(null)

//   // Sync with initialValue prop (from URL)
//   useEffect(() => {
//     if (initialValue !== query) {
//       setQuery(initialValue)
//       lastSearchRef.current = initialValue
//     }
//   }, [initialValue])

//   // Debounce search
//   useEffect(() => {
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current)
//     }

//     timeoutRef.current = setTimeout(() => {
//       const trimmedQuery = query.trim()
//       // Only call onSearch if query actually changed
//       if (trimmedQuery !== lastSearchRef.current) {
//         lastSearchRef.current = trimmedQuery
//         if (trimmedQuery !== '') {
//           setIsLoading(true)
//           onSearch(trimmedQuery)
//           // Reset loading after a short delay
//           setTimeout(() => setIsLoading(false), 300)
//         } else {
//           onSearch('')
//           setIsLoading(false)
//         }
//       }
//     }, 300)

//     return () => {
//       if (timeoutRef.current) {
//         clearTimeout(timeoutRef.current)
//       }
//     }
//   }, [query, onSearch])

//   const handleClear = () => {
//     setQuery('')
//     onSearch('')
//   }

//   return (
//     <div className="relative w-full">
//       <div className="relative">
//         <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white" />
//         <Input
//           type="text"
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           placeholder={placeholder}
//           className="pr-10 pl-10 bg-transparent rounded-lg border border-gray-400 text-white placeholder:text-sm  placeholder:text-gray-500"
//           dir="rtl"
//         />
//         {isLoading && (
//           <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
//         )}
//         {query && !isLoading && (
//           <Button
//             variant="ghost"
//             size="icon"
//             onClick={handleClear}
//             className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-white"
//           >
//             <X className="h-4 w-4" />
//           </Button>
//         )}
//       </div>
//     </div>
//   )
// }
