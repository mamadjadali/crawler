'use server'

import { logout } from '@payloadcms/next/auth'
import config from '@payload-config'
import { redirect } from 'next/navigation'

export async function logoutAction() {
  try {
    await logout({ allSessions: true, config })
  } catch (error) {
    console.error('Logout failed:', error)
    throw new Error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  redirect('/')
}
