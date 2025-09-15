'use client'

import { useEditor, Editor } from '@tiptap/react'
import { Collaboration } from '@tiptap/extension-collaboration'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import type { Doc as YDoc } from 'yjs'
import { MinimalExtensionKit } from '@/extensions/minimal-extension-kit'

interface EditorFactoryConfig {
  ydoc?: YDoc
  provider?: TiptapCollabProvider | null
  surface: 'manuscript' | 'framework'
  autofocus?: boolean
  onCreated?: (editor: Editor) => void
  initialContent?: any
}

/**
 * Factory hook for creating TipTap editors
 * Single Responsibility: Create and configure editor instances
 */
export const useEditorFactory = ({
  ydoc,
  provider,
  surface,
  autofocus = false,
  onCreated,
  initialContent
}: EditorFactoryConfig) => {
  return useEditor({
    immediatelyRender: false,
    autofocus,
    onCreate: ({ editor }) => {
      // Set initial content if no provider
      if (!provider && initialContent && editor.isEmpty) {
        editor.commands.setContent(initialContent)
      }
      
      // Call custom onCreate handler
      onCreated?.(editor)
    },
    extensions: [
      ...MinimalExtensionKit(),
      ...(provider && ydoc ? [
        Collaboration.configure({ document: ydoc })
      ] : [])
    ],
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        class: `min-h-full ${surface}-surface`,
        'data-surface': surface,
      }
    }
  }, [ydoc, provider])
}

export default useEditorFactory