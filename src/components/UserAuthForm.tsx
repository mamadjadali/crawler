'use client'

import loginAction from '@/actions/loginAction'
import { cn } from '@/lib/utils/utils'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import * as React from 'react'
import { Icons } from './icons'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

const initialState = undefined

export function UserAuthForm({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const [state, formAction] = React.useActionState(loginAction, initialState)
  const [showPassword, setShowPassword] = React.useState(false)

  // Manual pending state + transition
  const [isPending, startTransition] = React.useTransition()

  // We'll wrap the real action in startTransition to get reliable pending
  const handleAction = (formData: FormData) => {
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <div className={cn('grid gap-6', className)}>
      <form action={handleAction} className="space-y-4">
        {/* General / server error */}
        {state?.error && !state.fieldErrors && (
          <div className="rounded-lg bg-red-50 duration-150 p-3 text-sm text-red-700 border border-red-300">
            {state.error}
          </div>
        )}

        {/* Username */}
        <div className="grid gap-1">
          <Label dir="rtl" className="mb-1 text-[#212A72]">
            نام کاربری
          </Label>
          <Input
            dir="ltr"
            name="username"
            required
            disabled={isPending} // ← disable during pending
            className={cn(
              'border-gray-300 shadow-none font-mono rounded-lg',
              state?.fieldErrors?.username && 'border-red-500 focus:border-red-500',
            )}
          />
          {state?.fieldErrors?.username && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.username}</p>
          )}
        </div>

        {/* Password */}
        <div className="grid gap-1">
          <Label dir="rtl" className="mb-1 text-[#212A72]">
            رمز عبور
          </Label>
          <div dir="ltr" className="relative">
            <Input
              dir="ltr"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              disabled={isPending} // ← disable during pending
              placeholder="*********"
              className={cn(
                'border-gray-300 shadow-none font-mono rounded-lg',
                state?.fieldErrors?.password && 'border-red-500 focus:border-red-500',
              )}
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect="off"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={isPending} // optional: disable eye toggle too
              className="absolute inset-y-0 end-0 px-2"
            >
              {showPassword ? (
                <EyeOffIcon size={18} className="text-[#212A72]" />
              ) : (
                <EyeIcon size={18} className="text-[#212A72]" />
              )}
            </button>
          </div>
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.password}</p>
          )}
        </div>

        {/* Submit button with manual pending */}
        <Button
          type="submit"
          disabled={isPending}
          className={cn(
            'bg-linear-to-l shadow-none from-[#009FE3] via-[#006699] to-[#212A72]',
            'w-full inline-flex items-center cursor-pointer justify-center mt-2 text-white rounded-lg',
            isPending && 'opacity-80 cursor-wait',
          )}
        >
          {isPending && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'در حال ورود...' : 'ورود'}
        </Button>
      </form>
    </div>
  )
}
