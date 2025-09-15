import { useEffect, useMemo, useState } from 'react'

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
// Remove default initial content to avoid pre-populating new projects

declare global {
  interface Window {
    editor: Editor | null
  }
}

export const useBlockEditor = ({
  ydoc,
  provider,
}: {
  ydoc: YDoc
  provider?: TiptapCollabProvider | null | undefined
}) => {
  const leftSidebar = useSidebar()
  const [collabState, setCollabState] = useState<WebSocketStatus>(WebSocketStatus.Connecting)

  const extensions = useMemo(() => [
    ...ExtensionKit({
      provider,
      surfaceType: 'manuscript',
    }),
    // Only add Collaboration extension if provider is available
    ...(provider ? [
      Collaboration.configure({
        document: ydoc,
      }),
      // CollaborationCursor.configure({
      //   provider,
      //   user: {
      //     name: randomElement(userNames),
      //     color: randomElement(userColors),
      //   },
      // }),
    ] : []),
  ], [provider, ydoc])

  const editor = useEditor(
    {
      immediatelyRender: false,
      autofocus: true,
      onCreate: ({ editor }) => {
        console.log('🏗️ Single editor created with extensions:', extensions.length)
        // Do not set any default content; leave new editors empty
        provider?.on('synced', () => {
          // Intentionally no-op: keep empty on first load
        })
      },
      extensions,
      editorProps: {
        attributes: {
          autocomplete: 'off',
          autocorrect: 'off',
          autocapitalize: 'off',
          class: 'min-h-full',
          'data-surface': 'manuscript',
        },
      },
    },
    [ydoc, provider],
  )

  const users = useMemo(() => {
    // For now, return empty array since CollaborationCursor is disabled
    // In TipTap v3, collaboration cursors might be handled differently
    return []
  }, [editor])

  const characterCount = editor?.storage.characterCount || { characters: () => 0, words: () => 0 }
  const chapterNavigation = useChapterNavigation(editor)

  useEffect(() => {
    if (!provider) return

    const handleStatusChange = (event: { status: WebSocketStatus }) => {
      setCollabState(event.status)
    }

    provider.on('status', handleStatusChange)
    
    return () => {
      provider.off('status', handleStatusChange)
    }
  }, [provider])

  // Initialize AI chat sidebar with editor context
  const rightSidebar = useAIChatSidebar({
    manuscriptEditor: editor
  })

  window.editor = editor

  return { editor, users, characterCount, collabState, leftSidebar, aiChatSidebar: rightSidebar, chapterNavigation }
}
