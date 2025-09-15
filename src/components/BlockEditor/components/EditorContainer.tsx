'use client'

import React from 'react'
import { Editor } from '@tiptap/react'
import { User } from '@supabase/supabase-js'

interface EditorContainerProps {
  menuContainerRef: React.RefObject<HTMLDivElement>
  children: React.ReactNode
}

/**
 * EditorContainer Component
 * Single Responsibility: Provide the main container structure for the editor
 */
export const EditorContainer: React.FC<EditorContainerProps> = ({
  menuContainerRef,
  children
}) => {
  return (
    <div 
      className="editor-main-container h-[calc(100vh-56px)] flex flex-col bg-[--background] text-[--foreground]" 
      ref={menuContainerRef}
    >
      {children}
    </div>
  )
}

EditorContainer.displayName = 'EditorContainer'

export default EditorContainer