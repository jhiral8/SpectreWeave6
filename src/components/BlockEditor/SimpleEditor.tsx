'use client'

import React from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'

interface SimpleEditorProps {
  content?: string
}

export const SimpleEditor: React.FC<SimpleEditorProps> = ({ content = '' }) => {
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        history: true,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'min-h-full p-4 border rounded focus:outline-none',
      },
    },
  }, [])

  if (!isClient) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (!editor) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="h-full">
      <EditorContent editor={editor} className="h-full" />
    </div>
  )
}

export default SimpleEditor