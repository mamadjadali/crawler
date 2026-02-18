'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { z } from 'zod'

const updateUsdSchema = z.object({
  productId: z.string().min(1),
  usd: z.number(),
})

const updateAedSchema = z.object({
  productId: z.string().min(1),
  aed: z.number(),
})

export async function updateProductUsd(rawData: unknown) {
  const { productId, usd } = updateUsdSchema.parse(rawData)

  const payload = await getPayload({ config })

  return payload.update({
    collection: 'product-links',
    id: productId,
    data: { usd },
  })
}

export async function updateProductAed(rawData: unknown) {
  const { productId, aed } = updateAedSchema.parse(rawData)

  const payload = await getPayload({ config })

  return payload.update({
    collection: 'product-links',
    id: productId,
    data: { aed },
  })
}
