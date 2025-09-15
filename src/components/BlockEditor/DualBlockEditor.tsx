'use client'

import { EditorContent, PureEditorContent } from '@tiptap/react'
import React, { useMemo, useRef } from 'react'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import type { Doc as YDoc } from 'yjs'

import { LinkMenu } from '@/components/menus'
import useDualBlockEditors from '@/hooks/useDualBlockEditors'
import { useAIChatSidebar } from '@/hooks/useAIChatSidebar'

import '@/styles/editor.css'

import { Sidebar } from '@/components/Sidebar'
import { AIChatSidebar } from '@/components/AIChatSidebar/AIChatSidebar'
import { useLeftNavigation } from '@/hooks/useLeftNavigation'
import { EditorProvider } from '@/context/EditorProvider'
import { LazyMenuManager } from './components/LazyMenuManager'
import { ManuscriptSurface } from './components/ManuscriptSurface'
import { FrameworkSurface } from './components/FrameworkSurface'
import { SplitEditorProvider } from './context/SplitEditorContext'
import { UnifiedEditorProvider } from './context/UnifiedEditorContext'
import { ContextAwareEditorHeader } from './components/ContextAwareEditorHeader'
import { DualSurfaceView, SingleManuscriptView, SingleFrameworkView } from './components/ContextAwareSurfaces'
import { OptimizedMenuManager } from './components/OptimizedMenuManager'
import { ConcurrentDualEditor } from './components/ConcurrentDualEditor'
import { SurfaceSwitcher } from '@/components/ui/SurfaceSwitcher'
import { DualModeSwitcher, ViewMode } from '@/components/ui/SurfaceSwitcher'
import LogoLoader from '@/components/ui/LogoLoader'
import FrameworkToolbarVertical from '@/components/ui/FrameworkToolbarVertical'
import FrameworkConfirmModal from '@/components/ui/FrameworkConfirmModal'
import { useManuscriptBorderEffects, useFrameworkBorderEffects } from '@/hooks/useAIBorderEffects'
import { useFrameworkManager } from '@/hooks/useFrameworkManager'
import { useEditorMemoryTracking } from '@/lib/utils/editorMemoryManager'
import { WritingFramework } from '@/types/story-frameworks'
import { User } from '@supabase/supabase-js'

interface DualBlockEditorProps {
  manuscriptYdoc: YDoc
  frameworkYdoc?: YDoc
  manuscriptProvider?: TiptapCollabProvider | null | undefined
  frameworkProvider?: TiptapCollabProvider | null | undefined
  user?: User | null
  enableFrameworkEditor?: boolean
  showSurfaceSwitcher?: boolean
  surfaceSwitcherVariant?: 'default' | 'floating' | 'compact' | 'pills'
  project?: any // Project information for title and version
  showInternalLeftNavigation?: boolean
}

const DualBlockEditor = React.memo(({ 
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
}: DualBlockEditorProps) => {
  // Client-side only guard
  const [isClient, setIsClient] = React.useState(false)
  
  React.useEffect(() => {
    setIsClient(true)
  }, [])

  const menuContainerRef = useRef(null)
  const editorRef = useRef<PureEditorContent | null>(null)
  const [viewMode, setViewMode] = React.useState<ViewMode>('dual')
  const [canShowDual, setCanShowDual] = React.useState(true)
  
  // AI Border Effects
  const manuscriptBorder = useManuscriptBorderEffects({ 
    quality: 'high',
    intensity: 0.6 
  })
  const frameworkBorder = useFrameworkBorderEffects({ 
    confidence: 0.8,
    isDataFlowing: viewMode === 'dual' 
  })
  
  // Check if screen is wide enough for dual mode with debounced resize
  React.useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    let resizeTimer: NodeJS.Timeout | null = null
    
    const checkScreenSize = () => {
      const isWideEnough = window.innerWidth >= 1024 // lg breakpoint
      setCanShowDual(isWideEnough)
      // Enforce single-editor on small screens
      if (!isWideEnough && viewMode === 'dual') setViewMode('manuscript')
    }
    
    const debouncedCheckScreenSize = () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(checkScreenSize, 150)
    }
    
    checkScreenSize() // Initial check
    window.addEventListener('resize', debouncedCheckScreenSize)
    
    // Track memory usage
    if (manuscriptMemory.addTimer && resizeTimer) {
      manuscriptMemory.addTimer(resizeTimer)
    }
    if (manuscriptMemory.addListener) {
      manuscriptMemory.addListener('resize', debouncedCheckScreenSize)
    }
    
    return () => {
      window.removeEventListener('resize', debouncedCheckScreenSize)
      if (resizeTimer) clearTimeout(resizeTimer)
    }
  }, [viewMode])

  // Update data flow effect based on view mode - memoized to prevent unnecessary updates
  const frameworkBorderDataFlowing = React.useMemo(() => viewMode === 'dual', [viewMode])
  
  React.useEffect(() => {
    frameworkBorder.setDataFlowing(frameworkBorderDataFlowing)
  }, [frameworkBorderDataFlowing, frameworkBorder])

  const {
    manuscriptEditor,
    frameworkEditor,
    activeEditor,
    activeSurface,
    switchToSurface,
    toggleSurface,
    users,
    characterCount,
    collabState,
    leftSidebar,
    aiChatSidebar,
    chapterNavigation,
    isLoading,
    syncContentBetweenSurfaces,
  } = useDualBlockEditors({
    manuscriptYdoc,
    frameworkYdoc,
    manuscriptProvider,
    frameworkProvider,
    enableFrameworkEditor
  })

  // Memoize expensive calculations
  const displayedUsers = useMemo(() => users.slice(0, 3), [users])
  
  const frameworkManagerConfig = useMemo(() => ({
    frameworkEditor
  }), [frameworkEditor])

  // Framework Management
  const frameworkManager = useFrameworkManager(frameworkManagerConfig)

  // Left Navigation State - memoized to prevent unnecessary re-initialization
  const leftNavigation = useLeftNavigation()
  
  // Memory tracking for performance optimization
  const manuscriptMemory = useEditorMemoryTracking(manuscriptEditor, 'manuscript')
  const frameworkMemory = useEditorMemoryTracking(frameworkEditor, 'framework')
  
  // Memoize view mode dependent values
  const shouldShowDualMode = useMemo(() => 
    canShowDual && viewMode === 'dual', [canShowDual, viewMode])
  
  const currentActiveEditor = useMemo(() => {
    if (viewMode === 'manuscript') return manuscriptEditor
    if (viewMode === 'framework') return frameworkEditor
    return activeEditor
  }, [viewMode, manuscriptEditor, frameworkEditor, activeEditor])

  // Split context values for optimal performance
  const editorState = useMemo(() => ({
    manuscriptEditor,
    frameworkEditor,
    activeEditor,
    currentActiveEditor,
    isLoading,
    isClient
  }), [manuscriptEditor, frameworkEditor, activeEditor, currentActiveEditor, isLoading, isClient])

  const viewState = useMemo(() => ({
    viewMode,
    canShowDual,
    setViewMode,
    activeSurface,
    switchToSurface,
    toggleSurface,
    syncContentBetweenSurfaces
  }), [viewMode, canShowDual, setViewMode, activeSurface, switchToSurface, toggleSurface, syncContentBetweenSurfaces])

  const uiState = useMemo(() => ({
    leftSidebar,
    aiChatSidebar,
    leftNavigation
  }), [leftSidebar, aiChatSidebar, leftNavigation])

  const projectData = useMemo(() => ({
    user,
    project,
    characterCount,
    collabState,
    users,
    displayedUsers
  }), [user, project, characterCount, collabState, users, displayedUsers])

  const framework = useMemo(() => ({
    frameworkManager,
    manuscriptBorder,
    frameworkBorder
  }), [frameworkManager, manuscriptBorder, frameworkBorder])

  const refs = useMemo(() => ({
    menuContainerRef,
    editorRef
  }), [menuContainerRef, editorRef])

  // Render loading state if not client-side yet
  if (!isClient) {
    return (
      <div className="w-full h-full grid place-items-center">
        <LogoLoader />
      </div>
    )
  }

  if (isLoading || !manuscriptEditor) {
    return (
      <div className="w-full h-full grid place-items-center">
        <LogoLoader />
      </div>
    )
  }

  return (
    <SplitEditorProvider 
      editorState={editorState}
      viewState={viewState}
      uiState={uiState}
      projectData={projectData}
      framework={framework}
      refs={refs}
    >
      <UnifiedEditorProvider
        value={{
          manuscriptEditor,
          frameworkEditor,
          activeEditor,
          viewMode,
          canShowDual,
          setViewMode,
          activeSurface,
          switchToSurface,
          toggleSurface,
          syncContentBetweenSurfaces,
          leftSidebar,
          aiChatSidebar,
          leftNavigation,
          user,
          project,
          characterCount,
          collabState,
          users,
          frameworkManager,
          menuContainerRef,
          isLoading,
        }}
      >
        <EditorProvider
          editor={activeEditor}
          manuscriptEditor={manuscriptEditor}
          frameworkEditor={frameworkEditor}
          activeSurface={activeSurface}
          switchToSurface={switchToSurface}
          toggleSurface={toggleSurface}
          syncContentBetweenSurfaces={syncContentBetweenSurfaces}
        >
          <div className="editor-main-container h-[calc(100vh-56px)] flex flex-col bg-[--background] text-[--foreground]" ref={menuContainerRef}>
            {/* Bridge component exposes editor controls/state to portal header */}
            <ContextAwareEditorHeader />
            
            {/* Main Content Area */}
            <div className="flex flex-1 min-h-0">
              {/* Main Editor Container */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex flex-1 min-h-0 h-full w-full">
                  {/* Left Sidebar */}
                  <Sidebar
                    isOpen={leftSidebar.isOpen}
                    onClose={leftSidebar.close}
                    editor={activeEditor}
                  />
                  
                  {/* Main Content Area with Concurrent Features */}
                  <ConcurrentDualEditor />
                  
                  {/* Right Sidebar - AI Chat */}
                  <AIChatSidebar
                    editor={activeEditor}
                    isOpen={aiChatSidebar.isOpen}
                    onClose={aiChatSidebar.close}
                    chatState={aiChatSidebar}
                  />
                </div>
              </div>
            </div>
          </div>
        </EditorProvider>
        {/* Framework Confirmation Modal */}
        <FrameworkConfirmModal
          isOpen={!!frameworkManager.pendingFramework}
          onClose={frameworkManager.cancelFramework}
          onConfirm={frameworkManager.confirmFramework}
          frameworkName={frameworkManager.pendingFramework?.framework.name || ''}
        />
      </UnifiedEditorProvider>
    </SplitEditorProvider>
  )
})

// Display name for debugging
DualBlockEditor.displayName = 'DualBlockEditor'

export default DualBlockEditor