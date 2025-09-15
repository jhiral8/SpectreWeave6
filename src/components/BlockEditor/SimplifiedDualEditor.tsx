'use client'

import React, { useRef, useMemo } from 'react'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import type { Doc as YDoc } from 'yjs'
import { User } from '@supabase/supabase-js'

// Focused single-responsibility components
import { EditorContainer } from './components/EditorContainer'
import { BorderEffectsManager } from './components/BorderEffectsManager'
import { MemoryTracker } from './components/MemoryTracker'
import { ContextAwareEditorHeader } from './components/ContextAwareEditorHeader'
import { ConcurrentDualEditor } from './components/ConcurrentDualEditor'
import { LeftNavigation } from '@/components/LeftNavigation'
import { Sidebar } from '@/components/Sidebar'
import { AIChatSidebar } from '@/components/AIChatSidebar/AIChatSidebar'
import FrameworkConfirmModal from '@/components/ui/FrameworkConfirmModal'

// Focused hooks
import { useSimplifiedDualEditors } from '@/hooks/useSimplifiedDualEditors'
import { useFrameworkManager } from '@/hooks/useFrameworkManager'

// Context providers
import { EditorProvider } from '@/context/EditorProvider'
import { UnifiedEditorProvider } from './context/UnifiedEditorContext'

// Styles
import '@/styles/editor.css'

interface SimplifiedDualEditorProps {
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

/**
 * SimplifiedDualEditor - Refactored with Single Responsibility Principle
 * Main responsibility: Orchestrate child components
 */
const SimplifiedDualEditor: React.FC<SimplifiedDualEditorProps> = ({
  manuscriptYdoc,
  frameworkYdoc,
  manuscriptProvider,
  frameworkProvider,
  user,
  enableFrameworkEditor = true,
  showSurfaceSwitcher = true,
  surfaceSwitcherVariant = 'floating',
  project
}) => {
  const menuContainerRef = useRef(null)
  
  // Unified editor state management - now includes surface & UI management
  const editors = useSimplifiedDualEditors({
    manuscriptYdoc,
    frameworkYdoc,
    manuscriptProvider,
    frameworkProvider,
    enableFrameworkEditor
  })

  // Framework management
  const frameworkManager = useFrameworkManager({
    frameworkEditor: editors.frameworkEditor
  })

  // Active editor is now managed within the unified editors hook
  const currentActiveEditor = editors.activeEditor

  // Unified context values - all managed by consolidated hooks
  const contextValue = useMemo(() => ({
    // Editors
    manuscriptEditor: editors.manuscriptEditor,
    frameworkEditor: editors.frameworkEditor,
    activeEditor: currentActiveEditor,
    
    // View state (now unified)
    viewMode: editors.activeSurface, // Surface and view are now unified
    canShowDual: true, // Managed internally by unified surface manager
    setViewMode: editors.switchToSurface,
    activeSurface: editors.activeSurface,
    switchToSurface: editors.switchToSurface,
    toggleSurface: editors.toggleSurface,
    syncContentBetweenSurfaces: editors.syncContentBetweenSurfaces,
    
    // UI state (now unified)
    leftSidebar: editors.leftSidebar,
    aiChatSidebar: editors.aiChatSidebar,
    leftNavigation: editors.leftNavigation,
    
    // Project data
    user,
    project,
    characterCount: editors.characterCount,
    collabState: editors.collabState,
    users: editors.users,
    
    // Framework
    frameworkManager,
    
    // Refs
    menuContainerRef,
    
    // Loading
    isLoading: editors.isLoading
  }), [editors, currentActiveEditor, frameworkManager, user, project])

  // Loading state
  if (editors.isLoading || !editors.manuscriptEditor) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading simplified editor...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Memory tracking - separate concern */}
      <MemoryTracker
        manuscriptEditor={editors.manuscriptEditor}
        frameworkEditor={editors.frameworkEditor}
      />
      
      {/* Border effects - separate concern */}
      <BorderEffectsManager viewMode={editors.activeSurface} />
      
      {/* Main editor with unified context - much simpler */}
      <UnifiedEditorProvider value={contextValue}>
        <EditorProvider
          editor={editors.activeEditor}
          manuscriptEditor={editors.manuscriptEditor}
          frameworkEditor={editors.frameworkEditor}
          activeSurface={editors.activeSurface}
          switchToSurface={editors.switchToSurface}
          toggleSurface={editors.toggleSurface}
          syncContentBetweenSurfaces={editors.syncContentBetweenSurfaces}
        >
          <EditorContainer menuContainerRef={menuContainerRef}>
            {/* Header */}
            <ContextAwareEditorHeader />
            
            {/* Main Layout */}
            <div className="flex flex-1 min-h-0">
              {/* Left Navigation */}
              <LeftNavigation
                isCollapsed={editors.leftNavigation.isCollapsed}
                isOpen={editors.leftNavigation.isOpen}
                onToggleCollapsed={editors.leftNavigation.toggle}
                onToggleOpen={editors.leftNavigation.toggleOpen}
                onClose={editors.leftNavigation.close}
                user={user}
                project={project}
              />
              
              {/* Editor Area */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex flex-1 min-h-0 h-full w-full">
                  {/* Left Sidebar */}
                  <Sidebar
                    isOpen={editors.leftSidebar.isOpen}
                    onClose={editors.leftSidebar.close}
                    editor={editors.activeEditor}
                  />
                  
                  {/* Main Editor */}
                  <ConcurrentDualEditor />
                  
                  {/* AI Chat */}
                  <AIChatSidebar
                    editor={editors.activeEditor}
                    isOpen={editors.aiChatSidebar.isOpen}
                    onClose={editors.aiChatSidebar.close}
                    chatState={editors.aiChatSidebar}
                  />
                </div>
              </div>
            </div>
          </EditorContainer>
        </EditorProvider>
      </UnifiedEditorProvider>

      {/* Framework Modal - separate from main flow */}
      <FrameworkConfirmModal
        isOpen={!!frameworkManager.pendingFramework}
        onClose={frameworkManager.cancelFramework}
        onConfirm={frameworkManager.confirmFramework}
        frameworkName={frameworkManager.pendingFramework?.framework.name || ''}
      />
    </>
  )
}

SimplifiedDualEditor.displayName = 'SimplifiedDualEditor'

export default SimplifiedDualEditor