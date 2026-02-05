'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'

export async function updateSettingsUsd(data: { usdprice: number }) {
  const payload = await getPayload({ config })

  try {
    const updated = await payload.updateGlobal({
      slug: 'settings',
      data,
    })
    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' }
  }
}

export async function updateSettingsAed(data: { aedprice: number }) {
  const payload = await getPayload({ config })

  try {
    const updated = await payload.updateGlobal({
      slug: 'settings',
      data,
    })
    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' }
  }
}
