'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { Editor } from '@tiptap/react'
import { User } from '@supabase/supabase-js'
import { WritingFramework } from '@/types/story-frameworks'

export type ViewMode = 'manuscript' | 'framework' | 'dual'

/**
 * Unified Editor Context - Replaces 6 over-engineered contexts with 1
 * Single Responsibility: Provide all editor state in one optimized context
 */
interface UnifiedEditorContextType {
  // Editors
  manuscriptEditor: Editor | null
  frameworkEditor: Editor | null
  activeEditor: Editor | null
  
  // View state
  viewMode: ViewMode
  canShowDual: boolean
  setViewMode: (mode: ViewMode) => void
  activeSurface: any
  switchToSurface: (surface: any) => void
  toggleSurface: () => void
  syncContentBetweenSurfaces: () => void
  
  // UI state
  leftSidebar: {
    isOpen: boolean
    toggle: () => void
    close: () => void
  }
  aiChatSidebar: {
    isOpen: boolean
    toggle: () => void
    close: () => void
  }
  leftNavigation: {
    isCollapsed: boolean
    isOpen: boolean
    toggle: () => void
    toggleOpen: () => void
    close: () => void
  }
  
  // Project data
  user?: User | null
  project?: any
  characterCount: {
    characters: () => number
    words: () => number
  }
  collabState: any
  users: any[]
  
  // Framework
  frameworkManager: {
    activeFramework: WritingFramework | null
    pendingFramework: any
    applyFramework: (framework: WritingFramework) => void
    clearFramework: () => void
    cancelFramework: () => void
    confirmFramework: () => void
  }
  
  // Refs
  menuContainerRef: React.RefObject<HTMLElement>
  
  // Loading states
  isLoading: boolean
}

const UnifiedEditorContext = createContext<UnifiedEditorContextType | null>(null)

// Single optimized hook
export const useEditorContext = () => {
  const context = useContext(UnifiedEditorContext)
  if (!context) {
    throw new Error('useEditorContext must be used within UnifiedEditorProvider')
  }
  return context
}

// Convenience hooks for specific concerns (optional)
export const useEditors = () => {
  const { manuscriptEditor, frameworkEditor, activeEditor } = useEditorContext()
  return { manuscriptEditor, frameworkEditor, activeEditor }
}

export const useViewState = () => {
  const { 
    viewMode, 
    canShowDual, 
    setViewMode, 
    activeSurface, 
    switchToSurface, 
    toggleSurface,
    syncContentBetweenSurfaces 
  } = useEditorContext()
  return { 
    viewMode, 
    canShowDual, 
    setViewMode, 
    activeSurface, 
    switchToSurface, 
    toggleSurface,
    syncContentBetweenSurfaces 
  }
}

export const useSidebars = () => {
  const { leftSidebar, aiChatSidebar, leftNavigation } = useEditorContext()
  return { leftSidebar, aiChatSidebar, leftNavigation }
}

// Single provider with intelligent memoization
interface UnifiedEditorProviderProps {
  children: React.ReactNode
  value: UnifiedEditorContextType
}

export const UnifiedEditorProvider: React.FC<UnifiedEditorProviderProps> = ({ 
  children, 
  value 
}) => {
  // Intelligent memoization - only recalculate when key values change
  const memoizedValue = useMemo(() => value, [
    // Editors
    value.manuscriptEditor,
    value.frameworkEditor,
    value.activeEditor,
    
    // View state
    value.viewMode,
    value.canShowDual,
    
    // UI state changes
    value.leftSidebar?.isOpen,
    value.aiChatSidebar?.isOpen,
    value.leftNavigation?.isCollapsed,
    value.leftNavigation?.isOpen,
    
    // Project changes
    value.user,
    value.project,
    value.collabState,
    value.users?.length,
    
    // Framework changes
    value.frameworkManager?.activeFramework,
    value.frameworkManager?.pendingFramework,
    
    // Loading
    value.isLoading
  ])

  return (
    <UnifiedEditorContext.Provider value={memoizedValue}>
      {children}
    </UnifiedEditorContext.Provider>
  )
}

export default UnifiedEditorProvider