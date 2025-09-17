'use client'

import React, { useState, useCallback, useEffect, ReactNode, useMemo } from 'react'
import { Editor } from '@tiptap/react'
import { EditorContext, EditorContextValue } from './EditorContext'
import { AIProvider } from '@/lib/ai/types'
import { WritingSurface } from '@/lib/ai/dualSurfaceContextManager'

interface EditorProviderProps {
  children: ReactNode
  // Single editor mode (backward compatibility)
  editor?: Editor | null
  // Dual editor mode
  manuscriptEditor?: Editor | null
  frameworkEditor?: Editor | null
  activeSurface?: WritingSurface
  isDualMode?: boolean
  initialSettings?: Partial<EditorContextValue>
  // Dual editor actions
  switchToSurface?: (surface: WritingSurface) => void
  toggleSurface?: () => void
  syncContentBetweenSurfaces?: () => void
}

export const EditorProvider: React.FC<EditorProviderProps> = ({
  children,
  editor,
  manuscriptEditor,
  frameworkEditor,
  activeSurface = 'manuscript',
  isDualMode = false,
  initialSettings = {},
  switchToSurface,
  toggleSurface,
  syncContentBetweenSurfaces
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [autosaveEnabled, setAutosaveEnabled] = useState(true)
  const [collaborationEnabled, setCollaborationEnabled] = useState(true)
  
  // AI Features
  const [aiEnabled, setAiEnabled] = useState(true)
  const [selectedAIProvider, setSelectedAIProvider] = useState<AIProvider>('gemini')
  
  // UI State
  const [showFormatting, setShowFormatting] = useState(true)
  const [showAnalytics, setShowAnalytics] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Determine active editor
  const activeEditor = useMemo(() => {
    if (isDualMode) {
      return activeSurface === 'manuscript' ? manuscriptEditor : frameworkEditor
    }
    return editor
  }, [isDualMode, activeSurface, manuscriptEditor, frameworkEditor, editor])

  // Track unsaved changes from all relevant editors
  useEffect(() => {
    const editorsToTrack = isDualMode 
      ? [manuscriptEditor, frameworkEditor].filter(Boolean) as Editor[]
      : editor ? [editor] : []

    if (editorsToTrack.length === 0) return

    const handleUpdate = () => {
      setHasUnsavedChanges(true)
    }

    editorsToTrack.forEach(editorInstance => {
      editorInstance.on('update', handleUpdate)
    })
    
    return () => {
      editorsToTrack.forEach(editorInstance => {
        editorInstance.off('update', handleUpdate)
      })
    }
  }, [isDualMode, manuscriptEditor, frameworkEditor, editor])

  // Actions
  const saveDocument = useCallback(async () => {
    if (!activeEditor || !hasUnsavedChanges) return

    setIsLoading(true)
    try {
      // Here you would implement actual save logic
      console.log('Saving document...')
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate save
      setHasUnsavedChanges(false)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save document:', error)
    } finally {
      setIsLoading(false)
    }
  }, [activeEditor, hasUnsavedChanges])

  // Auto-save functionality
  useEffect(() => {
    if (!autosaveEnabled || !hasUnsavedChanges || !activeEditor) return

    const autosaveTimer = setTimeout(() => {
      saveDocument()
    }, 30000) // Auto-save every 30 seconds

    return () => clearTimeout(autosaveTimer)
  }, [hasUnsavedChanges, autosaveEnabled, saveDocument, activeEditor])


  const toggleAutosave = useCallback(() => {
    setAutosaveEnabled(prev => !prev)
  }, [])

  const toggleAI = useCallback(() => {
    setAiEnabled(prev => !prev)
  }, [])

  const toggleFormatting = useCallback(() => {
    setShowFormatting(prev => !prev)
  }, [])

  const toggleAnalytics = useCallback(() => {
    setShowAnalytics(prev => !prev)
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        if (activeEditor && hasUnsavedChanges) {
          setIsLoading(true)
          setTimeout(() => {
            setHasUnsavedChanges(false)
            setLastSaved(new Date())
            setIsLoading(false)
          }, 500)
        }
      }
      
      // Ctrl/Cmd + Shift + F to toggle formatting
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'F') {
        event.preventDefault()
        setShowFormatting(prev => !prev)
      }
      
      // Ctrl/Cmd + Shift + A to toggle analytics
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
        event.preventDefault()
        setShowAnalytics(prev => !prev)
      }
      
      // Ctrl/Cmd + Shift + B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'B') {
        event.preventDefault()
        setSidebarOpen(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const contextValue: EditorContextValue = {
    // Single editor support (backward compatibility)
    editor,
    
    // Dual editor support
    manuscriptEditor,
    frameworkEditor,
    activeEditor,
    activeSurface,
    isDualMode,
    
    // State management
    isLoading,
    hasUnsavedChanges,
    lastSaved,
    autosaveEnabled,
    collaborationEnabled,
    
    // AI Features
    aiEnabled,
    selectedAIProvider,
    
    // UI State
    showFormatting,
    showAnalytics,
    sidebarOpen,
    
    // Actions
    saveDocument,
    toggleAutosave,
    toggleAI,
    toggleFormatting,
    toggleAnalytics,
    toggleSidebar,
    
    // Dual editor actions
    switchToSurface,
    toggleSurface,
    syncContentBetweenSurfaces,
    
    // Apply initial settings
    ...initialSettings
  }

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  )
}

export default EditorProvider