"use client"

import * as React from 'react'
import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/Button'
import {
  Sparkles,
  RotateCcw,
  FileText,
  Globe,
  Lightbulb,
  PlusCircle,
  Wand2,
  MessageSquare,
  CheckCircle,
  RefreshCw,
  Minimize2,
  Maximize2,
  X,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/radix-tooltip'

interface AIToolsPaletteProps {
  editor: Editor
  isVisible: boolean
  onClose: () => void
}

interface AITool {
  id: string
  icon: React.ReactNode
  label: string
  description: string
  action: (editor: Editor, selectedText: string) => void
  color: string
}

const STORAGE_COLLAPSED_KEY = 'ai-tools-palette-collapsed'

export default function AIToolsPalette({
  editor,
  isVisible,
  onClose
}: AIToolsPaletteProps) {
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null)
  const [selectedText, setSelectedText] = React.useState('')
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  // Load collapsed state on mount
  React.useEffect(() => {
    const savedCollapsed = localStorage.getItem(STORAGE_COLLAPSED_KEY)
    if (savedCollapsed) {
      setIsCollapsed(savedCollapsed === 'true')
    }
  }, [])

  // Update selected text when selection changes
  React.useEffect(() => {
    const updateSelection = () => {
      const { from, to } = editor.state.selection
      const text = editor.state.doc.textBetween(from, to, ' ')
      setSelectedText(text)
    }

    editor.on('selectionUpdate', updateSelection)
    return () => editor.off('selectionUpdate', updateSelection)
  }, [editor])

  // Save collapsed state to localStorage
  const saveCollapsed = React.useCallback((collapsed: boolean) => {
    localStorage.setItem(STORAGE_COLLAPSED_KEY, collapsed.toString())
  }, [])

  const handleAIAction = async (tool: AITool) => {
    if (!selectedText.trim()) {
      // If no text selected, use entire document or show message
      const fullText = editor.getText()
      if (!fullText.trim()) return
    }

    setIsProcessing(tool.id)
    try {
      await tool.action(editor, selectedText || editor.getText())
    } catch (error) {
      console.error(`Error with ${tool.label}:`, error)
    } finally {
      setIsProcessing(null)
    }
  }

  const toggleCollapsed = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    saveCollapsed(newCollapsed)
  }

  const aiTools: AITool[] = [
    {
      id: 'improve',
      icon: <Sparkles className="h-4 w-4" />,
      label: 'Improve',
      description: 'Enhance grammar, clarity, and style',
      color: 'text-purple-600',
      action: async (editor, text) => {
        // TODO: Integrate with AI service
        console.log('Improving text:', text)
      }
    },
    {
      id: 'rewrite',
      icon: <RotateCcw className="h-4 w-4" />,
      label: 'Rewrite',
      description: 'Rewrite in a different style',
      color: 'text-blue-600',
      action: async (editor, text) => {
        // TODO: Integrate with AI service
        console.log('Rewriting text:', text)
      }
    },
    {
      id: 'summarize',
      icon: <FileText className="h-4 w-4" />,
      label: 'Summarize',
      description: 'Create a concise summary',
      color: 'text-green-600',
      action: async (editor, text) => {
        // TODO: Integrate with AI service
        console.log('Summarizing text:', text)
      }
    },
    {
      id: 'translate',
      icon: <Globe className="h-4 w-4" />,
      label: 'Translate',
      description: 'Translate to another language',
      color: 'text-orange-600',
      action: async (editor, text) => {
        // TODO: Integrate with AI service
        console.log('Translating text:', text)
      }
    },
    {
      id: 'explain',
      icon: <Lightbulb className="h-4 w-4" />,
      label: 'Explain',
      description: 'Explain complex concepts',
      color: 'text-yellow-600',
      action: async (editor, text) => {
        // TODO: Integrate with AI service
        console.log('Explaining text:', text)
      }
    },
    {
      id: 'continue',
      icon: <PlusCircle className="h-4 w-4" />,
      label: 'Continue',
      description: 'Continue writing from here',
      color: 'text-indigo-600',
      action: async (editor, text) => {
        // TODO: Integrate with AI service
        console.log('Continuing text:', text)
      }
    },
    {
      id: 'tone',
      icon: <Wand2 className="h-4 w-4" />,
      label: 'Change Tone',
      description: 'Adjust writing tone',
      color: 'text-pink-600',
      action: async (editor, text) => {
        // TODO: Integrate with AI service
        console.log('Changing tone:', text)
      }
    },
    {
      id: 'feedback',
      icon: <MessageSquare className="h-4 w-4" />,
      label: 'Feedback',
      description: 'Get writing feedback',
      color: 'text-teal-600',
      action: async (editor, text) => {
        // TODO: Integrate with AI service
        console.log('Getting feedback for:', text)
      }
    }
  ]

  const ToolButton = ({ tool }: { tool: AITool }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAIAction(tool)}
            disabled={isProcessing !== null}
            className={`ai-tool-button w-full h-12 flex flex-col items-center justify-center gap-1 p-1 hover:bg-accent transition-all duration-200 hover:scale-105 ${
              isProcessing === tool.id ? 'opacity-50' : ''
            }`}
          >
            {isProcessing === tool.id ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <div className={tool.color}>
                {React.cloneElement(tool.icon as React.ReactElement, { className: "h-3 w-3" })}
              </div>
            )}
            <span className="text-xs font-medium leading-none text-center">
              {tool.label.split(' ')[0]}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="text-center">
            <p className="font-medium">{tool.label}</p>
            <p className="text-sm text-muted-foreground">{tool.description}</p>
            {selectedText && (
              <p className="text-xs text-muted-foreground mt-1">
                Selected: "{selectedText.slice(0, 30)}{selectedText.length > 30 ? '...' : ''}"
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  if (!isVisible) return null

  return (
    <div
      className={`ai-tools-palette absolute left-8 top-16 z-30 bg-background/95 backdrop-blur-md border rounded-lg shadow-lg transition-all duration-200`}
      style={{
        width: isCollapsed ? '60px' : '72px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with controls */}
      <div className="flex flex-col items-center p-2 border-b">
        <div className="flex flex-col items-center gap-1">
          <Sparkles className="h-4 w-4 text-primary" />
          {!isCollapsed && (
            <span className="text-xs font-medium text-center leading-tight">AI</span>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="h-6 w-6 p-0 hover:bg-accent"
          >
            {isCollapsed ? (
              <Maximize2 className="h-3 w-3" />
            ) : (
              <Minimize2 className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-accent"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Tools Vertical Stack - only show when not collapsed */}
      {!isCollapsed && (
        <div className="p-2">
          <div className="flex flex-col gap-2">
            {aiTools.map((tool) => (
              <ToolButton key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      )}

      {/* Footer Status - always visible */}
      <div className="p-2 border-t bg-muted/30">
        <div className="text-center">
          {selectedText ? (
            <div className="flex flex-col items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              {!isCollapsed && (
                <span className="text-xs text-muted-foreground text-center leading-tight">
                  {selectedText.length}
                </span>
              )}
            </div>
          ) : (
            !isCollapsed && (
              <span className="text-xs text-muted-foreground text-center leading-tight">
                Select
              </span>
            )
          )}
        </div>
      </div>
    </div>
  )
}