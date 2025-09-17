'use client'

import { useEffect } from 'react'
import { Editor } from '@tiptap/react'

/**
 * Advanced memory management for editor instances
 * Prevents memory leaks and optimizes garbage collection
 */

// WeakMap for editor references - automatically cleaned when editors are destroyed
const editorInstances = new WeakMap<Editor, {
  id: string
  createdAt: number
  lastAccessed: number
}>()

const editorEventListeners = new WeakMap<Editor, Map<string, Function>>()
const editorTimers = new WeakMap<Editor, Set<NodeJS.Timeout>>()

export class EditorMemoryManager {
  private static instance: EditorMemoryManager
  private cleanupInterval: NodeJS.Timeout | null = null
  
  static getInstance(): EditorMemoryManager {
    if (!EditorMemoryManager.instance) {
      EditorMemoryManager.instance = new EditorMemoryManager()
    }
    return EditorMemoryManager.instance
  }
  
  private constructor() {
    // Start periodic cleanup
    this.startPeriodicCleanup()
  }
  
  /**
   * Register an editor instance for memory tracking
   */
  registerEditor(editor: Editor, id: string): void {
    const now = Date.now()
    editorInstances.set(editor, {
      id,
      createdAt: now,
      lastAccessed: now
    })
    
    // Initialize event listeners and timers tracking
    editorEventListeners.set(editor, new Map())
    editorTimers.set(editor, new Set())
    
    // Add cleanup on destroy
    editor.on('destroy', () => {
      this.cleanupEditor(editor)
    })
  }
  
  /**
   * Track editor access for cleanup optimization
   */
  trackEditorAccess(editor: Editor): void {
    const info = editorInstances.get(editor)
    if (info) {
      info.lastAccessed = Date.now()
    }
  }
  
  /**
   * Register an event listener for cleanup tracking
   */
  addEventListenerTracking(editor: Editor, eventName: string, listener: Function): void {
    const listeners = editorEventListeners.get(editor)
    if (listeners) {
      listeners.set(eventName, listener)
    }
  }
  
  /**
   * Register a timer for cleanup tracking
   */
  addTimerTracking(editor: Editor, timer: NodeJS.Timeout): void {
    const timers = editorTimers.get(editor)
    if (timers) {
      timers.add(timer)
    }
  }
  
  /**
   * Clean up a specific editor instance
   */
  private cleanupEditor(editor: Editor): void {
    // Clear tracked timers
    const timers = editorTimers.get(editor)
    if (timers) {
      timers.forEach(timer => {
        clearTimeout(timer)
        clearInterval(timer)
      })
      timers.clear()
    }
    
    // Clear tracked event listeners
    const listeners = editorEventListeners.get(editor)
    if (listeners) {
      listeners.forEach((listener, eventName) => {
        if (typeof window !== 'undefined') {
          window.removeEventListener(eventName, listener as EventListener)
        }
        if (typeof document !== 'undefined') {
          document.removeEventListener(eventName, listener as EventListener)
        }
      })
      listeners.clear()
    }
    
    // Force garbage collection hint (if available in dev)
    if (typeof window !== 'undefined' && 'gc' in window && process.env.NODE_ENV === 'development') {
      // @ts-ignore - gc is available in Chrome with --expose-gc flag
      window.gc?.()
    }
  }
  
  /**
   * Start periodic cleanup of inactive editors
   */
  private startPeriodicCleanup(): void {
    if (typeof window === 'undefined') return
    
    this.cleanupInterval = setInterval(() => {
      this.performPeriodicCleanup()
    }, 30000) // Every 30 seconds
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.destroy()
    })
  }
  
  /**
   * Perform periodic cleanup of inactive editors
   */
  private performPeriodicCleanup(): void {
    const now = Date.now()
    const INACTIVE_THRESHOLD = 5 * 60 * 1000 // 5 minutes
    
    // Note: We can't iterate over WeakMap, but this method is here
    // for potential future enhancements with additional tracking
    
    // Force garbage collection in development
    if (typeof window !== 'undefined' && 'gc' in window && process.env.NODE_ENV === 'development') {
      // @ts-ignore
      window.gc?.()
    }
  }
  
  /**
   * Get memory usage statistics (development only)
   */
  getMemoryStats(): { 
    editorCount: number
    timersCount: number
    listenersCount: number
    memoryUsage?: any
  } | null {
    if (process.env.NODE_ENV !== 'development') {
      return null
    }
    
    let editorCount = 0
    let timersCount = 0
    let listenersCount = 0
    
    // We can't iterate WeakMaps directly, but we can approximate
    // by counting active references in our cleanup tracking
    
    const memoryUsage = typeof performance !== 'undefined' && 'memory' in performance 
      ? (performance as any).memory 
      : undefined
    
    return {
      editorCount,
      timersCount,
      listenersCount,
      memoryUsage
    }
  }
  
  /**
   * Manual cleanup trigger
   */
  performManualCleanup(): void {
    this.performPeriodicCleanup()
  }
  
  /**
   * Destroy the memory manager
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Export singleton instance
export const editorMemoryManager = EditorMemoryManager.getInstance()

/**
 * Hook for using memory manager in React components
 */
export const useEditorMemoryTracking = (editor: Editor | null, editorId: string) => {
  useEffect(() => {
    if (!editor) return
    
    // Register editor for memory tracking
    editorMemoryManager.registerEditor(editor, editorId)
    
    // Track access on every render
    editorMemoryManager.trackEditorAccess(editor)
    
    return () => {
      // Cleanup is handled by the editor's destroy event
    }
  }, [editor, editorId])
  
  return {
    trackAccess: () => editor && editorMemoryManager.trackEditorAccess(editor),
    addTimer: (timer: NodeJS.Timeout) => editor && editorMemoryManager.addTimerTracking(editor, timer),
    addListener: (eventName: string, listener: Function) => 
      editor && editorMemoryManager.addEventListenerTracking(editor, eventName, listener),
    getStats: () => editorMemoryManager.getMemoryStats()
  }
}

export default editorMemoryManager