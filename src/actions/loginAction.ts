'use server'

import { login } from '@payloadcms/next/auth'

import config from '@/payload.config'

import { z } from 'zod'

// validate input

const loginSchema = z.object({
  // email: z.string().email('ایمیل معتبر نیست'),
  username: z.string().min(2, 'نام کاربری باید حداقل دو کاراکتر باشد'),

  password: z.string().min(4, 'رمز عبور باید حداقل چهار کاراکتر باشد'),
})

export type LoginResult =
  | { success: true; user: { id: string; username: string; email: string; fullname?: string } }
  | { success: false; error: string }

export default async function loginAction(raw: unknown): Promise<LoginResult> {
  try {
    // ✅ validate inputs

    const { username, password } = loginSchema.parse(raw)

    // ✅ call Payload login

    const result = await login({
      collection: 'clients',

      config,

      // email,
      username,

      password,
    })

    if (!result?.user) {
      return { success: false, error: 'اطلاعات ورود نادرست است' }
    }

    // ✅ return only safe fields
    console.log(
      `[LOGIN] User ${result.user.username} (${result.user.id}) logged in at ${new Date().toISOString()}`,
    )
    return {
      success: true,

      user: {
        id: result.user.id,

        email: result.user.email,

        username: result.user.username,

        fullname: result.user.fullname,
      },
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0]?.message ?? 'خطای اعتبارسنجی' }
    }

    if (err instanceof Error) {
      return { success: false, error: 'ورود ناموفق بود' } // generic, avoids leaking info
    }

    return { success: false, error: 'خطای ناشناخته' }
  }
}
