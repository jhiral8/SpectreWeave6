'use client'

import React, { useEffect, useState } from 'react'
import LightweightDualEditor from '@/components/BlockEditor/LightweightDualEditor'
import { AIProvider } from '@/contexts/AIContext'
import * as Y from 'yjs'

// Main document editing page with dual writing surfaces
export default function DualSurfaceDemoPage() {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Create Y.js documents for dual surfaces
  const manuscriptYdoc = React.useMemo(() => new Y.Doc(), [])
  const frameworkYdoc = React.useMemo(() => new Y.Doc(), [])

  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-600">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <AIProvider>
      <div className="h-screen flex flex-col">
        <LightweightDualEditor 
          manuscriptYdoc={manuscriptYdoc}
          frameworkYdoc={frameworkYdoc}
          manuscriptProvider={null}
          frameworkProvider={null}
          user={null}
          enableFrameworkEditor={true}
          showSurfaceSwitcher={true}
          surfaceSwitcherVariant="floating"
        />
      </div>
    </AIProvider>
  )
}