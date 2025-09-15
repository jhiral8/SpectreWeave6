'use client'

import React from 'react'
import { EditorContent, Editor } from '@tiptap/react'
import FrameworkToolbarVertical from '@/components/ui/FrameworkToolbarVertical'
import { WritingFramework } from '@/types/story-frameworks'

interface FrameworkSurfaceProps {
  editor: Editor | null
  borderClasses?: string
  cssVariables?: React.CSSProperties
  className?: string
  fullWidth?: boolean
  showToolbar?: boolean
  onFrameworkSelect?: (framework: WritingFramework) => void
  onClearFramework?: () => void
  activeFramework?: WritingFramework | null
  toolbarPosition?: 'external' | 'absolute'
}

export const FrameworkSurface = React.memo(({
  editor,
  borderClasses = '',
  cssVariables = {},
  className = '',
  fullWidth = false,
  showToolbar = false,
  onFrameworkSelect,
  onClearFramework,
  activeFramework,
  toolbarPosition = 'external'
}: FrameworkSurfaceProps) => {
  if (!editor) {
    return null
  }

  const containerClass = fullWidth 
    ? `w-full max-w-4xl h-full relative rounded-lg border border-[--border] bg-[--card] text-[--card-foreground] ${borderClasses} flex flex-col ${className}`
    : `basis-[40%] grow min-w-[280px] h-full relative rounded-lg border border-[--border] bg-[--card] text-[--card-foreground] ${borderClasses} flex flex-col ${className}`

  const surfaceContent = (
    <div 
      className={containerClass}
      style={cssVariables}
    >
      {/* Header with protected positioning */}
      <div className="flex-shrink-0 p-4 bg-[--card]">
        <span className="text-base text-[--muted-foreground] tracking-wide surface-label" style={{ fontFamily: 'Surgena, sans-serif' }}>
          Story Framework
        </span>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <EditorContent 
          editor={editor}
          className="h-full overflow-y-auto overflow-x-hidden touch-manipulation p-1 pt-2" 
        />
      </div>
    </div>
  )

  if (!showToolbar) {
    return surfaceContent
  }

  if (toolbarPosition === 'external') {
    return (
      <div className="flex items-stretch">
        {/* Left Vertical Toolbar - positioned outside SF surface */}
        <div className="flex items-center">
          <FrameworkToolbarVertical
            onFrameworkSelect={onFrameworkSelect}
            onClearFramework={onClearFramework}
            activeFramework={activeFramework}
            className="!relative !left-auto !top-auto"
          />
        </div>
        {surfaceContent}
      </div>
    )
  }

  // Absolute positioned toolbar
  return (
    <div className="relative h-full flex justify-center p-4">
      <FrameworkToolbarVertical
        onFrameworkSelect={onFrameworkSelect}
        onClearFramework={onClearFramework}
        activeFramework={activeFramework}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50"
      />
      {surfaceContent}
    </div>
  )
})

FrameworkSurface.displayName = 'FrameworkSurface'

export default FrameworkSurface