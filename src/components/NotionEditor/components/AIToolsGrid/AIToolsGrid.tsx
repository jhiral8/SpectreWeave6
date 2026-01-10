"use client"

import * as React from 'react'
import { Editor } from '@tiptap/react'
import { cn } from '@/lib/utils'
import { useTextSelection } from './hooks/useTextSelection'
import { AIToolButton } from './components/AIToolButton'
import { calculateSmartPosition, constrainToViewport } from './utils/positioning'
import {
  Sparkles,
  RotateCcw,
  FileText,
  Globe,
  Lightbulb,
  Plus,
  X,
  Loader2
} from 'lucide-react'
import './AIToolsGrid.css'

export interface AITool {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  action: (selectedText: string, editor: Editor) => Promise<void>
}

interface AIToolsGridProps {
  editor: Editor
  onClose?: () => void
  className?: string
}

export default function AIToolsGrid({ editor, onClose, className }: AIToolsGridProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [selectedText, setSelectedText] = React.useState('')
  const [loadingTool, setLoadingTool] = React.useState<string | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const toolbarRef = React.useRef<HTMLDivElement>(null)

  // Use the text selection hook
  const { hasSelection, selectionBounds } = useTextSelection(editor)

  // Define AI tools
  const aiTools: AITool[] = [
    {
      id: 'improve',
      name: 'Improve Writing',
      description: 'Enhance grammar, clarity, and tone',
      icon: Sparkles,
      shortcut: '⌘I',
      action: async (text: string, editor: Editor) => {
        // Placeholder for AI improvement
        console.log('Improving:', text)
        await new Promise(resolve => setTimeout(resolve, 2000))
        // Replace with improved text
        editor.chain().focus().insertContent(` [IMPROVED: ${text}]`).run()
      }
    },
    {
      id: 'rewrite',
      name: 'Rewrite',
      description: 'Generate alternative versions',
      icon: RotateCcw,
      shortcut: '⌘R',
      action: async (text: string, editor: Editor) => {
        console.log('Rewriting:', text)
        await new Promise(resolve => setTimeout(resolve, 2000))
        editor.chain().focus().insertContent(` [REWRITTEN: ${text}]`).run()
      }
    },
    {
      id: 'summarize',
      name: 'Summarize',
      description: 'Create a concise summary',
      icon: FileText,
      shortcut: '⌘S',
      action: async (text: string, editor: Editor) => {
        console.log('Summarizing:', text)
        await new Promise(resolve => setTimeout(resolve, 2000))
        editor.chain().focus().insertContent(` [SUMMARY: ${text.slice(0, 20)}...]`).run()
      }
    },
    {
      id: 'translate',
      name: 'Translate',
      description: 'Translate to another language',
      icon: Globe,
      shortcut: '⌘T',
      action: async (text: string, editor: Editor) => {
        console.log('Translating:', text)
        await new Promise(resolve => setTimeout(resolve, 2000))
        editor.chain().focus().insertContent(` [TRANSLATED: ${text}]`).run()
      }
    },
    {
      id: 'explain',
      name: 'Explain',
      description: 'Clarify complex concepts',
      icon: Lightbulb,
      shortcut: '⌘E',
      action: async (text: string, editor: Editor) => {
        console.log('Explaining:', text)
        await new Promise(resolve => setTimeout(resolve, 2000))
        editor.chain().focus().insertContent(` [EXPLANATION: ${text}]`).run()
      }
    },
    {
      id: 'continue',
      name: 'Continue',
      description: 'Extend the content',
      icon: Plus,
      shortcut: '⌘⏎',
      action: async (text: string, editor: Editor) => {
        console.log('Continuing:', text)
        await new Promise(resolve => setTimeout(resolve, 2000))
        editor.chain().focus().insertContent(` [CONTINUED: ${text}...]`).run()
      }
    }
  ]

  // Update position when selection changes
  React.useEffect(() => {
    if (hasSelection && selectionBounds) {
      // Toolbar dimensions
      const toolbarWidth = 320
      const toolbarHeight = 140

      // Calculate optimal position using smart positioning
      const optimalPosition = calculateSmartPosition({
        selectionBounds,
        toolbarWidth,
        toolbarHeight,
        offset: 12,
      })

      // Constrain to viewport bounds
      const constrainedPosition = constrainToViewport(
        optimalPosition,
        toolbarWidth,
        toolbarHeight,
        10
      )

      setPosition(constrainedPosition)

      // Get selected text
      const { from, to } = editor.state.selection
      const text = editor.state.doc.textBetween(from, to)
      setSelectedText(text)

      setIsVisible(true)
    } else {
      setIsVisible(false)
      setSelectedText('')
    }
  }, [hasSelection, selectionBounds, editor])

  // Handle tool action
  const handleToolAction = async (tool: AITool) => {
    if (!selectedText || isProcessing) return

    setLoadingTool(tool.id)
    setIsProcessing(true)

    try {
      await tool.action(selectedText, editor)
    } catch (error) {
      console.error('Error executing AI tool:', error)
    } finally {
      setLoadingTool(null)
      setIsProcessing(false)
      handleClose()
    }
  }

  // Handle close
  const handleClose = () => {
    setIsVisible(false)
    setSelectedText('')
    setLoadingTool(null)
    setIsProcessing(false)
    onClose?.()
  }

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  // Handle click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node) && isVisible) {
        handleClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isVisible])

  if (!isVisible || !selectedText) return null

  return (
    <div
      ref={toolbarRef}
      className={cn(
        "ai-tools-grid",
        "fixed z-50 bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-lg p-3",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        isProcessing && "pointer-events-none opacity-75",
        className
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">AI Tools</span>
        </div>
        <button
          onClick={handleClose}
          className="h-6 w-6 rounded-sm hover:bg-accent flex items-center justify-center transition-colors"
          disabled={isProcessing}
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Selected text preview */}
      <div className="mb-3 p-2 bg-muted/50 rounded-md border">
        <div className="text-xs text-muted-foreground mb-1">Selected text:</div>
        <div className="text-sm text-foreground line-clamp-2">
          {selectedText.length > 60 ? `${selectedText.slice(0, 60)}...` : selectedText}
        </div>
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-3 gap-2">
        {aiTools.map((tool) => (
          <AIToolButton
            key={tool.id}
            tool={tool}
            onClick={() => handleToolAction(tool)}
            disabled={isProcessing}
            isLoading={loadingTool === tool.id}
          />
        ))}
      </div>

      {/* Loading overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </div>
        </div>
      )}
    </div>
  )
}