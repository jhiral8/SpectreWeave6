'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { Editor } from '@tiptap/react'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import type { Doc as YDoc } from 'yjs'
import { User } from '@supabase/supabase-js'
import { WritingFramework } from '@/types/story-frameworks'

export type ViewMode = 'manuscript' | 'framework' | 'dual'

interface DualEditorContextType {
  // Editors
  manuscriptEditor: Editor | null
  frameworkEditor: Editor | null
  activeEditor: Editor | null
  currentActiveEditor: Editor | null
  
  // View State
  viewMode: ViewMode
  canShowDual: boolean
  setViewMode: (mode: ViewMode) => void
  
  // User & Project
  user?: User | null
  project?: any
  
  // Character count & collaboration
  characterCount: {
    characters: () => number
    words: () => number
  }
  collabState: any
  users: any[]
  displayedUsers: any[]
  
  // Surface switching
  activeSurface: any
  switchToSurface: (surface: any) => void
  toggleSurface: () => void
  syncContentBetweenSurfaces: () => void
  
  // Sidebar states
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
  
  // Navigation
  leftNavigation: {
    isCollapsed: boolean
    isOpen: boolean
    toggle: () => void
    toggleOpen: () => void
    close: () => void
  }
  
  // Framework management
  frameworkManager: {
    activeFramework: WritingFramework | null
    pendingFramework: any
    applyFramework: (framework: WritingFramework) => void
    clearFramework: () => void
    cancelFramework: () => void
    confirmFramework: () => void
  }
  
  // Border effects
  manuscriptBorder: {
    getManuscriptClasses: () => string
    getCSSVariables: () => React.CSSProperties
  }
  frameworkBorder: {
    getFrameworkClasses: () => string
    getCSSVariables: () => React.CSSProperties
    setDataFlowing: (flowing: boolean) => void
  }
  
  // Loading states
  isLoading: boolean
  isClient: boolean
  
  // Refs
  menuContainerRef: React.RefObject<HTMLElement>
  editorRef: React.RefObject<any>
}

const DualEditorContext = createContext<DualEditorContextType | null>(null)

export const useDualEditor = () => {
  const context = useContext(DualEditorContext)
  if (!context) {
    throw new Error('useDualEditor must be used within a DualEditorProvider')
  }
  return context
}

interface DualEditorProviderProps {
  children: React.ReactNode
  value: DualEditorContextType
}

export const DualEditorProvider: React.FC<DualEditorProviderProps> = ({ 
  children, 
  value 
}) => {
  // Memoize the context value to prevent unnecessary re-renders
  const memoizedValue = useMemo(() => value, [
    value.manuscriptEditor,
    value.frameworkEditor,
    value.activeEditor,
    value.currentActiveEditor,
    value.viewMode,
    value.canShowDual,
    value.user,
    value.project,
    value.characterCount,
    value.collabState,
    value.users,
    value.displayedUsers,
    value.activeSurface,
    value.leftSidebar.isOpen,
    value.aiChatSidebar.isOpen,
    value.leftNavigation.isCollapsed,
    value.leftNavigation.isOpen,
    value.frameworkManager.activeFramework,
    value.frameworkManager.pendingFramework,
    value.isLoading,
    value.isClient
  ])

  return (
    <DualEditorContext.Provider value={memoizedValue}>
      {children}
    </DualEditorContext.Provider>
  )
}