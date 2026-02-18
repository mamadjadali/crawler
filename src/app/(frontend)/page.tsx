import React from 'react'

import { UserAuthForm } from '@/components/UserAuthForm'

import './styles.css'
import { redirect } from 'next/navigation'
import { getClient } from '@/actions/getClient'
import CoolLogo from '../../components/CoolLogo'
import Drawn140Logo from '@/components/140logo'
import { Separator } from '@/components/ui/separator'

export default async function HomePage() {
  const client = await getClient()

  if (client && client.collection === 'clients') {
    redirect('/products')
  }
  return (
    <div className="relative h-screen flex flex-col items-center justify-center">
      <div className="flex gap-10 max-w-60 md:max-w-70 items-center justify-center">
        <Drawn140Logo />
        <Separator orientation="vertical" className="border-gray-200 border-[0.5px] h-10" />
        <CoolLogo />
      </div>
      <div className="w-full items-center max-w-sm px-4 mx-auto">
        <UserAuthForm />
      </div>
    </div>
  )
}
