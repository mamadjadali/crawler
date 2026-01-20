import React from 'react'

import { getClient } from '@/actions/getClient'

import { redirect } from 'next/navigation'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const client = await getClient()

  if (!client) {
    redirect('/') // redirect to login if not authenticated
  }

  return <>{children}</>
}

