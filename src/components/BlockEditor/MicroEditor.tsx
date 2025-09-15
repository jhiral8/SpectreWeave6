'use client'

// MICRO EDITOR - ABSOLUTE MINIMAL IMPORTS FOR INSTANT LOADING
import React, { Suspense, lazy, useState, useEffect } from 'react'
import type { Doc as YDoc } from 'yjs'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import { User } from '@supabase/supabase-js'

// CRITICAL: Only the absolute essentials for initial render
import '@/styles/editor.css'

// Ultra-lightweight loading component
const MicroLoadingSkeleton = () => (
  <div className="h-screen flex items-center justify-center bg-white dark:bg-black">
    <div className="text-center space-y-4">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">SpectreWeave</p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">Loading minimal editor...</p>
    </div>
  </div>
)

// Basic error component
const MicroErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = () => setHasError(true)
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (hasError) {
    return (
      <div className="h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/10">
        <div className="text-center space-y-3">
          <div className="text-red-600 dark:text-red-400 text-lg">Editor Error</div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

interface MicroEditorProps {
  manuscriptYdoc: YDoc
  frameworkYdoc?: YDoc
  manuscriptProvider?: TiptapCollabProvider | null | undefined
  frameworkProvider?: TiptapCollabProvider | null | undefined
  user?: User | null
  enableFrameworkEditor?: boolean
  showSurfaceSwitcher?: boolean
  surfaceSwitcherVariant?: 'default' | 'floating' | 'compact' | 'pills'
  project?: any
}

// Progressive Enhancement Hook - only loads full editor when user interacts
const useProgressiveEditor = () => {
  const [loadFullEditor, setLoadFullEditor] = useState(false)
  const [userInteracted, setUserInteracted] = useState(false)

  useEffect(() => {
    const handleInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true)
        // Give user a moment to see the interface before loading heavy components
        setTimeout(() => setLoadFullEditor(true), 100)
      }
    }

    const events = ['click', 'keydown', 'touchstart']
    events.forEach(event => 
      document.addEventListener(event, handleInteraction, { once: true, passive: true })
    )

    // Auto-load after 2 seconds if no interaction
    const timer = setTimeout(() => {
      setLoadFullEditor(true)
    }, 2000)

    return () => {
      clearTimeout(timer)
      events.forEach(event => 
        document.removeEventListener(event, handleInteraction)
      )
    }
  }, [userInteracted])

  return { loadFullEditor, userInteracted }
}

// Ultra-minimal placeholder editor
const MicroPlaceholder = ({ onLoadRequest }: { onLoadRequest: () => void }) => (
  <div className="h-screen flex flex-col bg-white dark:bg-black">
    {/* Minimal header */}
    <div className="flex-shrink-0 border-b border-neutral-200 dark:border-neutral-800 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">SpectreWeave</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Loading editor components...</p>
          </div>
        </div>
        <button
          onClick={onLoadRequest}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          Load Full Editor
        </button>
      </div>
    </div>
    
    {/* Main content area */}
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            Ready to Write
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Your writing environment is optimized for speed. Click anywhere to load the full editor.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Dual Surface</span>
          </div>
          <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>AI Assistant</span>
          </div>
          <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Collaboration</span>
          </div>
          <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Framework</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Main component with progressive enhancement
const MicroEditor: React.FC<MicroEditorProps> = (props) => {
  const [isClient, setIsClient] = useState(false)
  const { loadFullEditor, userInteracted } = useProgressiveEditor()
  const [FullEditor, setFullEditor] = useState<React.ComponentType<any> | null>(null)

  // Client-side only guard
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load simplified editor when requested (much smaller than LightweightDualEditor)
  useEffect(() => {
    if (loadFullEditor && !FullEditor) {
      import('./SimplifiedDualEditor').then(module => {
        setFullEditor(() => module.default)
      }).catch(error => {
        console.error('Failed to load full editor:', error)
      })
    }
  }, [loadFullEditor, FullEditor])

  // Server-side rendering guard
  if (!isClient) {
    return <MicroLoadingSkeleton />
  }

  // Show full editor once loaded
  if (FullEditor) {
    return (
      <Suspense fallback={<MicroLoadingSkeleton />}>
        <FullEditor {...props} />
      </Suspense>
    )
  }

  // Show minimal placeholder until interaction or timeout
  return (
    <MicroErrorBoundary>
      <MicroPlaceholder onLoadRequest={() => {
        import('./SimplifiedDualEditor').then(module => {
          setFullEditor(() => module.default)
        })
      }} />
    </MicroErrorBoundary>
  )
}

MicroEditor.displayName = 'MicroEditor'

export default MicroEditor