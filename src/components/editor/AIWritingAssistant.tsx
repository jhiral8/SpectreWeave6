'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Surface'
import { Toolbar } from '@/components/ui/Toolbar'
import { Icon } from '@/components/ui/Icon'
import { useAI, useAIChat } from '@/hooks/useAI'
import useSmartSuggestions from '@/hooks/useSmartSuggestions'
import { AIProvider } from '@/lib/ai/types'
import { cn } from '@/lib/utils'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { AIAssistantSkeleton } from '@/components/ui/LoadingSkeleton'

interface AIWritingAssistantProps {
  editor: Editor
  className?: string
}

interface AIAction {
  id: string
  name: string
  description: string
  icon: string
  category: 'basic' | 'tone' | 'style' | 'structure'
  provider?: AIProvider
  prompt: (selectedText: string, context?: string) => string
}

interface AIProvider_Option {
  id: AIProvider
  name: string
  description: string
  icon: string
  bestFor: string[]
}

const AI_PROVIDERS: AIProvider_Option[] = [
  {
    id: 'gemini',
    name: 'Gemini Pro',
    description: 'Google\'s advanced AI',
    icon: 'Sparkles',
    bestFor: ['Creative writing', 'Analysis', 'General tasks']
  },
  {
    id: 'databricks',
    name: 'Databricks',
    description: 'Enterprise AI platform',
    icon: 'Database',
    bestFor: ['Technical writing', 'Data analysis', 'Code documentation']
  },
  {
    id: 'azure',
    name: 'Azure AI',
    description: 'Microsoft\'s AI services',
    icon: 'Cloud',
    bestFor: ['Business writing', 'Compliance', 'Enterprise content']
  }
]

const AI_ACTIONS: AIAction[] = [
  // Basic Actions
  {
    id: 'improve',
    name: 'Improve Writing',
    description: 'Enhance clarity and style',
    icon: 'Sparkles',
    category: 'basic',
    provider: 'gemini',
    prompt: (text, context) => `Improve the following text for clarity, style, and readability while maintaining the original meaning and intent.\n\nContext: ${context || 'General writing'}\nText to improve:\n${text}\n\nProvide only the improved version:`
  },
  {
    id: 'expand',
    name: 'Expand Content',
    description: 'Add detail and context',
    icon: 'Plus',
    category: 'structure',
    provider: 'databricks',
    prompt: (text, context) => `Expand the following text with more detail, examples, and context while maintaining the original tone and style.\n\nContext: ${context || 'General content'}\nText to expand:\n${text}\n\nProvide the expanded version:`
  },
  {
    id: 'summarize',
    name: 'Summarize',
    description: 'Create concise summary',
    icon: 'Minus',
    category: 'structure',
    provider: 'azure',
    prompt: (text, context) => `Create a concise, well-structured summary of the following text that captures the key points and main ideas.\n\nContext: ${context || 'General content'}\nText to summarize:\n${text}\n\nProvide only the summary:`
  },
  {
    id: 'rephrase',
    name: 'Rephrase',
    description: 'Rewrite differently',
    icon: 'RotateCcw',
    category: 'style',
    provider: 'gemini',
    prompt: (text, context) => `Rephrase the following text using different words and sentence structures while preserving the exact meaning and tone.\n\nContext: ${context || 'General writing'}\nText to rephrase:\n${text}\n\nProvide only the rephrased version:`
  },
  
  // Tone Actions
  {
    id: 'tone-professional',
    name: 'Professional',
    description: 'Business-appropriate tone',
    icon: 'Briefcase',
    category: 'tone',
    provider: 'azure',
    prompt: (text, context) => `Rewrite the following text in a professional, business-appropriate tone suitable for formal communication.\n\nContext: ${context || 'Business communication'}\nText to rewrite:\n${text}\n\nProvide only the professional version:`
  },
  {
    id: 'tone-casual',
    name: 'Casual',
    description: 'Friendly and approachable',
    icon: 'Smile',
    category: 'tone',
    provider: 'gemini',
    prompt: (text, context) => `Rewrite the following text in a casual, friendly, and approachable tone that feels conversational.\n\nContext: ${context || 'Casual communication'}\nText to rewrite:\n${text}\n\nProvide only the casual version:`
  },
  {
    id: 'tone-academic',
    name: 'Academic',
    description: 'Scholarly and formal',
    icon: 'GraduationCap',
    category: 'tone',
    provider: 'databricks',
    prompt: (text, context) => `Rewrite the following text in an academic, scholarly tone appropriate for research papers or formal academic writing.\n\nContext: ${context || 'Academic writing'}\nText to rewrite:\n${text}\n\nProvide only the academic version:`
  },
  {
    id: 'tone-persuasive',
    name: 'Persuasive',
    description: 'Compelling and convincing',
    icon: 'Target',
    category: 'tone',
    provider: 'gemini',
    prompt: (text, context) => `Rewrite the following text to be more persuasive and compelling, using strong arguments and engaging language.\n\nContext: ${context || 'Persuasive writing'}\nText to rewrite:\n${text}\n\nProvide only the persuasive version:`
  },
  
  // Style Actions
  {
    id: 'style-concise',
    name: 'Make Concise',
    description: 'Remove unnecessary words',
    icon: 'Zap',
    category: 'style',
    provider: 'azure',
    prompt: (text, context) => `Make the following text more concise by removing unnecessary words, redundancies, and verbose phrases while preserving all important information.\n\nContext: ${context || 'General editing'}\nText to make concise:\n${text}\n\nProvide only the concise version:`
  },
  {
    id: 'style-vivid',
    name: 'Make Vivid',
    description: 'Add descriptive language',
    icon: 'Palette',
    category: 'style',
    provider: 'gemini',
    prompt: (text, context) => `Enhance the following text with vivid, descriptive language, sensory details, and engaging imagery to make it more compelling.\n\nContext: ${context || 'Creative writing'}\nText to enhance:\n${text}\n\nProvide only the vivid version:`
  },
  
  // Structure Actions
  {
    id: 'structure-outline',
    name: 'Create Outline',
    description: 'Generate structured outline',
    icon: 'List',
    category: 'structure',
    provider: 'databricks',
    prompt: (text, context) => `Create a well-structured outline based on the following text, organizing the main points and supporting details logically.\n\nContext: ${context || 'Document structure'}\nText to outline:\n${text}\n\nProvide only the outline:`
  },
  {
    id: 'structure-paragraph',
    name: 'Improve Structure',
    description: 'Better paragraph flow',
    icon: 'AlignLeft',
    category: 'structure',
    provider: 'azure',
    prompt: (text, context) => `Restructure the following text to improve paragraph organization, logical flow, and transitions between ideas.\n\nContext: ${context || 'Document organization'}\nText to restructure:\n${text}\n\nProvide only the restructured version:`
  }
]

export const AIWritingAssistant: React.FC<AIWritingAssistantProps> = React.memo(({
  editor,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<AIAction | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('gemini')
  const [activeCategory, setActiveCategory] = useState<string>('basic')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [panelPosition, setPanelPosition] = useState({ top: 60, left: 20 })
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const { generateText, isLoading } = useAI({ provider: selectedProvider })
  const aiChat = useAIChat('databricks')
  const smartSuggestions = useSmartSuggestions(editor, {
    provider: 'gemini',
    enabled: showSuggestions
  })

  // Get selected text and context from editor
  const getSelectedText = useCallback(() => {
    const { from, to } = editor.state.selection
    return editor.state.doc.textBetween(from, to, ' ')
  }, [editor])

  const getContext = useCallback(() => {
    const { from } = editor.state.selection
    const doc = editor.state.doc
    const contextRange = 200
    
    const start = Math.max(0, from - contextRange)
    const end = Math.min(doc.content.size, from + contextRange)
    
    return doc.textBetween(start, end, ' ')
  }, [editor])

  const getWritingContext = useCallback(() => {
    const text = editor.getText()
    if (text.length < 100) return 'General writing'
    
    // Simple heuristics to determine context
    if (text.includes('Dear ') || text.includes('Sincerely') || text.includes('Best regards')) {
      return 'Business correspondence'
    }
    if (text.includes('Abstract') || text.includes('References') || text.includes('Introduction')) {
      return 'Academic writing'
    }
    if (text.includes('Chapter') || text.includes('Once upon a time')) {
      return 'Creative writing'
    }
    
    return 'General writing'
  }, [editor])

  // Handle AI action execution with provider switching
  const executeAIAction = useCallback(async (action: AIAction) => {
    const text = getSelectedText()
    const currentText = text.trim() || editor.getText()
    
    if (!currentText.trim()) return
    
    setSelectedText(currentText)
    setSelectedAction(action)
    setIsProcessing(true)

    try {
      // Use action's preferred provider or current selection
      const actionProvider = action.provider || selectedProvider
      const aiService = useAI({ provider: actionProvider })
      
      const context = getWritingContext()
      const response = await aiService.generateText(action.prompt(currentText, context), {
        maxTokens: 1000,
        temperature: action.category === 'style' ? 0.7 : 0.5
      })
      
      if (response.success && response.data) {
        const { from, to } = editor.state.selection
        const targetFrom = text.trim() ? from : 0
        const targetTo = text.trim() ? to : editor.state.doc.content.size
        
        editor
          .chain()
          .focus()
          .deleteRange({ from: targetFrom, to: targetTo })
          .insertContent(response.data)
          .run()
      }
    } catch (error) {
      console.error('AI action failed:', error)
    } finally {
      setIsProcessing(false)
      setSelectedAction(null)
      setIsOpen(false)
    }
  }, [editor, selectedProvider, getSelectedText, getWritingContext])

  // Handle custom prompt with context awareness
  const executeCustomPrompt = useCallback(async () => {
    if (!customPrompt.trim()) return

    const text = getSelectedText() || editor.getText()
    if (!text.trim()) return

    setIsProcessing(true)

    try {
      const context = getWritingContext()
      const enhancedPrompt = `${customPrompt}\n\nWriting Context: ${context}\nText to work with:\n${text}\n\nProvide only the result:`
      
      const response = await generateText(enhancedPrompt, {
        maxTokens: 1200,
        temperature: 0.6
      })
      
      if (response.success && response.data) {
        const { from, to } = editor.state.selection
        const targetFrom = getSelectedText().trim() ? from : 0
        const targetTo = getSelectedText().trim() ? to : editor.state.doc.content.size
        
        editor
          .chain()
          .focus()
          .deleteRange({ from: targetFrom, to: targetTo })
          .insertContent(response.data)
          .run()
      }
    } catch (error) {
      console.error('Custom AI prompt failed:', error)
    } finally {
      setIsProcessing(false)
      setCustomPrompt('')
      setIsOpen(false)
    }
  }, [customPrompt, editor, generateText, getSelectedText, getWritingContext])

  // Filter actions by category
  const getActionsByCategory = useCallback((category: string) => {
    return AI_ACTIONS.filter(action => action.category === category)
  }, [])

  // Get unique categories
  const categories = Array.from(new Set(AI_ACTIONS.map(action => action.category)))

  // Calculate panel position relative to button
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const calculatePosition = () => {
        const buttonRect = buttonRef.current?.getBoundingClientRect()
        if (!buttonRect) return
        
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const panelWidth = 550
        const panelHeight = 500
        
        // Position below the button by default
        let top = buttonRect.bottom + 8
        
        // Position panel significantly to the left to ensure it doesn't fall off screen
        // Move it even further left - align right edge of panel 50px left of button right edge
        let left = buttonRect.right - panelWidth - 50
        
        // If that would go off left edge, adjust
        if (left < 20) {
          left = 20
        }
        
        // Double-check it won't go off right edge
        const maxLeft = viewportWidth - panelWidth - 40
        if (left > maxLeft) {
          left = maxLeft
        }
        
        // If panel would go off bottom, position above button
        if (top + panelHeight > viewportHeight - 20) {
          top = buttonRect.top - panelHeight - 8
        }
        
        // Ensure top doesn't go off screen
        if (top < 20) {
          top = 20
        }
        
        setPanelPosition({ top, left })
      }
      
      // Calculate position immediately and on window resize
      calculatePosition()
      window.addEventListener('resize', calculatePosition)
      window.addEventListener('scroll', calculatePosition)
      
      return () => {
        window.removeEventListener('resize', calculatePosition)
        window.removeEventListener('scroll', calculatePosition)
      }
    }
  }, [isOpen])

  // Handle click outside to close and keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null
      
      // Ensure target exists
      if (!target) return
      
      // Check if click is inside the panel using ref - be more specific
      if (panelRef.current) {
        // Check if the click target is the panel itself or any of its descendants
        if (panelRef.current === target || panelRef.current.contains(target)) {
          return // Don't close - click was inside panel
        }
      }
      
      // Check if click is on the button or its children
      if (buttonRef.current) {
        if (buttonRef.current === target || buttonRef.current.contains(target)) {
          return // Don't close - click was on button
        }
      }
      
      // Close if clicking outside both panel and button
      setIsOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + A to toggle AI assistant
      if (event.altKey && event.key === 'a') {
        event.preventDefault()
        setIsOpen(prev => !prev)
      }
      
      // Escape to close
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
      
      // Ctrl/Cmd + Shift + I for improve (quick action)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'I') {
        event.preventDefault()
        const improveAction = AI_ACTIONS.find(action => action.id === 'improve')
        if (improveAction) {
          executeAIAction(improveAction)
        }
      }
      
      // Ctrl/Cmd + Shift + R for rephrase (quick action)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault()
        const rephraseAction = AI_ACTIONS.find(action => action.id === 'rephrase')
        if (rephraseAction) {
          executeAIAction(rephraseAction)
        }
      }
    }

    // Add click handler immediately since panel is now portaled
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, executeAIAction])

  return (
    <ErrorBoundary
      fallback={
        <div className="text-xs text-red-600 dark:text-red-400 p-2">
          AI Assistant temporarily unavailable
        </div>
      }
    >
      <div ref={containerRef} className={cn('relative', className)}>
      {/* AI Assistant Toggle Button */}
      <Toolbar.Button
        ref={buttonRef}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(prev => !prev)
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
        }}
        active={isOpen}
        className="relative"
        disabled={isProcessing || isLoading}
      >
        <Icon name="Bot" />
        {(isProcessing || isLoading || smartSuggestions.isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="Loader2" className="w-4 h-4 animate-spin" />
          </div>
        )}
        {smartSuggestions.suggestions.length > 0 && showSuggestions && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
        )}
      </Toolbar.Button>

      {/* AI Actions Panel */}
      {isOpen && createPortal(
        <div 
          ref={panelRef} 
          className="fixed" 
          style={{ 
            top: `${panelPosition.top}px`,
            left: `${panelPosition.left}px`,
            zIndex: 10000
          }}
        >
        <Surface 
          className={cn(
            'ai-writing-assistant-panel p-4 shadow-xl bg-[--card] text-[--card-foreground] border-[--border]',
            // Bulletproof viewport constraints - ensure full visibility
            'w-[min(550px,calc(100vw-80px))] max-w-[min(550px,calc(100vw-80px))]',
            'max-h-[min(75vh,500px)] overflow-y-auto overflow-x-hidden',
            // Smart positioning: prevent cutoff at all costs
            'z-[1000] will-change-transform',
            'border',
            // Force proper containment
            'contain-intrinsic-size-auto'
          )}
          style={{ 
            // Minimum width guarantee - make it actually wider
            minWidth: '500px',
            // Ensure it never goes outside viewport - allow more width
            maxWidth: 'calc(100vw - 80px)'
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">AI Writing Assistant</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  buttonSize="iconSmall"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className={cn(showSuggestions && 'bg-neutral-100 dark:bg-neutral-800')}
                >
                  <Icon name="Lightbulb" className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  buttonSize="iconSmall"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon name="X" />
                </Button>
              </div>
            </div>

            {/* Provider Selection */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                AI Provider
              </h4>
              <div className="grid grid-cols-3 gap-1">
                {AI_PROVIDERS.map((provider) => (
                  <Button
                    key={provider.id}
                    variant={selectedProvider === provider.id ? 'primary' : 'tertiary'}
                    buttonSize="small"
                    onClick={() => setSelectedProvider(provider.id)}
                    className="text-xs p-2 flex-shrink-0 min-w-0 truncate"
                    title={provider.name}
                  >
                    <Icon name={provider.icon as any} className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{provider.name.split(' ')[0]}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Smart Suggestions */}
            {showSuggestions && smartSuggestions.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Smart Suggestions {smartSuggestions.isLoading && <Icon name="Loader2" className="w-3 h-3 animate-spin inline ml-1" />}
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto overflow-x-hidden">
                  {smartSuggestions.suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-900 rounded text-xs min-w-0">
                      <div className="flex-1 mr-2 min-w-0">
                        <div className="font-medium truncate">{suggestion.text.substring(0, 40)}...</div>
                        <div className="text-neutral-500 dark:text-neutral-400 truncate">{suggestion.metadata?.reason}</div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          buttonSize="iconSmall"
                          onClick={() => smartSuggestions.acceptSuggestion(suggestion.id)}
                        >
                          <Icon name="Check" className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          buttonSize="iconSmall"
                          onClick={() => smartSuggestions.rejectSuggestion(suggestion.id)}
                        >
                          <Icon name="X" className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Tabs */}
            <div className="space-y-2">
              <div className="flex gap-1 overflow-x-auto">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? 'primary' : 'tertiary'}
                    buttonSize="small"
                    onClick={() => setActiveCategory(category)}
                    className="text-xs capitalize whitespace-nowrap"
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Actions for Active Category */}
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto overflow-x-hidden">
                {getActionsByCategory(activeCategory).map((action) => (
                  <Button
                    key={action.id}
                    variant="tertiary"
                    buttonSize="small"
                    onClick={() => executeAIAction(action)}
                    disabled={isProcessing || isLoading}
                    className="flex flex-col items-center gap-1 p-2 text-xs h-auto justify-center min-w-0"
                    title={action.description}
                  >
                    <Icon name={action.icon as any} className="w-4 h-4 flex-shrink-0" />
                    <div className="flex flex-col items-center gap-0.5 min-w-0">
                      <span className="text-center leading-tight truncate w-full">{action.name}</span>
                      {action.provider && (
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate w-full text-center">
                          {AI_PROVIDERS.find(p => p.id === action.provider)?.name.split(' ')[0]}
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Prompt */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Custom Request
              </h4>
              <div className="space-y-2">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe what you want to do with the text..."
                  className="w-full h-16 px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white overflow-hidden"
                  rows={3}
                />
                <Button
                  variant="primary"
                  buttonSize="small"
                  onClick={executeCustomPrompt}
                  disabled={!customPrompt.trim() || isProcessing || isLoading}
                  className="w-full"
                >
                  {isProcessing || isLoading ? (
                    <>
                      <Icon name="Loader2" className="w-3 h-3 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Icon name="Send" className="w-3 h-3 mr-2" />
                      Apply Request
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Status */}
            {selectedText && (
              <div className="text-xs text-neutral-500 dark:text-neutral-400 p-2 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
                <div className="truncate">
                  Working with {selectedText.length > 80 
                    ? `${selectedText.substring(0, 80)}...` 
                    : selectedText}
                </div>
              </div>
            )}
            
            {/* Keyboard Shortcuts Help */}
            <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 p-2 bg-neutral-50 dark:bg-neutral-900 rounded overflow-hidden">
              <div className="font-medium mb-1">Shortcuts:</div>
              <div className="space-y-0.5">
                <div className="truncate">Alt + A: Toggle AI Assistant</div>
                <div className="truncate">Ctrl/⌘ + Shift + I: Quick Improve</div>
                <div className="truncate">Ctrl/⌘ + Shift + R: Quick Rephrase</div>
                <div className="truncate">Escape: Close</div>
              </div>
            </div>
          </div>
        </Surface>
        </div>,
        document.body
      )}
      </div>
    </ErrorBoundary>
  )
})

// Display name for debugging
AIWritingAssistant.displayName = 'AIWritingAssistant'

export default AIWritingAssistant