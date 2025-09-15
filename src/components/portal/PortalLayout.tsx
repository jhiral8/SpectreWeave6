'use client'

import React from 'react'
import { User } from '@supabase/supabase-js'
import { PortalHeader } from './PortalHeader'

interface PortalLayoutProps {
  user: User
  children: React.ReactNode
}

export function PortalLayout({ user, children }: PortalLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <PortalHeader user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}