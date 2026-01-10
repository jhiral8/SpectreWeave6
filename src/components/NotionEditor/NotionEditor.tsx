"use client"

import * as React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { Doc as YDoc } from 'yjs'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import type { User } from '@supabase/supabase-js'

// Import CSS
import './NotionEditor.css'

// Import TipTap extensions
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import Focus from '@tiptap/extension-focus'
import CharacterCount from '@tiptap/extension-character-count'
import Dropcursor from '@tiptap/extension-dropcursor'
import Gapcursor from '@tiptap/extension-gapcursor'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Image from '@tiptap/extension-image'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'

// Import NotionEditor components
import NotionToolbar from './components/NotionToolbar'
import BlockMenu from './components/BlockMenu'
import NotionSidebar from './components/NotionSidebar'
import { AIToolsGrid } from './components/AIToolsGrid'
import AIToolsPalette from './components/AIToolsPalette'

// Types
interface NotionEditorProps {
  ydoc: YDoc
  provider: TiptapCollabProvider | null
  user: User | null
  docId: string
}

// Main NotionEditor component
export default function NotionEditor({
  ydoc,
  provider,
  user,
  docId
}: NotionEditorProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [aiPaletteOpen, setAiPaletteOpen] = React.useState(true)
  const [currentBlock, setCurrentBlock] = React.useState<string>('')

  // Initialize TipTap editor with Notion-style extensions
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Disable default blockquote, codeBlock, heading, horizontalRule
        // We'll create custom implementations for these
        blockquote: false,
        codeBlock: false,
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'notion-task-list',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          class: 'notion-task-item',
        },
        nested: true,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`
          }
          if (node.type.name === 'taskItem') {
            return 'To-do'
          }
          return "Type '/' for commands"
        },
        includeChildren: true,
      }),
      Focus.configure({
        className: 'notion-focus',
        mode: 'all',
      }),
      CharacterCount,
      Dropcursor.configure({
        color: '#ddd',
        width: 2,
      }),
      Gapcursor,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'notion-table',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({
        HTMLAttributes: {
          class: 'notion-image',
        },
        inline: false,
        allowBase64: true,
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: 'notion-highlight',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
      Typography,
      Underline,
      Color,
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
    ],
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Untitled' }],
        },
        {
          type: 'paragraph',
          content: [],
        },
      ],
    },
    editorProps: {
      attributes: {
        class: 'notion-editor-content',
        spellcheck: 'false',
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          // Handle slash commands
          if (event.key === '/') {
            const { selection } = view.state
            const { $from } = selection
            const parent = $from.parent

            // Only show menu for empty paragraphs
            if (parent.type.name === 'paragraph' && parent.content.size === 0) {
              setTimeout(() => {
                setCurrentBlock('/')
              }, 10)
            }
          }
          return false
        },
      },
    },
    onUpdate: ({ editor }) => {
      // Expose editor globally for autosave functionality
      ;(window as any).notionEditor = editor
    },
  })

  // Expose editor to window for autosave
  React.useEffect(() => {
    if (editor) {
      ;(window as any).notionEditor = editor
    }
    return () => {
      ;(window as any).notionEditor = null
    }
  }, [editor])

  if (!editor) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  return (
    <div
      className={`notion-editor w-full h-full flex relative ${sidebarOpen ? 'has-left-sidebar' : ''}`}
    >
      {/* Sidebar */}
      {sidebarOpen && (
        <NotionSidebar
          editor={editor}
          onClose={() => setSidebarOpen(false)}
          docId={docId}
        />
      )}

      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <NotionToolbar
          editor={editor}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          onToggleAiSidebar={() => setAiPaletteOpen(!aiPaletteOpen)}
          aiSidebarOpen={aiPaletteOpen}
        />

        {/* Editor content */}
        <div className="flex-1 overflow-auto relative">
          {/* AI Tools Palette - positioned within editor content area */}
          <AIToolsPalette
            editor={editor}
            isVisible={aiPaletteOpen}
            onClose={() => setAiPaletteOpen(false)}
          />

          <div className="max-w-4xl mx-auto px-6 py-8 min-w-0">
            <EditorContent
              editor={editor}
              className="notion-editor-wrapper w-full min-w-0"
            />

            {/* Block menu for slash commands */}
            {currentBlock === '/' && (
              <BlockMenu
                editor={editor}
                onClose={() => setCurrentBlock('')}
              />
            )}

            {/* AI Tools Grid - appears on text selection */}
            <AIToolsGrid editor={editor} />
          </div>
        </div>

        {/* Status bar */}
        <div className="border-t bg-muted/30 px-6 py-2 text-xs text-muted-foreground">
          {editor.storage.characterCount.characters()} characters, {editor.storage.characterCount.words()} words
        </div>
      </div>
    </div>
  )
}