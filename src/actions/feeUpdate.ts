'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'

export async function updateSettingsFee(data: { importFee: number }) {
  const payload = await getPayload({ config })

  return payload.updateGlobal({
    slug: 'settings',
    data,
  })
}

export async function updateSettingsProfit(data: { profit: number }) {
  const payload = await getPayload({ config })

  return payload.updateGlobal({
    slug: 'settings',
    data,
  })
}
