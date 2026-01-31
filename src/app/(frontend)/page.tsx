import React from 'react'

import { UserAuthForm } from '@/components/UserAuthForm'

import './styles.css'
import { redirect } from 'next/navigation'
import { getClient } from '@/actions/getClient'

export default async function HomePage() {
  const client = await getClient()

  if (client && client.collection === 'clients') {
    redirect('/products') // redirect to login if not authenticated
  }
  return (
    <div className="relative h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-sm px-4 mx-auto">
        <UserAuthForm />
      </div>
    </div>
  )
}
