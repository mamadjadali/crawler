'use server'

import { headers as getHeaders } from 'next/headers.js'

import { getPayload } from 'payload'

import config from '@/payload.config'

export async function getClient() {
  const headers = await getHeaders()

  const payloadConfig = await config

  const payload = await getPayload({ config: payloadConfig })

  // No collection property needed — will return the logged-in client

  const { user: client } = await payload.auth({ headers })

  return client || null
}

