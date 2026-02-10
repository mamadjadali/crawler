'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { z } from 'zod'

const updateDisableSchema = z.object({
  productId: z.string().min(1),
  disable: z.boolean(),
})

type UpdateDisableInput = z.infer<typeof updateDisableSchema>

export async function updateProductDisable(rawData: UpdateDisableInput) {
  const { productId, disable } = updateDisableSchema.parse(rawData)

  const payload = await getPayload({ config })

  return payload.update({
    collection: 'product-links',
    id: productId,
    data: { disable },
  })
}

// 'use server'

// import { getPayload } from 'payload'
// import config from '@/payload.config'
// import { z } from 'zod'

// const updateDisableSchema = z.object({
//   productId: z.string().min(1),
//   disable: z.boolean(),
// })

// type ActionResult<T> = {
//   success: boolean
//   data?: T
//   error?: string
//   rawError?: any
// }

// export async function updateProductDisable(
//   rawData: z.infer<typeof updateDisableSchema>,
// ): Promise<ActionResult<any>> {
//   try {
//     const data = updateDisableSchema.parse(rawData)

//     const payload = await getPayload({ config })

//     const updatedProduct = await payload.update({
//       collection: 'product-links',
//       id: data.productId,
//       data: { disable: data.disable },
//     })

//     return { success: true, data: updatedProduct }
//   } catch (err: any) {
//     // Log full error server-side
//     console.error('updateProductDisable failed:', err)

//     // Return full error to client for debugging
//     return {
//       success: false,
//       error: err instanceof Error ? err.message : 'Unknown error',
//       rawError: err,
//     }
//   }
// }
