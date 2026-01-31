'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ProductUrl } from '@/types/products'

interface RefreshPriceIconProps {
  productId: string
  onRefreshComplete?: (data: { productUrls?: ProductUrl[] }) => void
}

export default function RefreshPriceIcon({ productId, onRefreshComplete }: RefreshPriceIconProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRefresh = async () => {
    if (!productId || loading) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/refresh-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: productId }),
      })

      const data = await response.json()

      if (response.ok) {
        onRefreshComplete?.({
          productUrls: data.productUrls,
        })
      } else {
        setError(data.error || 'Failed to refresh price')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <Button
        onClick={handleRefresh}
        disabled={loading}
        variant="ghost"
        size="icon"
        className="h-8 w-8 cursor-pointer"
        title="Refresh price"
        aria-label="Refresh price"
      >
        {loading ? (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        )}
      </Button>
      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600 dark:text-red-400 whitespace-nowrap z-10 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}
    </div>
  )
}
