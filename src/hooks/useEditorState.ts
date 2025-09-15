'use client'

import { useState, useEffect, useMemo } from 'react'
import { Editor } from '@tiptap/react'
import { TiptapCollabProvider, WebSocketStatus } from '@hocuspocus/provider'

interface EditorStateConfig {
  manuscriptEditor: Editor | null
  frameworkEditor: Editor | null
  manuscriptProvider?: TiptapCollabProvider | null
  frameworkProvider?: TiptapCollabProvider | null
  activeSurface: 'manuscript' | 'framework'
  enableFrameworkEditor: boolean
}

/**
 * Hook for managing editor state and collaboration
 * Single Responsibility: Track editor states, loading, and collaboration status
 */
export const useEditorState = ({
  manuscriptEditor,
  frameworkEditor,
  manuscriptProvider,
  frameworkProvider,
  activeSurface,
  enableFrameworkEditor
}: EditorStateConfig) => {
  const [manuscriptCollabState, setManuscriptCollabState] = useState<WebSocketStatus>(WebSocketStatus.Connecting)
  const [frameworkCollabState, setFrameworkCollabState] = useState<WebSocketStatus>(WebSocketStatus.Connecting)
  const [isManuscriptLoading, setIsManuscriptLoading] = useState(true)
  const [isFrameworkLoading, setIsFrameworkLoading] = useState(enableFrameworkEditor)

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

  // Track loading states
  useEffect(() => {
    if (manuscriptEditor) {
      setIsManuscriptLoading(false)
    }
  }, [manuscriptEditor])

  useEffect(() => {
    if (frameworkEditor || !enableFrameworkEditor) {
      setIsFrameworkLoading(false)
    }
  }, [frameworkEditor, enableFrameworkEditor])

  // Active editor based on surface
  const activeEditor = useMemo(() => {
    return activeSurface === 'manuscript' ? manuscriptEditor : frameworkEditor
  }, [activeSurface, manuscriptEditor, frameworkEditor])

  // Character count from active editor
  const characterCount = useMemo(() => {
    return activeEditor?.storage.characterCount || { 
      characters: () => 0, 
      words: () => 0 
    }
  }, [activeEditor])

  // Collaboration state from active surface
  const collabState = useMemo(() => {
    return activeSurface === 'manuscript' 
      ? manuscriptCollabState 
      : frameworkCollabState
  }, [activeSurface, manuscriptCollabState, frameworkCollabState])

  return {
    activeEditor,
    characterCount,
    collabState,
    isManuscriptLoading,
    isFrameworkLoading,
    isLoading: isManuscriptLoading || (enableFrameworkEditor && isFrameworkLoading)
  }
}

export default useEditorState