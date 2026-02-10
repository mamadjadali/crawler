'use client'

import { updateProductAed } from '@/actions/updateProductUsd' // <-- new action
import { Check, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Dirham } from './icons'
import { Input } from './ui/input'

interface EditableAEDProductProps {
  id: string
  aed: number
  onAedChange?: (value: number) => void
}

export default function EditableAedProduct({ id, aed, onAedChange }: EditableAEDProductProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(aed ?? 0)
  const [displayValue, setDisplayValue] = useState(aed ?? 0)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateProductAed({ productId: id, aed: value }) // <-- update product
      setDisplayValue(value)
      setEditing(false)
      onAedChange?.(value)
      window.location.reload()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex items-center justify-between bg-transparent border border-pink-700 rounded-[10px] px-2 py-1">
      <div className="text-sm flex items-center gap-2 font-medium text-gray-400">
        <Dirham className="size-4 text-pink-700" />
        قیمت درهـمی
      </div>

      <div className="text-base flex items-center justify-center gap-2 font-bold text-neutral-700">
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
