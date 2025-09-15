'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Editor } from '@tiptap/react'
import { useAI } from './useAI'
import { AIProvider } from '@/lib/ai/types'

interface Suggestion {
  id: string
  text: string
  confidence: number
  type: 'completion' | 'improvement' | 'correction'
  startPos: number
  endPos: number
  metadata?: {
    reason?: string
    alternatives?: string[]
  }
}

interface SmartSuggestionsOptions {
  provider?: AIProvider
  enabled?: boolean
  minConfidence?: number
  debounceMs?: number
  maxSuggestions?: number
  contextWindow?: number
}

interface UseSmartSuggestionsReturn {
  suggestions: Suggestion[]
  isLoading: boolean
  error: string | null
  acceptSuggestion: (suggestionId: string) => void
  rejectSuggestion: (suggestionId: string) => void
  refreshSuggestions: () => void
  clearSuggestions: () => void
  toggleEnabled: () => void
  enabled: boolean
}

function useSmartSuggestions(
  editor: Editor,
  options: SmartSuggestionsOptions = {}
): UseSmartSuggestionsReturn {
  const {
    provider = 'gemini',
    enabled: initialEnabled = true,
    minConfidence = 0.7,
    debounceMs = 1000,
    maxSuggestions = 5,
    contextWindow = 500
  } = options

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(initialEnabled)

  const { generateText } = useAI({ provider })
  const debounceRef = useRef<NodeJS.Timeout>()
  const lastAnalyzedContent = useRef<string>('')

  // Get context around cursor position
  const getContext = useCallback(() => {
    const { selection } = editor.state
    const { from } = selection
    const doc = editor.state.doc
    
    // Get text around cursor position
    const start = Math.max(0, from - contextWindow)
    const end = Math.min(doc.content.size, from + contextWindow)
    
    return {
      before: doc.textBetween(start, from, ' '),
      after: doc.textBetween(from, end, ' '),
      cursorPos: from - start,
      absolutePos: from
    }
  }, [editor, contextWindow])

  // Get current sentence or paragraph for analysis
  const getCurrentSegment = useCallback(() => {
    const { selection } = editor.state
    const { from } = selection
    const doc = editor.state.doc
    
    // Find sentence boundaries
    const text = doc.textBetween(0, doc.content.size, ' ')
    const sentences = text.split(/[.!?]+/)
    
    let currentSentence = ''
    let sentenceStart = 0
    let cumulativeLength = 0
    
    for (const sentence of sentences) {
      const sentenceLength = sentence.length + 1 // +1 for delimiter
      if (cumulativeLength + sentenceLength >= from) {
        currentSentence = sentence.trim()
        sentenceStart = cumulativeLength
        break
      }
      cumulativeLength += sentenceLength
    }
    
    return {
      text: currentSentence,
      start: sentenceStart,
      end: sentenceStart + currentSentence.length
    }
  }, [editor])

  // Generate AI-powered suggestions
  const generateSuggestions = useCallback(async () => {
    if (!enabled || isLoading) return

    const context = getContext()
    const segment = getCurrentSegment()
    
    if (!context.before.trim() && !context.after.trim()) return
    if (segment.text === lastAnalyzedContent.current) return

    lastAnalyzedContent.current = segment.text
    setIsLoading(true)
    setError(null)

    try {
      const prompts = [
        // Completion suggestions
        {
          type: 'completion',
          prompt: `Given this writing context, suggest the most likely next 3-8 words to complete the thought naturally:

Context before: "${context.before}"
Context after: "${context.after}"

Respond with ONLY the suggested completion text, no explanations. If no good completion exists, respond with "NONE".`
        },
        
        // Style improvements
        {
          type: 'improvement',
          prompt: `Analyze this sentence for potential improvements in clarity, style, and conciseness:

Sentence: "${segment.text}"

Provide ONE improved version if needed, or "NONE" if the sentence is already well-written. Respond with ONLY the improved sentence.`
        },

        // Grammar/spelling corrections
        {
          type: 'correction',
          prompt: `Check this text for grammar, spelling, or punctuation errors:

Text: "${segment.text}"

If errors exist, provide the corrected version. If no errors, respond with "NONE". Respond with ONLY the corrected text.`
        }
      ]

      const suggestionPromises = prompts.map(async ({ type, prompt }) => {
        try {
          const response = await generateText(prompt, {
            maxTokens: 100,
            temperature: type === 'completion' ? 0.7 : 0.3
          })
          
          if (response.success && response.data && response.data.trim() !== 'NONE') {
            return {
              id: `${type}-${Date.now()}-${Math.random()}`,
              text: response.data.trim(),
              confidence: 0.8, // Could be improved with actual confidence scoring
              type: type as Suggestion['type'],
              startPos: type === 'completion' ? context.absolutePos : segment.start,
              endPos: type === 'completion' ? context.absolutePos : segment.end,
              metadata: {
                reason: type === 'completion' ? 'AI text completion' : 
                        type === 'improvement' ? 'Style improvement suggestion' : 
                        'Grammar/spelling correction'
              }
            }
          }
          return null
        } catch (err) {
          console.warn(`Failed to generate ${type} suggestion:`, err)
          return null
        }
      })

      const results = await Promise.all(suggestionPromises)
      const validSuggestions = results
        .filter((s): s is Suggestion => s !== null)
        .filter(s => s.confidence >= minConfidence)
        .slice(0, maxSuggestions)

      setSuggestions(validSuggestions)
    } catch (err: any) {
      setError(err.message || 'Failed to generate suggestions')
      console.error('Smart suggestions error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [enabled, isLoading, getContext, getCurrentSegment, generateText, minConfidence, maxSuggestions])

  // Debounced suggestion generation
  const debouncedGenerateSuggestions = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(generateSuggestions, debounceMs)
  }, [generateSuggestions, debounceMs])

  // Accept a suggestion
  const acceptSuggestion = useCallback((suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (!suggestion) return

    const { startPos, endPos, text, type } = suggestion
    
    editor
      .chain()
      .focus()
      .deleteRange({ from: startPos, to: endPos })
      .insertContent(text)
      .run()

    // Remove the accepted suggestion and related ones
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
    
    // Track suggestion acceptance for analytics
    console.log('Suggestion accepted:', { type, text, confidence: suggestion.confidence })
  }, [editor, suggestions])

  // Reject a suggestion
  const rejectSuggestion = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
    
    // Track suggestion rejection for analytics
    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (suggestion) {
      console.log('Suggestion rejected:', { type: suggestion.type, confidence: suggestion.confidence })
    }
  }, [suggestions])

  // Clear all suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    setError(null)
  }, [])

  // Toggle enabled state
  const toggleEnabled = useCallback(() => {
    setEnabled(prev => !prev)
    if (!enabled) {
      clearSuggestions()
    }
  }, [enabled, clearSuggestions])

  // Listen to editor changes
  useEffect(() => {
    if (!enabled) return

    const handleUpdate = () => {
      debouncedGenerateSuggestions()
    }

    const handleSelectionUpdate = () => {
      // Clear suggestions when cursor moves significantly
      const context = getContext()
      if (Math.abs(context.cursorPos) > 50) {
        clearSuggestions()
      }
    }

    editor.on('update', handleUpdate)
    editor.on('selectionUpdate', handleSelectionUpdate)

    return () => {
      editor.off('update', handleUpdate)
      editor.off('selectionUpdate', handleSelectionUpdate)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [editor, enabled, debouncedGenerateSuggestions, getContext, clearSuggestions])

  return {
    suggestions,
    isLoading,
    error,
    acceptSuggestion,
    rejectSuggestion,
    refreshSuggestions: generateSuggestions,
    clearSuggestions,
    toggleEnabled,
    enabled
  }
}

export default useSmartSuggestions