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
