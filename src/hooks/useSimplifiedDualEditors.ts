'use client'

import { useEffect, useMemo } from 'react'
import type { Doc as YDoc } from 'yjs'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import { WritingSurface } from '@/lib/ai/dualSurfaceContextManager'

// Unified hooks - consolidated functionality  
import { useEditorFactory } from './useEditorFactory'
import { useEditorState } from './useEditorState'
import { useEditorContent } from './useEditorContent'
import { useUnifiedSurfaceManager } from './useUnifiedSurfaceManager'
import { useUnifiedUIManager } from './useUnifiedUIManager'
import { useChapterNavigation } from './useChapterNavigation'
import { emptyContent } from '@/lib/data/emptyContent'

interface SimplifiedDualEditorsConfig {
  manuscriptYdoc?: YDoc
  frameworkYdoc?: YDoc
  manuscriptProvider?: TiptapCollabProvider | null
  frameworkProvider?: TiptapCollabProvider | null
  initialSurface?: WritingSurface
  enableFrameworkEditor?: boolean
}

/**
 * Simplified dual editors hook - orchestrates focused hooks
 * 50+ lines vs 320+ lines in original
 */
export const useSimplifiedDualEditors = ({
  manuscriptYdoc,
  frameworkYdoc,
  manuscriptProvider,
  frameworkProvider,
  initialSurface = 'manuscript',
  enableFrameworkEditor = true
}: SimplifiedDualEditorsConfig) => {
  // Unified surface management (consolidates useDualSurface + useResponsiveEditor)
  const surfaceManager = useUnifiedSurfaceManager(initialSurface === 'manuscript' ? 'manuscript' : 'dual')
  
  // Create editors using factory
  const manuscriptEditor = useEditorFactory({
    ydoc: manuscriptYdoc,
    provider: manuscriptProvider,
    surface: 'manuscript',
    autofocus: surfaceManager.activeSurface === 'manuscript',
    emptyContent
  })

  const frameworkEditor = enableFrameworkEditor ? useEditorFactory({
    ydoc: frameworkYdoc,
    provider: frameworkProvider,
    surface: 'framework',
    autofocus: surfaceManager.activeSurface === 'framework',
    emptyContent: null // Will be set by content hook
  }) : null

  // Editor state management
  const editorState = useEditorState({
    manuscriptEditor,
    frameworkEditor,
    manuscriptProvider,
    frameworkProvider,
    activeSurface: surfaceManager.activeSurface,
    enableFrameworkEditor
  })

  // Content management
  const contentActions = useEditorContent({
    manuscriptEditor,
    frameworkEditor,
    manuscriptProvider,
    frameworkProvider
  })

  // Unified UI management (consolidates useSidebar + useAIChatSidebar + useSidebarState)
  const uiManager = useUnifiedUIManager()
  
  // Chapter navigation
  const chapterNavigation = useChapterNavigation(manuscriptEditor)

  // Sync focus when switching surfaces
  useEffect(() => {
    const targetEditor = editorState.activeEditor
    if (targetEditor && !targetEditor.isFocused) {
      setTimeout(() => targetEditor.commands.focus(), 100)
    }
  }, [surfaceManager.activeSurface, editorState.activeEditor])

  // Return clean, consolidated API
  return {
    // Editors
    manuscriptEditor,
    frameworkEditor,
    activeEditor: editorState.activeEditor,
    
    // Surface management (unified)
    activeSurface: surfaceManager.activeSurface,
    switchToSurface: surfaceManager.switchToSurface,
    toggleSurface: surfaceManager.toggleSurface,
    
    // States
    users: [], // Simplified for now
    characterCount: editorState.characterCount,
    collabState: editorState.collabState,
    
    // UI (unified)
    leftSidebar: uiManager.leftSidebar,
    aiChatSidebar: uiManager.aiChatSidebar,
    leftNavigation: uiManager.leftNavigation,
    chapterNavigation,
    
    // Loading
    isLoading: editorState.isLoading,
    isManuscriptLoading: editorState.isManuscriptLoading,
    isFrameworkLoading: editorState.isFrameworkLoading,
    
    // Actions
    syncContentBetweenSurfaces: contentActions.syncContentBetweenSurfaces,
    resetSurface: contentActions.resetSurface
  }
}

export default useSimplifiedDualEditors