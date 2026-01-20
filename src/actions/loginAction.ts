'use server'

import { login } from '@payloadcms/next/auth'

import config from '@/payload.config'

import { z } from 'zod'

// validate input

const loginSchema = z.object({

  email: z.string().email('ایمیل معتبر نیست'),

  password: z.string().min(4, 'رمز عبور باید حداقل چهار کاراکتر باشد'),

})

export type LoginResult =

  | { success: true; user: { id: string; email: string; fullname?: string } }

  | { success: false; error: string }

export default async function loginAction(raw: unknown): Promise<LoginResult> {

  try {

    // ✅ validate inputs

    const { email, password } = loginSchema.parse(raw)

    // ✅ call Payload login

    const result = await login({

      collection: 'clients',

      config,

      email,

      password,

    })

    if (!result?.user) {

      return { success: false, error: 'اطلاعات ورود نادرست است' }

    }

    // ✅ return only safe fields

    return {

      success: true,

      user: {

        id: result.user.id,

        email: result.user.email,

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

