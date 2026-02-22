'use client'

import { updateProductBasket } from '@/actions/disable'
import { Trash } from 'lucide-react'
import { useState } from 'react'

interface DisableProductButtonProps {
  productId: string
  initialDisabled?: boolean
  onHide?: () => void
}

export default function BasketProductButton({
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
      await updateProductBasket({ productId, basket: !disabled })
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
      {disabled ? <Trash className="size-4" /> : <Trash className="size-4" />}
      {/* {disabled ? 'Disabled' : 'Enable'} */}
    </button>
  )
}
