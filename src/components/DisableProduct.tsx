'use client'

import { updateProductDisable } from '@/actions/disable'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

interface DisableProductButtonProps {
  productId: string
  initialDisabled?: boolean
  onHide?: () => void
}

export default function DisableProductButton({
  productId,
  initialDisabled = false,
  onHide,
}: DisableProductButtonProps) {
  const [disabled, setDisabled] = useState(initialDisabled)
  const [loading, setLoading] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoading(true)

    // hide immediately
    onHide?.()

    try {
      await updateProductDisable({ productId, disable: !disabled })
      setDisabled(!disabled)
    } catch (err) {
      console.error(err)
      alert('Failed to update product status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      //   variant={'ghost'}
      onClick={handleToggle}
      disabled={loading}
      className={`flex cursor-pointer p-0 text-neutral-700 ${
        disabled ? 'text-rose-700' : 'bg-transparent'
      } transition-colors`}
    >
      {disabled ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      {/* {disabled ? 'Disabled' : 'Enable'} */}
    </button>
  )
}
