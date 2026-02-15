'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader, Timer } from 'lucide-react'
import { useAuth } from '@/context/AuthProvider'

interface RefreshCategoryButtonProps {
  category: string
  brand?: string
}

export default function RefreshCategoryButton({ category, brand }: RefreshCategoryButtonProps) {
  const { permissions } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [lastElapsed, setLastElapsed] = useState<number | null>(null)

  useEffect(() => {
    // check if elapsed time exists from previous refresh
    const savedElapsed = sessionStorage.getItem('lastElapsed')
    const savedExpire = sessionStorage.getItem('lastElapsedExpire')

    if (savedElapsed) setLastElapsed(parseInt(savedElapsed, 10))

    if (savedExpire) {
      const remaining = parseInt(savedExpire, 10) - Date.now()
      if (remaining > 0) {
        const timer = setTimeout(() => {
          setLastElapsed(null)
          sessionStorage.removeItem('lastElapsed')
          sessionStorage.removeItem('lastElapsedExpire')
        }, remaining)
        return () => clearTimeout(timer)
      } else {
        // already expired
        setLastElapsed(null)
        sessionStorage.removeItem('lastElapsed')
        sessionStorage.removeItem('lastElapsedExpire')
      }
    }
  }, [])

  // ⛔ Hide button for unauthorized roles

  const handleRefresh = async () => {
    if (!category) {
      alert('لطفاً یک دسته‌بندی انتخاب کنید.')
      return
    }

    try {
      const startTime = Date.now()
      setIsLoading(true)
      const response = await fetch('/api/refresh-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          brand: brand || undefined,
          limit: 80,
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

      // calculate elapsed and save with expire timestamp
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setLastElapsed(elapsed)
      sessionStorage.setItem('lastElapsed', elapsed.toString())
      sessionStorage.setItem('lastElapsedExpire', (Date.now() + 30_000).toString())

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

  const formatTime = (sec: number) => {
    const hours = Math.floor(sec / 3600)
    const minutes = Math.floor((sec % 3600) / 60)
    const seconds = sec % 60
    const nf = new Intl.NumberFormat('fa-IR')
    return hours > 0
      ? `${nf.format(hours)}:${nf.format(minutes)}:${nf.format(seconds)}`
      : `${nf.format(minutes)}:${nf.format(seconds)}`
  }

  if (!permissions.refreshCategory) return <></>

  return (
    <div className="flex items-center justify-center gap-2">
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
      {lastElapsed !== null && !isLoading && (
        <div className="text-base flex gap-2 text-gray-700">
          {formatTime(lastElapsed)}
          <Timer />
        </div>
      )}
    </div>
  )
}
