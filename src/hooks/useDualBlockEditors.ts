import { useEffect, useMemo, useState, useCallback } from 'react'
import { Editor, useEditor } from '@tiptap/react'
import { Collaboration } from '@tiptap/extension-collaboration'
import { TiptapCollabProvider, WebSocketStatus } from '@hocuspocus/provider'
import type { Doc as YDoc } from 'yjs'

import { ExtensionKit } from '@/extensions/extension-kit'
import { userColors, userNames } from '../lib/constants'
import { randomElement } from '../lib/utils'
import { EditorUser } from '../components/BlockEditor/types'
import { useSidebar } from './useSidebar'
import { useAIChatSidebar } from './useAIChatSidebar'
import { useChapterNavigation } from './useChapterNavigation'
import useDualSurface from './useDualSurface'
import { WritingSurface } from '@/lib/ai/dualSurfaceContextManager'
import { emptyContent, emptyFrameworkContent } from '@/lib/data/emptyContent'

declare global {
  interface Window {
    manuscriptEditor: Editor | null
    frameworkEditor: Editor | null
    activeEditor: Editor | null
  }
}

interface DualEditorConfig {
  manuscriptYdoc?: YDoc
  frameworkYdoc?: YDoc
  manuscriptProvider?: TiptapCollabProvider | null | undefined
  frameworkProvider?: TiptapCollabProvider | null | undefined
  initialSurface?: WritingSurface
  enableFrameworkEditor?: boolean
}

interface DualEditorReturn {
  // Editors
  manuscriptEditor: Editor | null
  frameworkEditor: Editor | null
  activeEditor: Editor | null
  
  // Surface management
  activeSurface: WritingSurface
  switchToSurface: (surface: WritingSurface) => void
  toggleSurface: () => void
  
  // Shared states
  users: EditorUser[]
  characterCount: { characters: () => number; words: () => number }
  collabState: WebSocketStatus
  
  // UI state
  leftSidebar: ReturnType<typeof useSidebar>
  aiChatSidebar: ReturnType<typeof useAIChatSidebar>
  chapterNavigation: ReturnType<typeof useChapterNavigation>
  
  // Loading states
  isManuscriptLoading: boolean
  isFrameworkLoading: boolean
  isLoading: boolean
  
  // Actions
  syncContentBetweenSurfaces: () => void
  resetSurface: (surface: WritingSurface) => void
}

const createFrameworkContent = () => ({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Story Framework' }]
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Characters' }]
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Define your main characters, their motivations, and character arcs here.' }]
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Plot Structure' }]
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Outline your story structure, key plot points, and narrative flow.' }]
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'World Building' }]
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Describe the setting, rules, and environment of your story world.' }]
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Themes & Messages' }]
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Identify the core themes and messages you want to convey.' }]
    }
  ]
})

const useDualBlockEditors = ({
  manuscriptYdoc,
  frameworkYdoc,
  manuscriptProvider,
  frameworkProvider,
  initialSurface = 'manuscript',
  enableFrameworkEditor = true,
}: DualEditorConfig): DualEditorReturn => {
  const leftSidebar = useSidebar()
  const dualSurface = useDualSurface(initialSurface)
  
  const [manuscriptCollabState, setManuscriptCollabState] = useState<WebSocketStatus>(WebSocketStatus.Connecting)
  const [frameworkCollabState, setFrameworkCollabState] = useState<WebSocketStatus>(WebSocketStatus.Connecting)
  const [isManuscriptLoading, setIsManuscriptLoading] = useState(true)
  const [isFrameworkLoading, setIsFrameworkLoading] = useState(enableFrameworkEditor)

  // Manuscript Editor
  const manuscriptEditor = useEditor(
    {
      immediatelyRender: false,
      autofocus: dualSurface.activeSurface === 'manuscript',
      onCreate: ({ editor }) => {
        setIsManuscriptLoading(false)
        if (manuscriptProvider) {
          manuscriptProvider.on('synced', () => {
            if (editor.isEmpty) {
              editor.commands.setContent(emptyContent)
            }
          })
        } else {
          // No provider, set content immediately
          if (editor.isEmpty) {
            editor.commands.setContent(emptyContent)
          }
        }
      },
      extensions: [
        ...ExtensionKit({ provider: manuscriptProvider as any, surfaceType: 'manuscript' }),
        ...(manuscriptProvider && manuscriptYdoc ? [
          Collaboration.configure({
            document: manuscriptYdoc,
          }),
        ] : []),
      ],
      editorProps: {
        attributes: {
          autocomplete: 'off',
          autocorrect: 'off',
          autocapitalize: 'off',
          class: 'min-h-full manuscript-surface',
          'data-surface': 'manuscript',
        },
      },
    },
    [manuscriptYdoc, manuscriptProvider],
  )

  // Framework Editor (conditionally created)
  const frameworkEditor = useEditor(
    enableFrameworkEditor ? {
      immediatelyRender: false,
      autofocus: dualSurface.activeSurface === 'framework',
      onCreate: ({ editor }) => {
        setIsFrameworkLoading(false)
        if (frameworkProvider) {
          frameworkProvider.on('synced', () => {
            if (editor.isEmpty) {
              editor.commands.setContent(emptyFrameworkContent)
            }
          })
        } else {
          // No provider, set content immediately
          if (editor.isEmpty) {
            editor.commands.setContent(emptyFrameworkContent)
          }
        }
      },
      extensions: [
        ...ExtensionKit({ provider: frameworkProvider as any, surfaceType: 'framework' }),
        ...(frameworkProvider && frameworkYdoc ? [
          Collaboration.configure({
            document: frameworkYdoc,
          }),
        ] : []),
      ],
      editorProps: {
        attributes: {
          autocomplete: 'off',
          autocorrect: 'off',
          autocapitalize: 'off',
          class: 'min-h-full framework-surface',
          'data-surface': 'framework',
        },
      },
    } : null,
    enableFrameworkEditor ? [frameworkYdoc, frameworkProvider] : []
  )

  // Active editor based on current surface
  const activeEditor = useMemo(() => {
    return dualSurface.activeSurface === 'manuscript' ? manuscriptEditor : frameworkEditor
  }, [dualSurface.activeSurface, manuscriptEditor, frameworkEditor])

  // Users (simplified for now, could be enhanced for dual collaboration)
  const users = useMemo(() => {
    return []
  }, [manuscriptEditor, frameworkEditor])

  // Character count from active editor
  const characterCount = useMemo(() => {
    const editor = activeEditor
    return editor?.storage.characterCount || { characters: () => 0, words: () => 0 }
  }, [activeEditor])

  // Collaboration state from active editor
  const collabState = useMemo(() => {
    return dualSurface.activeSurface === 'manuscript' 
      ? manuscriptCollabState 
      : frameworkCollabState
  }, [dualSurface.activeSurface, manuscriptCollabState, frameworkCollabState])

  // Chapter navigation from manuscript editor
  const chapterNavigation = useChapterNavigation(manuscriptEditor)

  // Setup collaboration listeners
  useEffect(() => {
    manuscriptProvider?.on('status', (event: { status: WebSocketStatus }) => {
      setManuscriptCollabState(event.status)
    })
  }, [manuscriptProvider])

  useEffect(() => {
    frameworkProvider?.on('status', (event: { status: WebSocketStatus }) => {
      setFrameworkCollabState(event.status)
    })
  }, [frameworkProvider])

  // Sync focus when switching surfaces
  useEffect(() => {
    const targetEditor = dualSurface.activeSurface === 'manuscript' ? manuscriptEditor : frameworkEditor
    if (!targetEditor) return
    // Defer until the editor view is mounted
    const id = setTimeout(() => {
      try {
        if (!targetEditor.isFocused) targetEditor.commands.focus()
      } catch {
        // Swallow focus errors if view not ready yet
      }
    }, 120)
    return () => clearTimeout(id)
  }, [dualSurface.activeSurface, manuscriptEditor, frameworkEditor])

  // Sync content between surfaces
  const syncContentBetweenSurfaces = useCallback(() => {
    if (!manuscriptEditor || !frameworkEditor) return
    
    // This could be enhanced with specific sync logic
    // For now, it's a placeholder for custom sync functionality
    console.log('Syncing content between surfaces...')
  }, [manuscriptEditor, frameworkEditor])

  // Reset surface content
  const resetSurface = useCallback((surface: WritingSurface) => {
    const editor = surface === 'manuscript' ? manuscriptEditor : frameworkEditor
    if (!editor) return
    
    const content = surface === 'manuscript' ? emptyContent : emptyFrameworkContent
    editor.commands.setContent(content)
  }, [manuscriptEditor, frameworkEditor])

  // Initialize AI chat sidebar with editor context
  const rightSidebar = useAIChatSidebar({
    manuscriptEditor,
    frameworkEditor
  })

  // Global editor references for debugging - only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.manuscriptEditor = manuscriptEditor
      window.frameworkEditor = frameworkEditor
      window.activeEditor = activeEditor
    }
  }, [manuscriptEditor, frameworkEditor, activeEditor])

  return {
    // Editors
    manuscriptEditor,
    frameworkEditor,
    activeEditor,
    
    // Surface management
    activeSurface: dualSurface.activeSurface,
    switchToSurface: dualSurface.switchToSurface,
    toggleSurface: dualSurface.toggleSurface,
    
    // Shared states
    users,
    characterCount,
    collabState,
    
    // UI state
    leftSidebar,
    aiChatSidebar: rightSidebar,
    chapterNavigation,
    
    // Loading states
    isManuscriptLoading,
    isFrameworkLoading,
    isLoading: isManuscriptLoading || (enableFrameworkEditor && isFrameworkLoading),
    
    // Actions
    syncContentBetweenSurfaces,
    resetSurface,
  }
}

export default useDualBlockEditors