'use server'

import { login } from '@payloadcms/next/auth'
import config from '@/payload.config'
import { z } from 'zod'
import { redirect } from 'next/navigation'

const loginSchema = z.object({
  username: z.string().min(2, 'نام کاربری خیلی کوتاه است'),
  password: z.string().min(4, 'رمز عبور باید حداقل ۴ کاراکتر باشد'),
})

export type LoginState =
  | {
      success?: boolean
      error?: string
      fieldErrors?: {
        username?: string
        password?: string
      }
    }
  | undefined

export default async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // 1. Validate input (zod)
  const raw = {
    username: formData.get('username')?.toString() ?? '',
    password: formData.get('password')?.toString() ?? '',
  }

  const parsed = loginSchema.safeParse(raw)

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    return {
      error: 'لطفاً اطلاعات را بررسی کنید',
      fieldErrors: {
        username: fieldErrors.username?.[0],
        password: fieldErrors.password?.[0],
      },
    }
  }

  const { username, password } = parsed.data

  let result
  try {
    result = await login({
      collection: 'clients',
      config,
      username,
      password,
    })

    if (!result?.user) {
      return { error: 'نام کاربری یا رمز عبور اشتباه است' }
    }

    console.log(`[LOGIN] ${result.user.username} logged in at ${new Date().toISOString()}`)
  } catch (err: any) {
    console.error('[LOGIN ERROR]', err)
    return {
      error: 'خطایی رخ داد. لطفاً دوباره تلاش کنید.',
    }
  }

  // ── Success ── redirect is outside try/catch ──
  redirect('/products')
}
