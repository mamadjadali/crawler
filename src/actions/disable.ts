'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { z } from 'zod'

const updateDisableSchema = z.object({
  productId: z.string().min(1),
  disable: z.boolean(),
})

const updateBasketSchema = z.object({
  productId: z.string().min(1),
  basket: z.boolean(),
})

type UpdateDisableInput = z.infer<typeof updateDisableSchema>
type UpdateBasketInput = z.infer<typeof updateBasketSchema>

export async function updateProductDisable(rawData: UpdateDisableInput) {
  const { productId, disable } = updateDisableSchema.parse(rawData)

  const payload = await getPayload({ config })

  return payload.update({
    collection: 'product-links',
    id: productId,
    data: { disable },
  })
}

export async function updateProductBasket(rawData: UpdateBasketInput) {
  const { productId, basket } = updateBasketSchema.parse(rawData)

  const payload = await getPayload({ config })

  return payload.update({
    collection: 'product-links',
    id: productId,
    data: { basket },
  })
}
