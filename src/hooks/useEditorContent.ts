'use client'

import { useCallback, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import { emptyContent, emptyFrameworkContent } from '@/lib/data/emptyContent'

// Default framework content
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
    }
  ]
})

interface EditorContentConfig {
  manuscriptEditor: Editor | null
  frameworkEditor: Editor | null
  manuscriptProvider?: TiptapCollabProvider | null
  frameworkProvider?: TiptapCollabProvider | null
}

/**
 * Hook for managing editor content
 * Single Responsibility: Handle content initialization and synchronization
 */
export const useEditorContent = ({
  manuscriptEditor,
  frameworkEditor,
  manuscriptProvider,
  frameworkProvider
}: EditorContentConfig) => {
  // Initialize manuscript content
  useEffect(() => {
    if (!manuscriptEditor) return

    if (manuscriptProvider) {
      const handleSynced = () => {
        if (manuscriptEditor.isEmpty) {
          manuscriptEditor.commands.setContent(emptyContent)
        }
      }
      manuscriptProvider.on('synced', handleSynced)
      return () => manuscriptProvider.off('synced', handleSynced)
    } else if (manuscriptEditor.isEmpty) {
      manuscriptEditor.commands.setContent(emptyContent)
    }
  }, [manuscriptEditor, manuscriptProvider])

  // Initialize framework content
  useEffect(() => {
    if (!frameworkEditor) return

    if (frameworkProvider) {
      const handleSynced = () => {
        if (frameworkEditor.isEmpty) {
          frameworkEditor.commands.setContent(emptyFrameworkContent)
        }
      }
      frameworkProvider.on('synced', handleSynced)
      return () => frameworkProvider.off('synced', handleSynced)
    } else if (frameworkEditor.isEmpty) {
      frameworkEditor.commands.setContent(emptyFrameworkContent)
    }
  }, [frameworkEditor, frameworkProvider])

  // Sync content between surfaces
  const syncContentBetweenSurfaces = useCallback(() => {
    if (!manuscriptEditor || !frameworkEditor) return
    console.log('Syncing content between surfaces...')
    // Custom sync logic can be added here
  }, [manuscriptEditor, frameworkEditor])

  // Reset surface content
  const resetSurface = useCallback((surface: 'manuscript' | 'framework') => {
    const editor = surface === 'manuscript' ? manuscriptEditor : frameworkEditor
    if (!editor) return
    
    const content = surface === 'manuscript' ? emptyContent : emptyFrameworkContent
    editor.commands.setContent(content)
  }, [manuscriptEditor, frameworkEditor])

  return {
    syncContentBetweenSurfaces,
    resetSurface
  }
}

export default useEditorContent