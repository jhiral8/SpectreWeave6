'use client'

import dynamic from 'next/dynamic'
import SpectreWeaveLogo from '@/components/ui/SpectreWeaveLogo'

const LoginForm = dynamic(
  () => import('@/components/auth/LoginForm'),
  { ssr: false }
)

export default function PortalLoginPage() {
  return (
    <div className="min-h-[calc(100vh-0px)] grid place-items-center px-4 py-8">
      <div className="w-full max-w-md gradient-border bg-[--background] p-5 shadow-sm">
        <div className="flex flex-col items-center">
          <SpectreWeaveLogo size="lg" showText={false} bordered={false} />
          <div className="mt-2 font-surgena text-xl text-[--foreground]">SpectreWeave</div>
        </div>
        <div className="mt-5">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}


