import React from 'react'

import { getClient } from '@/actions/getClient'

import { redirect } from 'next/navigation'
import { UserProfile } from '@/components/UserProfile'
import { AuthProvider } from '@/context/AuthProvider'
import { Category } from '@/payload-types'
import { getChangelog } from '@/lib/utils/getChangeLog'
import ChangelogSheet from '@/components/ChangelogSheet'
import ResourceSheet from '@/components/ReaourceSheet'
import { getResources } from '@/lib/utils/getResource'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const client = await getClient()
  const changelog = await getChangelog()
  const resource = await getResources()

  if (!client || client.collection !== 'clients') {
    redirect('/')
  }

  return (
    <AuthProvider
      user={{
        id: client.id,
        email: client.email,
        username: client.username,
        role: client.role,
        visibleCategories: client.visibleCategories as Category[] | undefined,
      }}
    >
      <section className="w-full bg-[#e6f3ff]">
        <header className="flex items-center justify-between max-w-7xl mx-auto pt-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="">
            <p className="text-2xl font-bold text-[#212A72] mb-2">لیست محصولاتــ</p>
            <p className="text-neutral-400">مدیریت و ردیابی قیمت محصولاتـ</p>
          </div>
          <div className="flex flex-col gap-2 items-center">
            <UserProfile
              email={client.email}
              name={client.username}
              fullname={client.fullname}
              role={client.role}
            />
            <div className="flex gap-1 w-full items-center justify-between">
              <ResourceSheet resource={resource} />
              <ChangelogSheet changelog={changelog} />
            </div>
          </div>
        </header>
      </section>
      {children}
    </AuthProvider>
  )
}
