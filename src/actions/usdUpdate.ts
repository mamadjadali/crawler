'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'

export async function updateSettingsUsd(data: { usdprice: number }) {
  const payload = await getPayload({ config })

  return payload.updateGlobal({
    slug: 'settings',
    data,
  })
}

export async function updateSettingsAed(data: { aedprice: number }) {
  const payload = await getPayload({ config })

  return payload.updateGlobal({
    slug: 'settings',
    data,
  })
}
