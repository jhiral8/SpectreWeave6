'use client'

// LIGHTWEIGHT DUAL EDITOR - MINIMAL IMPORTS FOR FAST LOADING
import React, { Suspense, lazy, useEffect } from 'react'
import LogoLoader from '@/components/ui/LogoLoader'
import type { Doc as YDoc } from 'yjs'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import { User } from '@supabase/supabase-js'

// CRITICAL: Only import what's absolutely necessary for initial render
import '@/styles/editor.css'

// Lazy load ALL heavy components - this is the key to reducing module count
const EditorProvider = lazy(() => import('@/context/EditorProvider').then(mod => ({ default: mod.EditorProvider })))
const SplitEditorProvider = lazy(() => import('./context/SplitEditorContext').then(mod => ({ default: mod.SplitEditorProvider })))
const ContextAwareEditorHeader = lazy(() => import('./components/ContextAwareEditorHeader').then(mod => ({ default: mod.ContextAwareEditorHeader })))
const Sidebar = lazy(() => import('@/components/Sidebar').then(mod => ({ default: mod.Sidebar })))
const AIChatSidebar = lazy(() => import('@/components/AIChatSidebar/AIChatSidebar').then(mod => ({ default: mod.AIChatSidebar })))
const ConcurrentDualEditor = lazy(() => import('./components/ConcurrentDualEditor').then(mod => ({ default: mod.ConcurrentDualEditor })))
const FrameworkConfirmModal = lazy(() => import('@/components/ui/FrameworkConfirmModal'))

// All hooks are loaded via the main DualBlockEditor component

interface LightweightDualEditorProps {
  manuscriptYdoc: YDoc
  frameworkYdoc?: YDoc
  manuscriptProvider?: TiptapCollabProvider | null | undefined
  frameworkProvider?: TiptapCollabProvider | null | undefined
  user?: User | null
  enableFrameworkEditor?: boolean
  showSurfaceSwitcher?: boolean
  surfaceSwitcherVariant?: 'default' | 'floating' | 'compact' | 'pills'
  project?: any
  showInternalLeftNavigation?: boolean
}

// Lightweight loading skeleton
const EditorLoadingSkeleton = () => (
  <div className="w-full h-full grid place-items-center">
    <LogoLoader  />
  </div>
)

// Component error boundary
const LazyErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    const handleError = () => setHasError(true)
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (hasError) {
    return (
      <div className="h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/20">
        <div className="text-center space-y-4">
          <div className="text-red-600 dark:text-red-400 text-xl font-medium">
            Editor Loading Error
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Reload Editor
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Main lightweight component - THIS IS THE KEY TO REDUCING MODULES
const LightweightDualEditor = React.memo(({ 
  manuscriptYdoc,
  frameworkYdoc,
  manuscriptProvider,
  frameworkProvider,
  user,
  enableFrameworkEditor = true,
  showSurfaceSwitcher = true,
  surfaceSwitcherVariant = 'floating',
  project,
  showInternalLeftNavigation = false
}: LightweightDualEditorProps) => {
  // Client-side only guard
  const [isClient, setIsClient] = React.useState(false)
  
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize research event handler
  React.useEffect(() => {
    if (!isClient) return
    
    // Dynamic import to avoid bundling issues
    import('@/services/researchEventHandler').then(({ researchEventHandler }) => {
      // The singleton is automatically initialized on import
    }).catch(error => {
      console.error('❌ Failed to load research event handler:', error)
    })
  }, [isClient])

  // Don't render anything on server
  if (!isClient) {
    return <EditorLoadingSkeleton />
  }

  return (
    <LazyErrorBoundary>
      <Suspense fallback={<EditorLoadingSkeleton />}>
        <LightweightEditorCore
          manuscriptYdoc={manuscriptYdoc}
          frameworkYdoc={frameworkYdoc}
          manuscriptProvider={manuscriptProvider}
          frameworkProvider={frameworkProvider}
          user={user}
          enableFrameworkEditor={enableFrameworkEditor}
          showSurfaceSwitcher={showSurfaceSwitcher}
          surfaceSwitcherVariant={surfaceSwitcherVariant}
          project={project}
          showInternalLeftNavigation={showInternalLeftNavigation}
        />
      </Suspense>
    </LazyErrorBoundary>
  )
})

// Separate component that loads the heavy parts
const LightweightEditorCore = React.memo((props: LightweightDualEditorProps) => {
  // Lazy import the actual editor implementation
  const [EditorImplementation, setEditorImplementation] = React.useState<React.ComponentType<any> | null>(null)
  
  React.useEffect(() => {
    // Load the full editor asynchronously
    import('./DualBlockEditor').then(module => {
      setEditorImplementation(() => module.default)
    }).catch(error => {
      console.error('Failed to load editor:', error)
    })
  }, [])
  
  if (!EditorImplementation) {
    return <EditorLoadingSkeleton />
  }
  
  return <EditorImplementation {...props} />
})

LightweightDualEditor.displayName = 'LightweightDualEditor'
LightweightEditorCore.displayName = 'LightweightEditorCore'

export default LightweightDualEditor