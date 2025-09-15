'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { Editor } from '@tiptap/react'
import { User } from '@supabase/supabase-js'
import { WritingFramework } from '@/types/story-frameworks'

export type ViewMode = 'manuscript' | 'framework' | 'dual'

// Split contexts to prevent cascade re-renders
interface EditorStateContextType {
  manuscriptEditor: Editor | null
  frameworkEditor: Editor | null
  activeEditor: Editor | null
  currentActiveEditor: Editor | null
  isLoading: boolean
  isClient: boolean
}

interface ViewStateContextType {
  viewMode: ViewMode
  canShowDual: boolean
  setViewMode: (mode: ViewMode) => void
  activeSurface: any
  switchToSurface: (surface: any) => void
  toggleSurface: () => void
  syncContentBetweenSurfaces: () => void
}

interface UIStateContextType {
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
}

interface ProjectContextType {
  user?: User | null
  project?: any
  characterCount: {
    characters: () => number
    words: () => number
  }
  collabState: any
  users: any[]
  displayedUsers: any[]
}

interface FrameworkContextType {
  frameworkManager: {
    activeFramework: WritingFramework | null
    pendingFramework: any
    applyFramework: (framework: WritingFramework) => void
    clearFramework: () => void
    cancelFramework: () => void
    confirmFramework: () => void
  }
  manuscriptBorder: {
    getManuscriptClasses: () => string
    getCSSVariables: () => React.CSSProperties
  }
  frameworkBorder: {
    getFrameworkClasses: () => string
    getCSSVariables: () => React.CSSProperties
    setDataFlowing: (flowing: boolean) => void
  }
}

interface RefsContextType {
  menuContainerRef: React.RefObject<HTMLElement>
  editorRef: React.RefObject<any>
}

// Create separate contexts
const EditorStateContext = createContext<EditorStateContextType | null>(null)
const ViewStateContext = createContext<ViewStateContextType | null>(null)
const UIStateContext = createContext<UIStateContextType | null>(null)
const ProjectContext = createContext<ProjectContextType | null>(null)
const FrameworkContext = createContext<FrameworkContextType | null>(null)
const RefsContext = createContext<RefsContextType | null>(null)

// Optimized hooks with proper error handling
export const useEditorState = () => {
  const context = useContext(EditorStateContext)
  if (!context) throw new Error('useEditorState must be used within EditorStateProvider')
  return context
}

export const useViewState = () => {
  const context = useContext(ViewStateContext)
  if (!context) throw new Error('useViewState must be used within ViewStateProvider')
  return context
}

export const useUIState = () => {
  const context = useContext(UIStateContext)
  if (!context) throw new Error('useUIState must be used within UIStateProvider')
  return context
}

export const useProjectContext = () => {
  const context = useContext(ProjectContext)
  if (!context) throw new Error('useProjectContext must be used within ProjectProvider')
  return context
}

export const useFrameworkContext = () => {
  const context = useContext(FrameworkContext)
  if (!context) throw new Error('useFrameworkContext must be used within FrameworkProvider')
  return context
}

export const useRefsContext = () => {
  const context = useContext(RefsContext)
  if (!context) throw new Error('useRefsContext must be used within RefsProvider')
  return context
}

// Convenience hook that combines commonly used contexts
export const useDualEditor = () => {
  const editorState = useEditorState()
  const viewState = useViewState()
  const uiState = useUIState()
  const projectData = useProjectContext()
  const framework = useFrameworkContext()
  const refs = useRefsContext()
  
  return {
    ...editorState,
    ...viewState,
    ...uiState,
    ...projectData,
    ...framework,
    ...refs
  }
}

// Providers with proper memoization
export const EditorStateProvider: React.FC<{ children: React.ReactNode; value: EditorStateContextType }> = ({ 
  children, value 
}) => {
  const memoizedValue = useMemo(() => value, [
    value.manuscriptEditor,
    value.frameworkEditor,
    value.activeEditor,
    value.currentActiveEditor,
    value.isLoading,
    value.isClient
  ])
  
  return (
    <EditorStateContext.Provider value={memoizedValue}>
      {children}
    </EditorStateContext.Provider>
  )
}

export const ViewStateProvider: React.FC<{ children: React.ReactNode; value: ViewStateContextType }> = ({ 
  children, value 
}) => {
  const memoizedValue = useMemo(() => value, [
    value.viewMode,
    value.canShowDual,
    value.setViewMode,
    value.activeSurface,
    value.switchToSurface,
    value.toggleSurface,
    value.syncContentBetweenSurfaces
  ])
  
  return (
    <ViewStateContext.Provider value={memoizedValue}>
      {children}
    </ViewStateContext.Provider>
  )
}

export const UIStateProvider: React.FC<{ children: React.ReactNode; value: UIStateContextType }> = ({ 
  children, value 
}) => {
  const memoizedValue = useMemo(() => value, [
    value.leftSidebar.isOpen,
    value.aiChatSidebar.isOpen,
    value.leftNavigation.isCollapsed,
    value.leftNavigation.isOpen
  ])
  
  return (
    <UIStateContext.Provider value={memoizedValue}>
      {children}
    </UIStateContext.Provider>
  )
}

export const ProjectProvider: React.FC<{ children: React.ReactNode; value: ProjectContextType }> = ({ 
  children, value 
}) => {
  const memoizedValue = useMemo(() => value, [
    value.user,
    value.project,
    value.characterCount,
    value.collabState,
    value.users,
    value.displayedUsers
  ])
  
  return (
    <ProjectContext.Provider value={memoizedValue}>
      {children}
    </ProjectContext.Provider>
  )
}

export const FrameworkProvider: React.FC<{ children: React.ReactNode; value: FrameworkContextType }> = ({ 
  children, value 
}) => {
  const memoizedValue = useMemo(() => value, [
    value.frameworkManager.activeFramework,
    value.frameworkManager.pendingFramework,
    value.manuscriptBorder,
    value.frameworkBorder
  ])
  
  return (
    <FrameworkContext.Provider value={memoizedValue}>
      {children}
    </FrameworkContext.Provider>
  )
}

export const RefsProvider: React.FC<{ children: React.ReactNode; value: RefsContextType }> = ({ 
  children, value 
}) => {
  // Refs don't change, so we can use the value directly
  return (
    <RefsContext.Provider value={value}>
      {children}
    </RefsContext.Provider>
  )
}

// Combined provider for easier usage
export const SplitEditorProvider: React.FC<{
  children: React.ReactNode
  editorState: EditorStateContextType
  viewState: ViewStateContextType
  uiState: UIStateContextType
  projectData: ProjectContextType
  framework: FrameworkContextType
  refs: RefsContextType
}> = ({ children, editorState, viewState, uiState, projectData, framework, refs }) => {
  return (
    <RefsProvider value={refs}>
      <EditorStateProvider value={editorState}>
        <ViewStateProvider value={viewState}>
          <UIStateProvider value={uiState}>
            <ProjectProvider value={projectData}>
              <FrameworkProvider value={framework}>
                {children}
              </FrameworkProvider>
            </ProjectProvider>
          </UIStateProvider>
        </ViewStateProvider>
      </EditorStateProvider>
    </RefsProvider>
  )
}