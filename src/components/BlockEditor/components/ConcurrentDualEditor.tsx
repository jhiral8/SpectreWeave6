'use client'

import React, { 
  Suspense, 
  startTransition, 
  useDeferredValue, 
  useTransition,
  useMemo,
  ErrorBoundary
} from 'react'
import { useViewState, useEditors } from '../context/UnifiedEditorContext'
import { useDualEditor } from '../context/SplitEditorContext'
import { DualSurfaceView, SingleManuscriptView, SingleFrameworkView } from './ContextAwareSurfaces'
import { OptimizedMenuManager } from './OptimizedMenuManager'
import FloatingTopToolbar from './FloatingTopToolbar'
import { DualModeSwitcher } from '@/components/ui/SurfaceSwitcher'

// Error Boundary Component
class EditorErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Editor component error:', error, errorInfo)
    
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-center space-y-3">
            <div className="text-red-600 dark:text-red-400 text-lg font-medium">
              Editor Error
            </div>
            <div className="text-red-500 dark:text-red-300 text-sm">
              {this.state.error?.message || 'Something went wrong with the editor'}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined })
                window.location.reload()
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Reload Editor
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Loading Skeleton for Suspense
const EditorLoadingSkeleton = () => (
  <div className="flex-1 min-h-0 h-full relative animate-pulse">
    <div className="absolute inset-0 flex gap-12 justify-center items-stretch p-6">
      {/* Framework Surface Skeleton */}
      <div className="w-[30vw] h-full bg-[--card] text-[--card-foreground] rounded-lg flex flex-col border border-[--border]">
        <div className="flex-shrink-0 p-4 bg-[--muted] rounded-t-lg">
          <div className="h-4 bg-[--border] rounded w-32"></div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          <div className="h-3 bg-[--border] rounded"></div>
          <div className="h-3 bg-[--border] rounded w-3/4"></div>
          <div className="h-3 bg-[--border] rounded w-1/2"></div>
        </div>
      </div>
      
      {/* Manuscript Surface Skeleton */}
      <div className="w-[60%] h-full bg-[--card] text-[--card-foreground] rounded-lg flex flex-col border border-[--border]">
        <div className="flex-shrink-0 p-4 bg-[--muted] rounded-t-lg">
          <div className="h-4 bg-[--border] rounded w-24"></div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          <div className="h-3 bg-[--border] rounded"></div>
          <div className="h-3 bg-[--border] rounded"></div>
          <div className="h-3 bg-[--border] rounded w-5/6"></div>
          <div className="h-3 bg-[--border] rounded w-4/5"></div>
          <div className="h-3 bg-[--border] rounded w-3/4"></div>
        </div>
      </div>
    </div>
  </div>
)

// Concurrent Surface Renderer with Transitions
export const ConcurrentSurfaceRenderer = React.memo(() => {
  const { viewMode, canShowDual, setViewMode } = useViewState()
  const [isPending, startTransition] = useTransition()
  
  // Defer expensive view mode calculations
  const deferredViewMode = useDeferredValue(viewMode)
  const deferredCanShowDual = useDeferredValue(canShowDual)
  
  // Optimize view mode changes with transitions
  const handleViewModeChange = React.useCallback((newMode: typeof viewMode) => {
    startTransition(() => {
      setViewMode(newMode)
    })
  }, [setViewMode])
  
  // Memoize surface components to prevent unnecessary re-renders
  const surfaceComponents = useMemo(() => ({
    dual: <DualSurfaceView />,
    manuscript: <SingleManuscriptView />,
    framework: <SingleFrameworkView />
  }), [])
  
  return (
    <>
      {/* Surface Switcher with transition pending indicator */}
      <div className={`transition-opacity duration-200 ${isPending ? 'opacity-70' : 'opacity-100'}`}>
        <DualModeSwitcher
          activeMode={deferredViewMode}
          onModeChange={handleViewModeChange}
          canShowDual={deferredCanShowDual}
        />
      </div>

      {/* Content area with concurrent rendering */}
      <div className="flex-1 min-h-0 h-full relative">
        <Suspense fallback={<EditorLoadingSkeleton />}>
          <div className={`h-full transition-opacity duration-300 ${isPending ? 'opacity-80' : 'opacity-100'}`}>
            {surfaceComponents[deferredViewMode] || surfaceComponents.manuscript}
          </div>
        </Suspense>
      </div>
    </>
  )
})

// Enhanced Menu Manager with Error Boundaries
export const ConcurrentMenuManager = React.memo(() => {
  const { activeEditor } = useEditors()
  const [isPending, startTransition] = useTransition()
  
  // Defer menu loading for better performance
  const deferredEditor = useDeferredValue(activeEditor)
  
  if (!deferredEditor) {
    return null
  }
  
  return (
    <EditorErrorBoundary fallback={
      <div className="p-2 text-sm text-red-600 dark:text-red-400">
        Menu loading error - continuing without menus
      </div>
    }>
      <Suspense fallback={
        <div className="flex gap-2 p-2">
          <div className="animate-pulse w-8 h-8 bg-[--muted] rounded"></div>
          <div className="animate-pulse w-20 h-8 bg-[--muted] rounded"></div>
        </div>
      }>
        <div className={`transition-opacity duration-200 ${isPending ? 'opacity-70' : 'opacity-100'}`}>
          <OptimizedMenuManager />
        </div>
      </Suspense>
    </EditorErrorBoundary>
  )
})

// Main Concurrent Editor Component
export const ConcurrentDualEditor = React.memo(() => {
  const { activeEditor } = useEditors()
  const { isLoading } = useDualEditor()
  
  // Early loading states
  if (isLoading) {
    return <EditorLoadingSkeleton />
  }
  
  return (
    <EditorErrorBoundary>
      <div className="flex-1 min-w-0 min-h-0 h-full relative flex flex-col">
        <FloatingTopToolbar editor={activeEditor} />
        <ConcurrentSurfaceRenderer />
        <ConcurrentMenuManager />
      </div>
    </EditorErrorBoundary>
  )
})

// Export components
ConcurrentSurfaceRenderer.displayName = 'ConcurrentSurfaceRenderer'
ConcurrentMenuManager.displayName = 'ConcurrentMenuManager'
ConcurrentDualEditor.displayName = 'ConcurrentDualEditor'

export { EditorErrorBoundary }