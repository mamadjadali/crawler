// src/lib/getSettings.ts
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function getResources() {
  const config = await configPromise
  const payload = await getPayload({ config })

  const settings = await payload.findGlobal({
    slug: 'resources',
  })

  return settings
}
