'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader } from 'lucide-react'
import { useAuth } from '@/context/AuthProvider'

interface RefreshCategoryButtonProps {
  category: string
  brand?: string
}

export default function RefreshCategoryButton({ category, brand }: RefreshCategoryButtonProps) {
  const { permissions } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // ⛔ Hide button for unauthorized roles
  if (!permissions.refreshCategory) return null

  const handleRefresh = async () => {
    if (!category) {
      alert('لطفاً یک دسته‌بندی انتخاب کنید.')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/refresh-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          brand: brand || undefined,
          limit: 50,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        if (response.status === 409) {
          alert('این دسته‌بندی در حال حاضر توسط یوزر دیگری در حال بروزرسانی است.') // 409 conflict
        } else {
          throw new Error(data.error || 'خطا در بروزرسانی')
        }
        return
      }

      console.log('Category refreshed:', data)
      router.refresh()
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleRefresh}
      disabled={isLoading}
      className="bg-blue-600 gap-2 text-white px-4 py-2 rounded-lg"
    >
      {isLoading ? (
        <>
          <span className="animate-spin">
            <Loader />
          </span>
          در حال بروزرسانی...
        </>
      ) : (
        'بروزرسانی'
      )}
    </Button>
  )
}
