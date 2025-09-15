'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AIProvider } from '@/contexts/AIContext'
// import { AdvancedAIProvider } from '@/lib/ai/advancedAIContext' // Temporarily disabled
import ThemeProvider from '@/components/providers/ThemeProvider'
import { useState } from 'react'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          refetchOnWindowFocus: false,
        },
      },
    })
  )

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AIProvider>
          {children}
        </AIProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}