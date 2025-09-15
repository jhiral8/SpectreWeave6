import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign in - SpectreWeave Portal',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[--background] text-[--foreground]">
      {children}
    </div>
  )
}


