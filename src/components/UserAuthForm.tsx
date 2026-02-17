'use client'

import * as React from 'react'

import { useRouter } from 'next/navigation'

import { z } from 'zod'

import { useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'

import { cn } from '@/lib/utils/utils'

import { Icons } from './icons'

import { Button } from './ui/button'

import { Input } from './ui/input'

import { Label } from './ui/label'

import loginAction from '@/actions/loginAction'

import { EyeIcon, EyeOffIcon } from 'lucide-react'

// ✅ Reuse same schema as server

const loginSchema = z.object({
  // email: z.string().email('ایمیل معتبر نیست'),
  username: z.string().min(2, 'نام کاربری باید حداقل دو کاراکتر باشد'),

  password: z.string().min(4, 'رمز عبور باید حداقل چهار کاراکتر باشد'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function UserAuthForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter()

  const [isVisible, setIsVisible] = React.useState<boolean>(false)

  const toggleVisibility = () => setIsVisible((prevState) => !prevState)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      // email: '',
      username: '',

      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const result = await loginAction(values)

      if (!result.success) {
        alert(result.error || 'ورود ناموفق بود')

        return
      }

      // alert('خوش آمدید 👋')

      router.push('/products')
    } catch {
      alert('خطای غیرمنتظره در ورود')
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* ایمیل */}

        <div className="grid gap-1">
          <Label dir="rtl" htmlFor="email" className="mb-1 text-[#212A72]">
            {/* ایمیل */}
            نام کاربری
          </Label>

          <Input
            id="username"
            type="text"
            dir="ltr"
            placeholder=""
            className="border-gray-400 font-mono rounded-lg"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            disabled={form.formState.isSubmitting}
            {...form.register('username')}
          />

          {form.formState.errors.username && (
            <p dir="rtl" className="text-red-500 text-xs mt-1">
              {form.formState.errors.username.message}
            </p>
          )}
        </div>

        {/* رمز عبور */}

        <div className="grid gap-1">
          <Label dir="rtl" htmlFor="password" className="mb-1 text-[#212A72]">
            رمز عبور
          </Label>

          <div className="relative">
            <Input
              id="password"
              type={isVisible ? 'text' : 'password'}
              placeholder="*********"
              className="border-gray-400 font-mono rounded-lg"
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect="off"
              disabled={form.formState.isSubmitting}
              {...form.register('password')}
            />

            <Button
              className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={toggleVisibility}
              aria-label={isVisible ? 'Hide password' : 'Show password'}
              aria-pressed={isVisible}
              aria-controls="password"
            >
              {isVisible ? (
                <EyeOffIcon size={16} className="text-gray-400" aria-hidden="true" />
              ) : (
                <EyeIcon size={16} className="text-blue-300" aria-hidden="true" />
              )}
            </Button>

            {form.formState.errors.password && (
              <p dir="rtl" className="text-red-500 text-xs mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
        </div>

        {/* دکمه ورود */}

        <Button
          type="submit"
          className="bg-linear-to-l from-[#009FE3] via-[#006699] to-[#212A72] w-full inline-flex cursor-pointer mt-2 text-white rounded-lg"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          ورود
        </Button>
      </form>
    </div>
  )
}
