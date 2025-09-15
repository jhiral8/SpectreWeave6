import './globals.css'
import type { Metadata, Viewport } from 'next'

// Force all pages to be dynamic to prevent SSR errors
export const dynamic = 'force-dynamic'
export const revalidate = 0

// import 'cal-sans' // Temporarily disabled due to runtime bundling error on Windows

// import { createClient } from '@/lib/supabase/server' // Temporarily disabled for deployment
// import IconAuthButton from '@/components/auth/IconAuthButton' // Temporarily disabled
import ClientLayout from '@/components/layout/ClientLayout'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'SpectreWeave - Advanced Block Editor',
  description:
    'SpectreWeave is an advanced block-based document editor built with TipTap v3.x, featuring AI-powered assistance and real-time collaboration.',
  robots: 'noindex, nofollow',
  icons: [{ url: '/favicon.svg' }],
  twitter: {
    card: 'summary_large_image',
  },
  openGraph: {
    title: 'SpectreWeave - Advanced Block Editor',
    description:
      'SpectreWeave is an advanced block-based document editor built with TipTap v3.x, featuring AI-powered assistance and real-time collaboration.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Temporarily disable Supabase to isolate Jest worker issue
  // const user = null

  return (
    <html className="dark h-full font-sans" lang="en">
      <body className="min-h-screen bg-[--background] text-[--foreground] overflow-hidden">
        <ClientLayout>
          <main className="h-full">{children}</main>
        </ClientLayout>
      </body>
    </html>
  )
}
