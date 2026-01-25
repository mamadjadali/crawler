'use server'

import { logout } from '@payloadcms/next/auth'
import config from '@payload-config'
import { redirect } from 'next/navigation'

export async function logoutAction() {
  try {
    await logout({ allSessions: true, config })
  } catch (error) {
    // handle only logout errors
    console.error('Logout failed:', error)
    // You can throw a normal error or do something else
    throw new Error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // do the redirect outside the try/catch
  redirect('/')
}
