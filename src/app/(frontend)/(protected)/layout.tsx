import React from 'react'

import { getClient } from '@/actions/getClient'

import { redirect } from 'next/navigation'
import { UserProfile } from '@/components/UserProfile'
import { AuthProvider } from '@/context/AuthProvider'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const client = await getClient()

  if (!client || client.collection !== 'clients') {
    redirect('/') // redirect to login if not authenticated
  }

  return (
    <AuthProvider
      user={{
        id: client.id,
        email: client.email,
        username: client.username,
        role: client.role, // ← comes from clients collection
      }}
    >
      <header className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mt-8">
          <p className="text-2xl font-bold text-neutral-600 mb-2">لیست محصولات</p>
          <p className="text-neutral-400">مدیریت و ردیابی قیمت محصولاتـ</p>
        </div>
        <UserProfile
          email={client.email}
          name={client.username}
          fullname={client.fullname}
          role={client.role}
        />
      </header>
      {children}
    </AuthProvider>
  )
}
