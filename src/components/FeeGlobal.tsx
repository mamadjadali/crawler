'use client'

import { updateSettingsFee } from '@/actions/feeUpdate'
import { Setting } from '@/payload-types'
import { Check, Pencil, PlaneLanding } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from './ui/input'

interface EditableFeeProps {
  settings: Setting
}

export default function EditableFee({ settings }: EditableFeeProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(settings.importFee ?? 0)
  const [displayValue, setDisplayValue] = useState(settings.importFee ?? 0)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateSettingsFee({ importFee: value })
      setDisplayValue(value)
      setEditing(false)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between bg-transparent border border-blue-700 rounded-[10px] p-2">
      <div className="text-base flex items-center gap-2 font-medium text-gray-400">
        <PlaneLanding className="size-5 text-blue-700" />
        هزینه وارداتــ
      </div>

      <div className="text-xl flex items-center justify-center gap-2 font-bold text-neutral-700">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={new Intl.NumberFormat('fa-IR').format(value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave()
                }
              }}
              onChange={(e) => {
                // Remove any non-digit characters (including Persian digits)
                const digitsOnly = e.target.value.replace(/[^\d۰-۹]/g, '')
                // Convert Persian digits to English
                const normalized = digitsOnly.replace(/[۰-۹]/g, (d) =>
                  String(d.charCodeAt(0) - 1776),
                )
                setValue(Number(normalized))
              }}
              className="border border-gray-400 px-2 rounded-lg text-left text-neutral-700 w-30 no-spin"
            />
            <button onClick={handleSave} disabled={loading} className="text-green-600">
              <Check className="size-4" />
            </button>
          </div>
        ) : (
          new Intl.NumberFormat('fa-IR').format(settings.importFee ?? 0) + ' %'
        )}
        {!editing && (
          <Pencil
            className="size-4 text-gray-500 cursor-pointer"
            onClick={() => setEditing(true)}
          />
        )}
      </div>
    </div>
  )
}
