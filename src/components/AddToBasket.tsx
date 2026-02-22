'use client'

import { updateProductBasket } from '@/actions/disable'
import { useState } from 'react'
import { TbBasketCheck, TbBasketPlus } from 'react-icons/tb'

interface AddProductBasketProps {
  productId: string
  initialDisabled?: boolean
}

export default function AddProductBasket({ productId, initialDisabled }: AddProductBasketProps) {
  const [disabled, setDisabled] = useState(initialDisabled)
  const [loading, setLoading] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoading(true)

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
      className={`flex cursor-pointer text-[#212a72] ${
        disabled ? 'text-green-700' : 'bg-transparent'
      } transition-colors`}
    >
      {disabled ? (
        <TbBasketCheck className="size-4.5 text-green-700" />
      ) : (
        <TbBasketPlus className="size-4.5" />
      )}
      {/* {disabled ? 'Disabled' : 'Enable'} */}
    </button>
  )
}
