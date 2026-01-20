import React from 'react'

import { UserAuthForm } from '@/components/UserAuthForm'

import './styles.css'

export default async function HomePage() {
  return (
    <div className="relative h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-md px-4 mx-auto">
        <UserAuthForm />
      </div>
    </div>
  )
}
