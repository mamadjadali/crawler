'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import React, { useState } from 'react'

import type { Theme } from './types'

import { LaptopMinimal, Moon, Sun } from 'lucide-react'
import { useTheme } from '..'
import { themeLocalStorageKey } from './types'

export const ThemeSelector: React.FC = () => {
  const { setTheme } = useTheme()
  const [value, setValue] = useState('')

  const onThemeChange = (themeToSet: Theme & 'auto') => {
    if (themeToSet === 'auto') {
      setTheme(null)
      setValue('auto')
    } else {
      setTheme(themeToSet)
      setValue(themeToSet)
    }
  }

  React.useEffect(() => {
    const preference = window.localStorage.getItem(themeLocalStorageKey)
    setValue(preference ?? 'auto')
  }, [])

  return (
    <Select dir="rtl" onValueChange={onThemeChange} value={value}>
      <SelectTrigger
        aria-label="Select a theme"
        className="w-auto font-dana rounded-xl flex bg-transparent gap-2 pl-0 md:pl-3 border-none"
      >
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        <SelectItem value="auto">
          <div className="flex flex-row gap-2 items-center">
            <LaptopMinimal className="h-5 w-5" />
            <span className="font-dana">خودکار</span>
          </div>
        </SelectItem>
        <SelectItem value="light">
          <div className="flex flex-row gap-2 items-center">
            <Sun className="h-5 w-5" />
            <span className="font-dana">روشن</span>
          </div>
        </SelectItem>
        <SelectItem value="dark">
          <div className="flex flex-row gap-2 items-center">
            <Moon className="h-5 w-5" />
            <span className="font-dana">تاریک</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
