'use client'

import dynamic from 'next/dynamic'

const LoginForm = dynamic(
  () => import('@/components/auth/LoginForm'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }
)

export default function LoginPage() {
  return <LoginForm />
}