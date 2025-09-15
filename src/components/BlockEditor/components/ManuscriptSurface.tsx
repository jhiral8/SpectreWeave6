'use client'

import React from 'react'
import { EditorContent, PureEditorContent, Editor } from '@tiptap/react'

interface ManuscriptSurfaceProps {
  editor: Editor | null
  editorRef?: React.RefObject<PureEditorContent | null>
  borderClasses?: string
  cssVariables?: React.CSSProperties
  className?: string
  fullWidth?: boolean
}

export const ManuscriptSurface = React.memo(({
  editor,
  editorRef,
  borderClasses = '',
  cssVariables = {},
  className = '',
  fullWidth = false
}: ManuscriptSurfaceProps) => {
  if (!editor) {
    return null
  }

  const containerClass = fullWidth 
    ? `w-full max-w-4xl h-full relative rounded-lg border border-[--border] bg-[--card] text-[--card-foreground] ${borderClasses} flex flex-col ${className}`
    : `basis-[60%] grow min-w-[320px] h-full relative rounded-lg border border-[--border] bg-[--card] text-[--card-foreground] ${borderClasses} flex flex-col ${className}`

  return (
    <div 
      className={containerClass}
      style={{
        ...cssVariables,
        borderStyle: 'solid !important'
      }}
    >
      {/* Header with protected positioning */}
      <div className="flex-shrink-0 p-4 bg-[--card]">
        <span className="text-base text-[--muted-foreground] tracking-wide surface-label" style={{ fontFamily: 'Surgena, sans-serif' }}>
          Manuscript
        </span>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <EditorContent 
          editor={editor}
          ref={editorRef}
          className="h-full overflow-y-auto overflow-x-hidden touch-manipulation p-1 pt-2" 
        />
      </div>
    </div>
  )
})

ManuscriptSurface.displayName = 'ManuscriptSurface'

export default ManuscriptSurface