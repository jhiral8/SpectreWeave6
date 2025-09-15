'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { ExtensionKit } from '@/extensions/extension-kit'

export default function SimpleDebugEditor() {
  const editor = useEditor({
    immediatelyRender: false,
    content: '<h1>Test Editor</h1><p>This is a simple test to verify editor initialization.</p>',
    extensions: ExtensionKit({}),
  })

  if (!editor) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-600">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Debug Editor</h1>
      <div className="border rounded-lg p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}