'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'

export async function updateSettingsFee(data: { importFee: number }) {
  const payload = await getPayload({ config })

  try {
    const updated = await payload.updateGlobal({
      slug: 'settings',
      data, // expects { usdprice: number }
    })
    return { success: true, data: updated }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' }
  }
}
