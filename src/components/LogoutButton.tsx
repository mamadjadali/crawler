// components/LogoutButton.tsx
'use client'

import { logoutAction } from '@/actions/logout'
import { LogOut } from 'lucide-react'
import { Button } from './ui/button'

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button
        type="submit"
        className="flex w-full cursor-pointer items-center gap-2 text-red-600 hover:bg-red-500/10 p-1"
      >
        خروج
        <LogOut className="ml-1" />
      </Button>
    </form>
  )
}
