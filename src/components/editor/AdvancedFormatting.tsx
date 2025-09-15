'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'
import { Toolbar } from '@/components/ui/Toolbar'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

interface AdvancedFormattingProps {
  editor: Editor
  className?: string
}

interface ColorOption {
  name: string
  value: string
  class?: string
}

const TEXT_COLORS: ColorOption[] = [
  { name: 'Default', value: '#000000' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Gray', value: '#6B7280' }
]

const HIGHLIGHT_COLORS: ColorOption[] = [
  { name: 'None', value: 'transparent' },
  { name: 'Yellow', value: '#FEF08A' },
  { name: 'Green', value: '#BBF7D0' },
  { name: 'Blue', value: '#BFDBFE' },
  { name: 'Purple', value: '#DDD6FE' },
  { name: 'Pink', value: '#FBCFE8' },
  { name: 'Red', value: '#FECACA' },
  { name: 'Orange', value: '#FED7AA' }
]

const FONT_FAMILIES = [
  { name: 'Default', value: 'Inter' },
  { name: 'Sans Serif', value: 'ui-sans-serif' },
  { name: 'Serif', value: 'ui-serif' },
  { name: 'Monospace', value: 'ui-monospace' },
  { name: 'Cursive', value: 'cursive' }
]

const FONT_SIZES = [
  { name: 'Small', value: '12px' },
  { name: 'Normal', value: '16px' },
  { name: 'Medium', value: '18px' },
  { name: 'Large', value: '24px' },
  { name: 'X-Large', value: '32px' },
  { name: 'XX-Large', value: '48px' }
]

export const AdvancedFormatting: React.FC<AdvancedFormattingProps> = React.memo(({
  editor,
  className
}) => {
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isCondensed, setIsCondensed] = useState(false)

  // Detect mobile viewport and condensed mode
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // Tailwind sm breakpoint
      setIsCondensed(window.innerWidth < 896) // Condensed earlier to prevent logo overlap (between md and lg)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const togglePanel = useCallback((panel: string) => {
    setActivePanel(activePanel === panel ? null : panel)
  }, [activePanel])

  // Keyboard shortcuts for formatting
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + C for text color
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault()
        togglePanel('text-color')
      }
      
      // Ctrl/Cmd + Shift + H for highlight
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'H') {
        event.preventDefault()
        togglePanel('highlight')
      }
      
      // Escape to close panels
      if (event.key === 'Escape' && activePanel) {
        setActivePanel(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [togglePanel, activePanel])

  const applyTextColor = useCallback((color: string) => {
    editor.chain().focus().setColor(color).run()
    setActivePanel(null)
  }, [editor])

  const applyHighlight = useCallback((color: string) => {
    if (color === 'transparent') {
      editor.chain().focus().unsetHighlight().run()
    } else {
      editor.chain().focus().setHighlight({ color }).run()
    }
    setActivePanel(null)
  }, [editor])

  const applyFontFamily = useCallback((fontFamily: string) => {
    editor.chain().focus().setFontFamily(fontFamily).run()
    setActivePanel(null)
  }, [editor])

  const applyFontSize = useCallback((fontSize: string) => {
    editor.chain().focus().setFontSize(fontSize).run()
    setActivePanel(null)
  }, [editor])

  const insertSpecialContent = useCallback((type: string) => {
    switch (type) {
      case 'horizontal-rule':
        editor.chain().focus().setHorizontalRule().run()
        break
      case 'page-break':
        editor.chain().focus().insertContent('<div style="page-break-before: always;"></div>').run()
        break
      case 'table':
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        break
      case 'columns':
        editor.chain().focus().setColumns(2).run()
        break
      case 'quote':
        editor.chain().focus().setBlockquote().run()
        break
      case 'code-block':
        editor.chain().focus().setCodeBlock().run()
        break
      default:
        break
    }
    setActivePanel(null)
  }, [editor])

  const getCurrentTextColor = useCallback(() => {
    return editor.getAttributes('textStyle').color || '#000000'
  }, [editor])

  const getCurrentHighlightColor = useCallback(() => {
    const highlight = editor.getAttributes('highlight')
    return highlight.color || 'transparent'
  }, [editor])

  return (
    <ErrorBoundary
      fallback={
        <div className="text-xs text-red-600 dark:text-red-400 p-2">
          Formatting tools temporarily unavailable
        </div>
      }
    >
      <div className={cn('relative flex items-center gap-1', className)}>
        {isCondensed ? (
          // Ultra-condensed mode for smaller screens
          <div className="relative">
            <Toolbar.Button
              onClick={() => togglePanel('formatting')}
              active={activePanel === 'formatting'}
              className="relative"
            >
              <Icon name="Type" />
              <Icon name="ChevronDown" className="w-2 h-2 absolute -bottom-0.5 -right-0.5 opacity-60" />
            </Toolbar.Button>

            {activePanel === 'formatting' && (
              <Surface className="absolute top-full left-0 mt-1 p-3 z-50 shadow-lg w-56 max-w-[calc(100vw-2rem)]">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {/* Text Color Section */}
                  <div>
                    <h4 className="text-xs font-medium mb-2">Text Color</h4>
                    <div className="grid grid-cols-6 gap-1">
                      {TEXT_COLORS.slice(0, 6).map((color) => (
                        <button
                          key={color.value}
                          onClick={() => applyTextColor(color.value)}
                          className="w-6 h-6 rounded border border-neutral-200 dark:border-neutral-700 hover:scale-110 transition-all duration-150"
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Alignment Section */}
                  <div>
                    <h4 className="text-xs font-medium mb-2">Alignment</h4>
                    <div className="grid grid-cols-4 gap-1">
                      <button
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={cn(
                          "p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
                          editor.isActive({ textAlign: 'left' }) && "bg-neutral-100 dark:bg-neutral-800"
                        )}
                      >
                        <Icon name="AlignLeft" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={cn(
                          "p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
                          editor.isActive({ textAlign: 'center' }) && "bg-neutral-100 dark:bg-neutral-800"
                        )}
                      >
                        <Icon name="AlignCenter" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        className={cn(
                          "p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
                          editor.isActive({ textAlign: 'right' }) && "bg-neutral-100 dark:bg-neutral-800"
                        )}
                      >
                        <Icon name="AlignRight" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                        className={cn(
                          "p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
                          editor.isActive({ textAlign: 'justify' }) && "bg-neutral-100 dark:bg-neutral-800"
                        )}
                      >
                        <Icon name="AlignJustify" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Highlight Colors */}
                  <div>
                    <h4 className="text-xs font-medium mb-2">Highlight</h4>
                    <div className="grid grid-cols-4 gap-1">
                      {HIGHLIGHT_COLORS.slice(0, 4).map((color) => (
                        <button
                          key={color.value}
                          onClick={() => applyHighlight(color.value)}
                          className="w-6 h-6 rounded border border-neutral-200 dark:border-neutral-700 hover:scale-110 transition-all duration-150"
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h4 className="text-xs font-medium mb-2">Quick Insert</h4>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => insertSpecialContent('table')}
                        className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex flex-col items-center justify-center gap-1"
                      >
                        <Icon name="Table" className="w-4 h-4" />
                        <span className="text-xs">Table</span>
                      </button>
                      <button
                        onClick={() => insertSpecialContent('quote')}
                        className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex flex-col items-center justify-center gap-1"
                      >
                        <Icon name="Quote" className="w-4 h-4" />
                        <span className="text-xs">Quote</span>
                      </button>
                      <button
                        onClick={() => insertSpecialContent('horizontal-rule')}
                        className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex flex-col items-center justify-center gap-1"
                      >
                        <Icon name="Minus" className="w-4 h-4" />
                        <span className="text-xs">Rule</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Surface>
            )}
          </div>
        ) : (
          // Full toolbar for larger screens
          <>
            {/* Text Color */}
            <div className="relative">
              <Toolbar.Button
                onClick={() => togglePanel('text-color')}
                active={activePanel === 'text-color'}
                className="relative"
              >
                <Icon name="Type" />
                <div 
                  className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-0.5 rounded"
                  style={{ backgroundColor: getCurrentTextColor() }}
                />
              </Toolbar.Button>

              {activePanel === 'text-color' && (
                <Surface className={cn(
                  "absolute top-full left-0 mt-1 p-3 z-50 shadow-lg transition-all duration-200 ease-out",
                  isMobile ? "w-64 max-w-[calc(100vw-2rem)]" : "w-48"
                )}>
                  <div>
                    <h4 className="text-xs font-medium mb-2">Text Color</h4>
                    <div className={cn(
                      "grid gap-2",
                      isMobile ? "grid-cols-4" : "grid-cols-3"
                    )}>
                      {TEXT_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => applyTextColor(color.value)}
                          className="w-8 h-8 rounded border-2 border-neutral-200 dark:border-neutral-700 hover:scale-110 transition-all duration-150 active:scale-95"
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </Surface>
              )}
            </div>

            {/* Highlight Color */}
            <div className="relative">
              <Toolbar.Button
                onClick={() => togglePanel('highlight')}
                active={activePanel === 'highlight'}
                className="relative"
              >
                <Icon name="Highlighter" />
                <div 
                  className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-0.5 rounded"
                  style={{ backgroundColor: getCurrentHighlightColor() }}
                />
              </Toolbar.Button>

              {activePanel === 'highlight' && (
                <Surface className={cn(
                  "absolute top-full left-0 mt-1 p-3 z-50 shadow-lg transition-all duration-200 ease-out",
                  isMobile ? "w-64 max-w-[calc(100vw-2rem)]" : "w-48"
                )}>
                  <div>
                    <h4 className="text-xs font-medium mb-2">Highlight</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {HIGHLIGHT_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => applyHighlight(color.value)}
                          className="w-8 h-8 rounded border-2 border-neutral-200 dark:border-neutral-700 hover:scale-110 transition-all duration-150 active:scale-95"
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </Surface>
              )}
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1" />

            {/* Text Alignment - Full buttons for larger screens */}
            <Toolbar.Button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              active={editor.isActive({ textAlign: 'left' })}
            >
              <Icon name="AlignLeft" />
            </Toolbar.Button>

            <Toolbar.Button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              active={editor.isActive({ textAlign: 'center' })}
            >
              <Icon name="AlignCenter" />
            </Toolbar.Button>

            <Toolbar.Button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              active={editor.isActive({ textAlign: 'right' })}
            >
              <Icon name="AlignRight" />
            </Toolbar.Button>

            <Toolbar.Button
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              active={editor.isActive({ textAlign: 'justify' })}
            >
              <Icon name="AlignJustify" />
            </Toolbar.Button>

            {/* Separator */}
            <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1" />

            {/* Special Content */}
            <div className="relative">
              <Toolbar.Button
                onClick={() => togglePanel('insert')}
                active={activePanel === 'insert'}
              >
                <Icon name="Plus" />
              </Toolbar.Button>

              {activePanel === 'insert' && (
                <Surface className={cn(
                  "absolute top-full left-0 mt-1 p-3 z-50 shadow-lg transition-all duration-200 ease-out",
                  isMobile ? "w-56 max-w-[calc(100vw-2rem)]" : "w-48"
                )}>
                  <div>
                    <h4 className="text-xs font-medium mb-2">Insert</h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      <button
                        onClick={() => insertSpecialContent('horizontal-rule')}
                        className="w-full text-left px-2 py-1 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150 active:bg-neutral-200 dark:active:bg-neutral-700 flex items-center gap-2"
                      >
                        <Icon name="Minus" className="w-3 h-3" />
                        Horizontal Rule
                      </button>
                      <button
                        onClick={() => insertSpecialContent('table')}
                        className="w-full text-left px-2 py-1 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150 active:bg-neutral-200 dark:active:bg-neutral-700 flex items-center gap-2"
                      >
                        <Icon name="Table" className="w-3 h-3" />
                        Table
                      </button>
                      <button
                        onClick={() => insertSpecialContent('quote')}
                        className="w-full text-left px-2 py-1 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150 active:bg-neutral-200 dark:active:bg-neutral-700 flex items-center gap-2"
                      >
                        <Icon name="Quote" className="w-3 h-3" />
                        Quote Block
                      </button>
                      <button
                        onClick={() => insertSpecialContent('code-block')}
                        className="w-full text-left px-2 py-1 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150 active:bg-neutral-200 dark:active:bg-neutral-700 flex items-center gap-2"
                      >
                        <Icon name="Code" className="w-3 h-3" />
                        Code Block
                      </button>
                    </div>
                  </div>
                </Surface>
              )}
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  )
})

// Display name for debugging
AdvancedFormatting.displayName = 'AdvancedFormatting'

export default AdvancedFormatting