'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

function InlineEditor() {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        history: false,
      }),
    ],
    content: '<h1>Inline StarterKit Test</h1><p>This has <strong>bold</strong>, <em>italic</em>, and all StarterKit features!</p><ul><li>Bullet lists</li><li>With all features</li></ul>',
  })

  if (!editor) {
    return <div className="p-4">Editor initializing...</div>
  }

  return (
    <div className="h-screen p-4">
      <div className="border border-gray-300 rounded-lg">
        <div className="p-2 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-sm font-semibold">Inline StarterKit Editor</h2>
          <div className="flex gap-2">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className="px-2 py-1 text-xs bg-blue-100 rounded">Bold</button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className="px-2 py-1 text-xs bg-blue-100 rounded">Italic</button>
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className="px-2 py-1 text-xs bg-blue-100 rounded">List</button>
          </div>
        </div>
        <EditorContent 
          editor={editor} 
          className="p-4 min-h-[400px] prose prose-sm max-w-none"
        />
      </div>
    </div>
  )
}

export default function TestEditorComponent() {
  return <InlineEditor />
}