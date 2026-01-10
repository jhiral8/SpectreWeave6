'use client'

import React from 'react'
import { EditorContent, PureEditorContent, Editor } from '@tiptap/react'

interface ManuscriptSurfaceProps {
  editor: Editor | null
  editorRef?: React.RefObject<any>
  borderClasses?: string
  cssVariables?: React.CSSProperties
  className?: string
  fullWidth?: boolean
  /** When true, manuscript expands to fill available space with no max-width constraint */
  expandToFill?: boolean
  headerActions?: React.ReactNode
}

export const ManuscriptSurface = React.memo(({
  editor,
  editorRef,
  borderClasses = '',
  cssVariables = {},
  className = '',
  fullWidth = false,
  expandToFill = false,
  headerActions
}: ManuscriptSurfaceProps) => {
  if (!editor) {
    return null
  }

  // Base classes
  const baseClasses = `h-full relative rounded-lg border border-[--border] bg-[--card] text-[--card-foreground] ${borderClasses} flex flex-col ${className}`
  
  // Determine container class based on mode
  let containerClass: string
  if (expandToFill) {
    // No max-width constraint - fills all available space
    containerClass = `w-full ${baseClasses}`
  } else if (fullWidth) {
    // Wide but still constrained for readability
    containerClass = `w-full max-w-5xl ${baseClasses}`
  } else {
    // Default split mode
    containerClass = `basis-[60%] grow min-w-[320px] ${baseClasses}`
  }

  return (
    <div 
      className={containerClass}
      style={{
        ...cssVariables,
        borderStyle: 'solid !important'
      }}
    >
      {/* Header with protected positioning */}
      <div className="flex-shrink-0 px-4 py-2 bg-[--card] border-b border-[--border]/50 flex items-center justify-between">
        <span className="text-xs font-medium text-[--muted-foreground] uppercase tracking-wider surface-label" style={{ fontFamily: 'Surgena, sans-serif' }}>
          Manuscript
        </span>
        {headerActions && (
          <div className="flex items-center gap-2">
            {headerActions}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden">
        <EditorContent 
          editor={editor}
          ref={editorRef}
          className="h-full overflow-y-auto overflow-x-hidden touch-manipulation px-4 py-2" 
        />
      </div>
    </div>
  )
})

ManuscriptSurface.displayName = 'ManuscriptSurface'

export default ManuscriptSurface