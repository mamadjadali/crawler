'use client'

import { updateProductUsd } from '@/actions/updateProductUsd' // <-- new action
import { Check, DollarSign, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Input } from './ui/input'

interface EditableUSDProductProps {
  id: string
  usd: number
  onUsdChange?: (value: number) => void
}

export default function EditableUSDProduct({ id, usd, onUsdChange }: EditableUSDProductProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(usd ?? 0)
  const [displayValue, setDisplayValue] = useState(usd ?? 0)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateProductUsd({ productId: id, usd: value }) // <-- update product
      setDisplayValue(value)
      setEditing(false)
      onUsdChange?.(value)
      // window.location.reload()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex items-center justify-between border-none bg-white rounded-[10px] px-2 py-1">
      <div className="text-sm flex items-center gap-2 font-medium text-gray-400">
        <DollarSign className="size-4 text-green-700" />
        قیمت دلاری
      </div>

      <div className="text-base flex items-center justify-center gap-2 font-bold text-[#212a72]">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={new Intl.NumberFormat('fa-IR').format(value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave() // save on Enter
              }}
              onChange={(e) => {
                // Remove non-digit chars and convert Persian digits to English
                const digitsOnly = e.target.value.replace(/[^\d۰-۹]/g, '')
                const normalized = digitsOnly.replace(/[۰-۹]/g, (d) =>
                  String(d.charCodeAt(0) - 1776),
                )
                setValue(Number(normalized))
              }}
              className="border border-gray-400 px-2 rounded-lg text-left text-neutral-700 w-30 no-spin"
              autoFocus
            />
            <button onClick={handleSave} disabled={loading} className="text-green-600">
              <Check className="size-4" />
            </button>
          </div>
        ) : (
          new Intl.NumberFormat('fa-IR').format(displayValue ?? 0)
        )}
        {!editing && (
          <Pencil
            className="size-3.5 text-gray-500 cursor-pointer"
            onClick={() => setEditing(true)}
          />
        )}
      </div>
    </div>
  )
}
