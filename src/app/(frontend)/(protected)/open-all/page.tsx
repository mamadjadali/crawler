'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Compass } from 'lucide-react'

export default function OpenAll() {
  const params = useSearchParams()

  useEffect(() => {
    const raw = params.get('urls')
    if (!raw) {
      window.close()
      return
    }

    const urls: string[] = JSON.parse(decodeURIComponent(raw))

    urls.forEach((url) => {
      window.open(url, '_blank', 'noopener,noreferrer')
    })

    // Give the browser a moment, then close
    setTimeout(() => {
      window.close()
    }, 300)
  }, [params])

  return (
    <div className="flex flex-col items-center justify-center h-full w-full md:mt-40">
      <Compass className="size-20 animate-spin text-blue-400" />
      <p className="pt-4 text-base font-medium text-neutral-700">در حال باز کردن لینک‌ها...</p>
    </div>
  )
}
