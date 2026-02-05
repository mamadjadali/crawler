// src/lib/getSettings.ts
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function getChangelog() {
  const config = await configPromise
  const payload = await getPayload({ config })

  const settings = await payload.findGlobal({
    slug: 'changelog',
  })

  return settings
}
