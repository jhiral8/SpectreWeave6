'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { Surface } from '@/components/ui/Surface'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useAI } from '@/hooks/useAI'
import { resilientAIService } from '@/lib/ai/resilientAIService'
import { cn } from '@/lib/utils'

interface WritingAnalyticsProps {
  editor: Editor
  className?: string
}

interface AnalyticsData {
  // Basic metrics
  characters: number
  charactersNoSpaces: number
  words: number
  sentences: number
  paragraphs: number
  readingTime: number
  readabilityScore: number
  averageWordsPerSentence: number
  averageSentencesPerParagraph: number
  mostUsedWords: Array<{ word: string; count: number }>
  
  // Enhanced AI-powered metrics
  sentimentScore: number
  complexityScore: number
  coherenceScore: number
  engagementScore: number
  seoScore: number
  aiInsights: AIInsight[]
  writingStyle: string
  targetAudience: string
  improvementSuggestions: string[]
}

interface AIInsight {
  id: string
  type: 'improvement' | 'strength' | 'warning' | 'suggestion'
  category: 'style' | 'structure' | 'seo' | 'readability' | 'engagement' | 'grammar'
  message: string
  impact: 'low' | 'medium' | 'high'
  confidence: number
  actionable?: string
}

const READING_SPEED_WPM = 200

export const EnhancedWritingAnalytics: React.FC<WritingAnalyticsProps> = ({
  editor,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    readingTime: 0,
    readabilityScore: 0,
    averageWordsPerSentence: 0,
    averageSentencesPerParagraph: 0,
    mostUsedWords: [],
    sentimentScore: 50,
    complexityScore: 0,
    coherenceScore: 0,
    engagementScore: 0,
    seoScore: 0,
    aiInsights: [],
    writingStyle: 'Unknown',
    targetAudience: 'General',
    improvementSuggestions: []
  })
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalyzedText, setLastAnalyzedText] = useState('')
  const [analysisHistory, setAnalysisHistory] = useState<Array<{
    timestamp: number
    overallScore: number
    wordCount: number
  }>>([])

  const { generateText } = useAI({ provider: 'gemini' })

  // Perform comprehensive AI analysis
  const performAIAnalysis = useCallback(async (text: string) => {
    if (!text.trim() || text === lastAnalyzedText || text.length < 50) return
    
    setIsAnalyzing(true)
    setLastAnalyzedText(text)
    
    try {
      const analysisPrompt = `Analyze this text comprehensively for writing quality. Respond with ONLY valid JSON:

Text: "${text}"

{
  "sentimentScore": <0-100 where 50 is neutral>,
  "complexityScore": <0-100 text complexity>,
  "coherenceScore": <0-100 logical flow>,
  "engagementScore": <0-100 reader engagement>,
  "seoScore": <0-100 SEO optimization>,
  "writingStyle": "<detected style: academic/business/creative/technical/journalistic/conversational>",
  "targetAudience": "<inferred audience: general/professional/academic/technical/students>",
  "insights": [
    {
      "type": "improvement|strength|warning|suggestion",
      "category": "style|structure|seo|readability|engagement|grammar",
      "message": "<specific insight>",
      "impact": "low|medium|high",
      "confidence": <0-100>,
      "actionable": "<optional actionable advice>"
    }
  ],
  "improvementSuggestions": [
    "<specific improvement suggestion 1>",
    "<specific improvement suggestion 2>"
  ]
}`
      
      const response = await resilientAIService.generateText({
        prompt: analysisPrompt,
        provider: 'gemini',
        options: {
          maxTokens: 1500,
          temperature: 0.2
        }
      })
      
      if (response.success && response.data) {
        try {
          // Clean the response to extract JSON
          const jsonMatch = response.data.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const aiAnalysis = JSON.parse(jsonMatch[0])
            
            setAnalytics(prev => ({
              ...prev,
              sentimentScore: Math.round(aiAnalysis.sentimentScore || 50),
              complexityScore: Math.round(aiAnalysis.complexityScore || 0),
              coherenceScore: Math.round(aiAnalysis.coherenceScore || 0),
              engagementScore: Math.round(aiAnalysis.engagementScore || 0),
              seoScore: Math.round(aiAnalysis.seoScore || 0),
              writingStyle: aiAnalysis.writingStyle || 'Unknown',
              targetAudience: aiAnalysis.targetAudience || 'General',
              improvementSuggestions: aiAnalysis.improvementSuggestions || [],
              aiInsights: (aiAnalysis.insights || []).map((insight: any, index: number) => ({
                id: `insight-${index}-${Date.now()}`,
                ...insight
              }))
            }))

            // Add to analysis history
            const overallScore = Math.round(
              (prev.readabilityScore + 
               (aiAnalysis.coherenceScore || 0) + 
               (aiAnalysis.engagementScore || 0)) / 3
            )
            
            setAnalysisHistory(prev => [
              { timestamp: Date.now(), overallScore, wordCount: prev.words },
              ...prev.slice(0, 9) // Keep last 10 analyses
            ])
          }
        } catch (parseError) {
          console.warn('Failed to parse AI analysis:', parseError)
          // Fallback to rule-based insights
          generateRuleBasedInsights(text)
        }
      }
    } catch (error) {
      console.error('AI analysis failed:', error)
      generateRuleBasedInsights(text)
    } finally {
      setIsAnalyzing(false)
    }
  }, [lastAnalyzedText])

  // Generate rule-based insights as fallback
  const generateRuleBasedInsights = useCallback((text: string) => {
    const insights: AIInsight[] = []
    const words = text.split(/\s+/)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    // Check for passive voice
    const passiveCount = words.filter(word => 
      ['was', 'were', 'been', 'being'].includes(word.toLowerCase())
    ).length
    
    if (passiveCount > sentences.length * 0.3) {
      insights.push({
        id: 'passive-voice',
        type: 'improvement',
        category: 'style',
        message: 'High passive voice usage detected. Consider using more active voice.',
        impact: 'medium',
        confidence: 85,
        actionable: 'Replace passive constructions with active voice where possible'
      })
    }

    // Check sentence length variation
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length)
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length
    const variance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length
    
    if (variance < 10) {
      insights.push({
        id: 'sentence-variation',
        type: 'suggestion',
        category: 'style',
        message: 'Sentence lengths are very similar. Vary sentence length for better flow.',
        impact: 'low',
        confidence: 70,
        actionable: 'Mix short, medium, and long sentences for better rhythm'
      })
    }

    // Check for readability issues
    if (avgLength > 25) {
      insights.push({
        id: 'long-sentences',
        type: 'warning',
        category: 'readability',
        message: 'Average sentence length is quite high. Consider breaking up long sentences.',
        impact: 'high',
        confidence: 90,
        actionable: 'Aim for 15-20 words per sentence on average'
      })
    }

    // Check for keyword density issues
    const wordFreq: Record<string, number> = {}
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '')
      if (cleanWord.length > 3) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1
      }
    })

    const overusedWords = Object.entries(wordFreq)
      .filter(([word, count]) => count > words.length * 0.02 && count > 3)
      .sort(([, a], [, b]) => b - a)

    if (overusedWords.length > 0) {
      insights.push({
        id: 'word-repetition',
        type: 'improvement',
        category: 'style',
        message: `Frequent repetition of words: ${overusedWords.slice(0, 3).map(([word]) => word).join(', ')}`,
        impact: 'medium',
        confidence: 80,
        actionable: 'Use synonyms and varied vocabulary to improve text quality'
      })
    }

    setAnalytics(prev => ({ ...prev, aiInsights: insights }))
  }, [])

  // Calculate basic analytics
  const calculateBasicAnalytics = useMemo(() => {
    const text = editor.getText()
    
    if (!text.trim()) {
      return {
        characters: 0,
        charactersNoSpaces: 0,
        words: 0,
        sentences: 0,
        paragraphs: 0,
        readingTime: 0,
        readabilityScore: 0,
        averageWordsPerSentence: 0,
        averageSentencesPerParagraph: 0,
        mostUsedWords: []
      }
    }

    const characters = text.length
    const charactersNoSpaces = text.replace(/\s/g, '').length
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length
    const paragraphs = text.split(/\n\s*\n/).filter(para => para.trim().length > 0).length

    const readingTime = Math.ceil(words / READING_SPEED_WPM)
    const averageWordsPerSentence = sentences > 0 ? Math.round(words / sentences) : 0
    const averageSentencesPerParagraph = paragraphs > 0 ? Math.round(sentences / paragraphs) : 0

    // Enhanced readability calculation
    const averageSentenceLength = sentences > 0 ? words / sentences : 0
    const averageSyllablesPerWord = 1.5
    const readabilityScore = Math.max(0, Math.min(100, 
      206.835 - (1.015 * averageSentenceLength) - (84.6 * averageSyllablesPerWord)
    ))

    // Enhanced word frequency analysis
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those'
    ])

    const wordFrequency: Record<string, number> = {}
    const wordsArray = text.toLowerCase().match(/\b\w+\b/g) || []
    
    wordsArray.forEach(word => {
      if (!stopWords.has(word) && word.length > 2) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1
      }
    })

    const mostUsedWords = Object.entries(wordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([word, count]) => ({ word, count }))

    return {
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      readingTime,
      readabilityScore: Math.round(readabilityScore),
      averageWordsPerSentence,
      averageSentencesPerParagraph,
      mostUsedWords
    }
  }, [editor])

  // Update analytics when editor content changes
  useEffect(() => {
    const updateAnalytics = () => {
      const basicAnalytics = calculateBasicAnalytics
      setAnalytics(prev => ({ ...prev, ...basicAnalytics }))
      
      // Trigger AI analysis with debounce
      const text = editor.getText()
      if (text.length > 50) {
        const debounceTimer = setTimeout(() => {
          performAIAnalysis(text)
        }, 3000)
        
        return () => clearTimeout(debounceTimer)
      }
    }

    updateAnalytics()
    editor.on('update', updateAnalytics)

    return () => {
      editor.off('update', updateAnalytics)
    }
  }, [editor, calculateBasicAnalytics, performAIAnalysis])

  // Manual AI analysis trigger
  const triggerAIAnalysis = useCallback(() => {
    const text = editor.getText()
    if (text.trim()) {
      performAIAnalysis(text)
    }
  }, [editor, performAIAnalysis])

  // Get readability level
  const getReadabilityLevel = (score: number) => {
    if (score >= 90) return { level: 'Very Easy', color: 'text-green-600' }
    if (score >= 80) return { level: 'Easy', color: 'text-green-500' }
    if (score >= 70) return { level: 'Fairly Easy', color: 'text-yellow-500' }
    if (score >= 60) return { level: 'Standard', color: 'text-orange-500' }
    if (score >= 50) return { level: 'Fairly Difficult', color: 'text-red-500' }
    if (score >= 30) return { level: 'Difficult', color: 'text-red-600' }
    return { level: 'Very Difficult', color: 'text-red-700' }
  }

  const readability = getReadabilityLevel(analytics.readabilityScore)

  return (
    <div className={cn('relative', className)}>
      {/* Compact Stats Bar */}
      <Surface className="flex items-center justify-between px-3 py-2 text-sm">
        <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400">
          <span>{analytics.words} words</span>
          <span>{analytics.characters} chars</span>
          <span>{analytics.readingTime}min read</span>
          {analytics.aiInsights.length > 0 && (
            <div className="flex items-center gap-1">
              <Icon name="Brain" className="w-3 h-3" />
              <span>{analytics.aiInsights.length}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            buttonSize="iconSmall"
            onClick={triggerAIAnalysis}
            disabled={isAnalyzing}
            title="AI Analysis"
          >
            <Icon name={isAnalyzing ? 'Loader2' : 'Brain'} 
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

      {/* Expanded Analytics Panel */}
      {isExpanded && (
        <Surface className="absolute bottom-full left-0 mb-2 w-[28rem] max-h-[32rem] p-4 z-50 shadow-lg overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Writing Analytics</h3>
              <Button
                variant="ghost"
                buttonSize="iconSmall"
                onClick={() => setIsExpanded(false)}
              >
                <Icon name="X" />
              </Button>
            </div>

            {/* AI Insights */}
            {analytics.aiInsights.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    🤖 AI Insights
                  </h4>
                  {isAnalyzing && (
                    <Icon name="Loader2" className="w-3 h-3 animate-spin" />
                  )}
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {analytics.aiInsights.map((insight) => {
                    const iconMap = {
                      improvement: 'TrendingUp',
                      strength: 'CheckCircle',
                      warning: 'AlertTriangle',
                      suggestion: 'Lightbulb'
                    }
                    const colorMap = {
                      improvement: 'text-blue-600',
                      strength: 'text-green-600',
                      warning: 'text-yellow-600',
                      suggestion: 'text-purple-600'
                    }
                    
                    return (
                      <div key={insight.id} className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded">
                        <div className="flex items-start gap-2">
                          <Icon 
                            name={iconMap[insight.type] as any} 
                            className={cn('w-4 h-4 mt-0.5', colorMap[insight.type])} 
                          />
                          <div className="flex-1 text-xs">
                            <div className="font-medium capitalize mb-1">{insight.category}</div>
                            <div className="text-neutral-600 dark:text-neutral-400 mb-2">{insight.message}</div>
                            {insight.actionable && (
                              <div className="text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 p-2 rounded text-[11px]">
                                💡 {insight.actionable}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-medium',
                                insight.impact === 'high' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                                insight.impact === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' :
                                'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'
                              )}>
                                {insight.impact} impact
                              </span>
                              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                {insight.confidence}% confidence
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Writing Profile */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <h4 className="font-medium text-neutral-600 dark:text-neutral-400">Writing Profile</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Style:</span>
                    <span className="font-medium capitalize">{analytics.writingStyle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Audience:</span>
                    <span className="font-medium capitalize">{analytics.targetAudience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Complexity:</span>
                    <span className="font-medium">{analytics.complexityScore}/100</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-neutral-600 dark:text-neutral-400">Quality Scores</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Readability:</span>
                    <span className={cn('font-medium', readability.color)}>{analytics.readabilityScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coherence:</span>
                    <span className="font-medium">{analytics.coherenceScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Engagement:</span>
                    <span className="font-medium">{analytics.engagementScore}/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Metrics */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Advanced Metrics</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Sentiment:</span>
                    <span className={cn(
                      'font-medium',
                      analytics.sentimentScore > 60 ? 'text-green-600' :
                      analytics.sentimentScore < 40 ? 'text-red-600' : 'text-yellow-600'
                    )}>
                      {analytics.sentimentScore > 60 ? 'Positive' :
                       analytics.sentimentScore < 40 ? 'Negative' : 'Neutral'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>SEO Score:</span>
                    <span className="font-medium">{analytics.seoScore}/100</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Avg Words/Sentence:</span>
                    <span className="font-medium">{analytics.averageWordsPerSentence}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paragraphs:</span>
                    <span className="font-medium">{analytics.paragraphs}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Most Used Words */}
            {analytics.mostUsedWords.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Most Used Words
                </h4>
                <div className="flex flex-wrap gap-1">
                  {analytics.mostUsedWords.slice(0, 6).map(({ word, count }) => (
                    <span key={word} className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-xs">
                      {word} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Suggestions */}
            {analytics.improvementSuggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  💡 Improvement Suggestions
                </h4>
                <div className="space-y-1 text-xs">
                  {analytics.improvementSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-neutral-600 dark:text-neutral-400">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Surface>
      )}
    </div>
  )
}

export default EnhancedWritingAnalytics