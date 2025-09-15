'use client'

import React, { useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { useEditorMemoryTracking } from '@/lib/utils/editorMemoryManager'

interface MemoryTrackerProps {
  manuscriptEditor: Editor | null
  frameworkEditor: Editor | null
  children?: React.ReactNode
}

/**
 * MemoryTracker Component
 * Single Responsibility: Track and manage editor memory usage
 */
export const MemoryTracker: React.FC<MemoryTrackerProps> = ({
  manuscriptEditor,
  frameworkEditor,
  children
}) => {
  // Memory tracking for performance optimization
  const manuscriptMemory = useEditorMemoryTracking(manuscriptEditor, 'manuscript')
  const frameworkMemory = useEditorMemoryTracking(frameworkEditor, 'framework')

  // Log memory stats in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const logMemoryStats = () => {
        console.debug('Memory Tracking Stats:', {
          manuscript: manuscriptMemory,
          framework: frameworkMemory,
          total: {
            listeners: (manuscriptMemory?.listenerCount || 0) + (frameworkMemory?.listenerCount || 0),
            timers: (manuscriptMemory?.timerCount || 0) + (frameworkMemory?.timerCount || 0)
          }
        })
      }

      const interval = setInterval(logMemoryStats, 30000) // Log every 30 seconds
      return () => clearInterval(interval)
    }
  }, [manuscriptMemory, frameworkMemory])

  // Memory context for child components if needed
  const memoryContext = React.useMemo(() => ({
    manuscript: manuscriptMemory,
    framework: frameworkMemory
  }), [manuscriptMemory, frameworkMemory])

  if (children) {
    return (
      <MemoryContext.Provider value={memoryContext}>
        {children}
      </MemoryContext.Provider>
    )
  }

  return null
}

// Optional context for accessing memory tracking
const MemoryContext = React.createContext<{
  manuscript: ReturnType<typeof useEditorMemoryTracking>
  framework: ReturnType<typeof useEditorMemoryTracking>
} | null>(null)

export const useMemoryTracking = () => {
  const context = React.useContext(MemoryContext)
  return context // Can be null, components should handle gracefully
}

MemoryTracker.displayName = 'MemoryTracker'

export default MemoryTracker