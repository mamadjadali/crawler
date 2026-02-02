'use client'

import { Category } from '@/payload-types'
import { createContext, useContext } from 'react'

type Role = 'god' | 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'

type AuthUser = {
  id: string
  email: string
  username: string
  role: Role
  visibleCategories?: Category[]
}

type AuthContextType = {
  user: AuthUser
  permissions: {
    refreshCategory: boolean
  }
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ user, children }: { user: AuthUser; children: React.ReactNode }) {
  return (
    <AuthContext.Provider
      value={{
        user,
        permissions: {
          refreshCategory: user.role === 'god' || user.role === 'king' || user.role === 'queen',
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
