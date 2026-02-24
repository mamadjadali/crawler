// LogoutButton.tsx
'use client'

import { logoutAction } from '@/actions/logout'
import { LogOut } from 'lucide-react'
import { useTransition } from 'react' // optional for pending state
import { Button } from './ui/button'

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      onClick={() => {
        startTransition(async () => {
          await logoutAction()
        })
      }}
      disabled={isPending}
      className="
        flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm
        text-red-600 hover:bg-red-100 hover:text-red-700
        transition-colors disabled:opacity-50
      "
    >
      {isPending ? '... در حال خروج' : 'خروج'}
      <LogOut className="h-4 w-4" />
    </Button>
  )
}
