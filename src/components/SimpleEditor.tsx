'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/extension-starter-kit'

export default function SimpleEditor() {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        history: false,
      }),
    ],
    content: '<p>Hello World! This is a simple editor.</p>',
  })

  if (!editor) {
    return <div>Loading...</div>
  }

  return (
    <div className="h-screen p-4">
      <div className="border border-gray-300 rounded-lg">
        <div className="p-2 border-b bg-gray-50">
          <h2>Simple Editor Test</h2>
        </div>
        <EditorContent 
          editor={editor} 
          className="p-4 min-h-[400px] prose prose-sm max-w-none"
        />
      </div>
    </div>
  )
}