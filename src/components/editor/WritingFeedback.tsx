'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Editor } from '@tiptap/react'
import { Surface } from '@/components/ui/Surface'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useAI } from '@/hooks/useAI'
import { promptEngine } from '@/lib/ai/promptTemplates'
import { cn } from '@/lib/utils'

interface WritingFeedbackProps {
  editor: Editor
  className?: string
  enableRealTime?: boolean
}

interface FeedbackItem {
  id: string
  type: 'grammar' | 'style' | 'clarity' | 'tone' | 'structure' | 'suggestion'
  severity: 'error' | 'warning' | 'info'
  message: string
  suggestion?: string
  position?: {
    from: number
    to: number
  }
  confidence: number
  category: string
}

interface WritingMetrics {
  readabilityScore: number
  sentenceComplexity: 'simple' | 'moderate' | 'complex'
  toneConsistency: number
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced'
  structureScore: number
  overallScore: number
}

const FEEDBACK_CATEGORIES = {
  grammar: { name: 'Grammar', icon: 'CheckCircle', color: 'text-red-600' },
  style: { name: 'Style', icon: 'Palette', color: 'text-blue-600' },
  clarity: { name: 'Clarity', icon: 'Eye', color: 'text-yellow-600' },
  tone: { name: 'Tone', icon: 'Volume2', color: 'text-purple-600' },
  structure: { name: 'Structure', icon: 'Layout', color: 'text-green-600' },
  suggestion: { name: 'Suggestion', icon: 'Lightbulb', color: 'text-orange-600' }
}

export const WritingFeedback: React.FC<WritingFeedbackProps> = ({
  editor,
  className,
  enableRealTime = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [metrics, setMetrics] = useState<WritingMetrics>({
    readabilityScore: 0,
    sentenceComplexity: 'simple',
    toneConsistency: 0,
    vocabularyLevel: 'basic',
    structureScore: 0,
    overallScore: 0
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [lastAnalysis, setLastAnalysis] = useState<string>('')

  const { generateText } = useAI({ provider: 'gemini' })

  // Calculate basic writing metrics
  const calculateMetrics = useCallback((text: string): WritingMetrics => {
    if (!text.trim()) {
      return {
        readabilityScore: 0,
        sentenceComplexity: 'simple',
        toneConsistency: 0,
        vocabularyLevel: 'basic',
        structureScore: 0,
        overallScore: 0
      }
    }

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.trim().split(/\s+/)
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0
    const avgSyllablesPerWord = 1.5 // Approximation

    // Flesch Reading Ease Score
    const readabilityScore = Math.max(0, Math.min(100,
      206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
    ))

    // Sentence complexity
    const sentenceComplexity = avgWordsPerSentence > 20 ? 'complex' :
                               avgWordsPerSentence > 12 ? 'moderate' : 'simple'

    // Vocabulary level (simplified heuristic)
    const longWords = words.filter(word => word.length > 6).length
    const vocabularyLevel = longWords / words.length > 0.3 ? 'advanced' :
                           longWords / words.length > 0.15 ? 'intermediate' : 'basic'

    // Tone consistency (placeholder - would need more sophisticated analysis)
    const toneConsistency = Math.random() * 100 // Placeholder

    // Structure score (based on paragraph length variation)
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    const avgParagraphLength = paragraphs.length > 0 ? 
      paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0) / paragraphs.length : 0
    const structureScore = Math.min(100, Math.max(0, 100 - Math.abs(avgParagraphLength - 50)))

    const overallScore = (readabilityScore + toneConsistency + structureScore) / 3

    return {
      readabilityScore: Math.round(readabilityScore),
      sentenceComplexity,
      toneConsistency: Math.round(toneConsistency),
      vocabularyLevel,
      structureScore: Math.round(structureScore),
      overallScore: Math.round(overallScore)
    }
  }, [])

  // Analyze text with AI for feedback
  const analyzeText = useCallback(async (text: string) => {
    if (!text.trim() || text === lastAnalysis) return
    
    setIsAnalyzing(true)
    setLastAnalysis(text)

    try {
      // Grammar and style analysis
      const grammarPrompt = promptEngine.buildPrompt('grammarAndStyle', {
        text,
        style_guide: 'AP Style',
        strictness_level: 'moderate'
      })

      // Content analysis
      const analysisPrompt = promptEngine.buildPrompt('contentAnalysis', {
        text,
        analysis_focus: 'clarity and effectiveness',
        criteria: 'grammar, style, clarity, tone consistency, structure'
      })

      const [grammarResponse, analysisResponse] = await Promise.all([
        generateText(grammarPrompt, { maxTokens: 800, temperature: 0.1 }),
        generateText(analysisPrompt, { maxTokens: 1000, temperature: 0.3 })
      ])

      const newFeedback: FeedbackItem[] = []

      // Process grammar feedback
      if (grammarResponse.success && grammarResponse.data) {
        const grammarIssues = parseGrammarFeedback(grammarResponse.data)
        newFeedback.push(...grammarIssues)
      }

      // Process analysis feedback
      if (analysisResponse.success && analysisResponse.data) {
        const analysisIssues = parseAnalysisFeedback(analysisResponse.data)
        newFeedback.push(...analysisIssues)
      }

      // Add basic rule-based feedback
      const ruleBasedFeedback = generateRuleBasedFeedback(text)
      newFeedback.push(...ruleBasedFeedback)

      setFeedback(newFeedback)
      setMetrics(calculateMetrics(text))

    } catch (error) {
      console.error('Writing analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [generateText, lastAnalysis, calculateMetrics])

  // Parse AI grammar feedback into structured format
  const parseGrammarFeedback = (response: string): FeedbackItem[] => {
    const feedback: FeedbackItem[] = []
    
    // Simple parsing - in production, would use more sophisticated NLP
    const lines = response.split('\n').filter(line => line.trim())
    
    lines.forEach((line, index) => {
      if (line.includes('error') || line.includes('mistake') || line.includes('incorrect')) {
        feedback.push({
          id: `grammar-${index}`,
          type: 'grammar',
          severity: 'error',
          message: line.trim(),
          confidence: 0.8,
          category: 'grammar'
        })
      } else if (line.includes('suggest') || line.includes('consider') || line.includes('improve')) {
        feedback.push({
          id: `style-${index}`,
          type: 'style',
          severity: 'info',
          message: line.trim(),
          confidence: 0.7,
          category: 'style'
        })
      }
    })

    return feedback
  }

  // Parse AI analysis feedback
  const parseAnalysisFeedback = (response: string): FeedbackItem[] => {
    const feedback: FeedbackItem[] = []
    
    const lines = response.split('\n').filter(line => line.trim())
    
    lines.forEach((line, index) => {
      if (line.includes('clarity') || line.includes('unclear')) {
        feedback.push({
          id: `clarity-${index}`,
          type: 'clarity',
          severity: 'warning',
          message: line.trim(),
          confidence: 0.6,
          category: 'clarity'
        })
      } else if (line.includes('tone') || line.includes('voice')) {
        feedback.push({
          id: `tone-${index}`,
          type: 'tone',
          severity: 'info',
          message: line.trim(),
          confidence: 0.6,
          category: 'tone'
        })
      }
    })

    return feedback
  }

  // Generate rule-based feedback
  const generateRuleBasedFeedback = (text: string): FeedbackItem[] => {
    const feedback: FeedbackItem[] = []
    const words = text.split(/\s+/)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)

    // Check for passive voice
    const passiveIndicators = ['was', 'were', 'been', 'being']
    const passiveCount = words.filter(word => 
      passiveIndicators.includes(word.toLowerCase())
    ).length

    if (passiveCount > sentences.length * 0.3) {
      feedback.push({
        id: 'passive-voice',
        type: 'style',
        severity: 'warning',
        message: 'Consider reducing passive voice usage for more direct writing',
        confidence: 0.8,
        category: 'style'
      })
    }

    // Check for sentence length
    sentences.forEach((sentence, index) => {
      const sentenceWords = sentence.trim().split(/\s+/)
      if (sentenceWords.length > 30) {
        feedback.push({
          id: `long-sentence-${index}`,
          type: 'clarity',
          severity: 'warning',
          message: `Sentence ${index + 1} is quite long (${sentenceWords.length} words). Consider breaking it up for better readability.`,
          confidence: 0.9,
          category: 'clarity'
        })
      }
    })

    // Check for repeated words
    const wordFreq: Record<string, number> = {}
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '')
      if (cleanWord.length > 3) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1
      }
    })

    Object.entries(wordFreq).forEach(([word, count]) => {
      if (count > 5 && words.length > 100) {
        feedback.push({
          id: `repeated-${word}`,
          type: 'style',
          severity: 'info',
          message: `The word "${word}" appears ${count} times. Consider using synonyms for variety.`,
          confidence: 0.7,
          category: 'style'
        })
      }
    })

    return feedback
  }

  // Filter feedback by category
  const filteredFeedback = useMemo(() => {
    if (activeCategory === 'all') return feedback
    return feedback.filter(item => item.category === activeCategory)
  }, [feedback, activeCategory])

  // Auto-analyze on text changes
  useEffect(() => {
    if (!enableRealTime) return

    const debounceTimer = setTimeout(() => {
      const text = editor.getText()
      if (text.trim() && text.length > 50) {
        analyzeText(text)
      }
    }, 2000)

    return () => clearTimeout(debounceTimer)
  }, [editor, enableRealTime, analyzeText])

  // Manual analysis trigger
  const triggerAnalysis = useCallback(() => {
    const text = editor.getText()
    if (text.trim()) {
      analyzeText(text)
    }
  }, [editor, analyzeText])

  // Apply suggestion
  const applySuggestion = useCallback((feedbackItem: FeedbackItem) => {
    if (feedbackItem.suggestion && feedbackItem.position) {
      const { from, to } = feedbackItem.position
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent(feedbackItem.suggestion)
        .run()

      // Remove applied feedback
      setFeedback(prev => prev.filter(item => item.id !== feedbackItem.id))
    }
  }, [editor])

  // Get feedback summary
  const feedbackSummary = useMemo(() => {
    const summary = {
      errors: feedback.filter(f => f.severity === 'error').length,
      warnings: feedback.filter(f => f.severity === 'warning').length,
      suggestions: feedback.filter(f => f.severity === 'info').length
    }
    return summary
  }, [feedback])

  return (
    <div className={cn('relative', className)}>
      {/* Compact Feedback Bar */}
      <Surface className="flex items-center justify-between px-3 py-2 text-sm">
        <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>{feedbackSummary.errors}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span>{feedbackSummary.warnings}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>{feedbackSummary.suggestions}</span>
            </div>
          </div>
          <div className="text-xs">
            Score: {metrics.overallScore}/100
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            buttonSize="iconSmall"
            onClick={triggerAnalysis}
            disabled={isAnalyzing}
          >
            <Icon name={isAnalyzing ? 'Loader2' : 'RefreshCw'} 
                  className={cn('w-4 h-4', isAnalyzing && 'animate-spin')} />
          </Button>
          <Button
            variant="ghost"
            buttonSize="iconSmall"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} />
          </Button>
        </div>
      </Surface>

      {/* Expanded Feedback Panel */}
      {isExpanded && (
        <Surface className="absolute bottom-full right-0 mb-2 w-96 max-h-96 p-4 z-50 shadow-lg overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Writing Feedback</h3>
              <Button
                variant="ghost"
                buttonSize="iconSmall"
                onClick={() => setIsExpanded(false)}
              >
                <Icon name="X" />
              </Button>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Readability:</span>
                  <span className="font-medium">{metrics.readabilityScore}/100</span>
                </div>
                <div className="flex justify-between">
                  <span>Structure:</span>
                  <span className="font-medium">{metrics.structureScore}/100</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Complexity:</span>
                  <span className="font-medium capitalize">{metrics.sentenceComplexity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vocabulary:</span>
                  <span className="font-medium capitalize">{metrics.vocabularyLevel}</span>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-1 overflow-x-auto">
              <Button
                variant={activeCategory === 'all' ? 'primary' : 'tertiary'}
                buttonSize="small"
                onClick={() => setActiveCategory('all')}
                className="text-xs whitespace-nowrap"
              >
                All ({feedback.length})
              </Button>
              {Object.entries(FEEDBACK_CATEGORIES).map(([key, cat]) => {
                const count = feedback.filter(f => f.category === key).length
                if (count === 0) return null
                
                return (
                  <Button
                    key={key}
                    variant={activeCategory === key ? 'primary' : 'tertiary'}
                    buttonSize="small"
                    onClick={() => setActiveCategory(key)}
                    className="text-xs whitespace-nowrap"
                  >
                    {cat.name} ({count})
                  </Button>
                )
              })}
            </div>

            {/* Feedback Items */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredFeedback.length === 0 ? (
                <div className="text-center text-neutral-500 dark:text-neutral-400 py-4">
                  {feedback.length === 0 ? 'No feedback available' : 'No items in this category'}
                </div>
              ) : (
                filteredFeedback.map((item) => {
                  const category = FEEDBACK_CATEGORIES[item.type]
                  return (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 rounded">
                      <Icon name={category.icon as any} className={cn('w-4 h-4 mt-0.5', category.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">{item.message}</div>
                        {item.suggestion && (
                          <div className="mt-1">
                            <Button
                              variant="secondary"
                              buttonSize="small"
                              onClick={() => applySuggestion(item)}
                              className="text-xs"
                            >
                              Apply Suggestion
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          item.severity === 'error' ? 'bg-red-500' :
                          item.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        )} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </Surface>
      )}
    </div>
  )
}

export default WritingFeedback