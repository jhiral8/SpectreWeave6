'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { Surface } from '@/components/ui/Surface'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { AnalyticsSkeleton } from '@/components/ui/LoadingSkeleton'

interface WritingAnalyticsProps {
  editor: Editor
  className?: string
}

interface AnalyticsData {
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
}

const READING_SPEED_WPM = 200 // Average reading speed in words per minute

export const WritingAnalytics: React.FC<WritingAnalyticsProps> = React.memo(({
  editor,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
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
    mostUsedWords: []
  })

  // Calculate analytics from editor content
  const calculateAnalytics = useMemo(() => {
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

    // Basic counts
    const characters = text.length
    const charactersNoSpaces = text.replace(/\s/g, '').length
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length
    const paragraphs = text.split(/\n\s*\n/).filter(para => para.trim().length > 0).length

    // Reading time (in minutes)
    const readingTime = Math.ceil(words / READING_SPEED_WPM)

    // Averages
    const averageWordsPerSentence = sentences > 0 ? Math.round(words / sentences) : 0
    const averageSentencesPerParagraph = paragraphs > 0 ? Math.round(sentences / paragraphs) : 0

    // Simple readability score (Flesch Reading Ease approximation)
    const averageSentenceLength = sentences > 0 ? words / sentences : 0
    const averageSyllablesPerWord = 1.5 // Approximation
    const readabilityScore = Math.max(0, Math.min(100, 
      206.835 - (1.015 * averageSentenceLength) - (84.6 * averageSyllablesPerWord)
    ))

    // Most used words (excluding common stop words)
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
      .slice(0, 5)
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
      setAnalytics(calculateAnalytics)
    }

    // Initial calculation
    updateAnalytics()

    // Listen for editor updates
    editor.on('update', updateAnalytics)
    editor.on('selectionUpdate', updateAnalytics)

    return () => {
      editor.off('update', updateAnalytics)
      editor.off('selectionUpdate', updateAnalytics)
    }
  }, [editor, calculateAnalytics])

  const getReadabilityLevel = useCallback((score: number) => {
    if (score >= 90) return { level: 'Very Easy', color: 'text-green-600' }
    if (score >= 80) return { level: 'Easy', color: 'text-green-500' }
    if (score >= 70) return { level: 'Fairly Easy', color: 'text-yellow-500' }
    if (score >= 60) return { level: 'Standard', color: 'text-orange-500' }
    if (score >= 50) return { level: 'Fairly Difficult', color: 'text-red-500' }
    if (score >= 30) return { level: 'Difficult', color: 'text-red-600' }
    return { level: 'Very Difficult', color: 'text-red-700' }
  }, [])

  const handleToggleExpanded = useCallback(() => {
    setIsAnimating(true)
    setIsExpanded(prev => !prev)
    
    // Reset animation state after transition
    setTimeout(() => setIsAnimating(false), 300)
  }, [])

  const readability = useMemo(() => 
    getReadabilityLevel(analytics.readabilityScore), 
    [analytics.readabilityScore, getReadabilityLevel]
  )

  // Keyboard shortcut for toggling analytics
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + W to toggle writing analytics
      if (event.altKey && event.key === 'w') {
        event.preventDefault()
        handleToggleExpanded()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleToggleExpanded])

  return (
    <ErrorBoundary
      fallback={
        <div className="text-xs text-red-600 dark:text-red-400 p-2">
          Analytics temporarily unavailable
        </div>
      }
    >
      <div className={cn('relative', className)}>
      {/* Condensed Stats - Template Style */}
      <div className="flex flex-col items-end text-xs text-neutral-500 dark:text-neutral-400 leading-tight" style={{ fontFamily: 'Surgena, sans-serif', fontWeight: 400 }}>
        <span>{analytics.words} words</span>
        <span>{analytics.characters} characters</span>
      </div>

      {/* Expanded Analytics Panel */}
      {isExpanded && (
        <Surface className={cn(
          "absolute bottom-full right-0 mb-2 w-80 max-w-[calc(100vw-2rem)] p-4 z-50 shadow-lg",
          "animate-in slide-in-from-bottom-2 fade-in-0 duration-300 ease-out",
          "max-h-[80vh] overflow-y-auto"
        )}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Writing Analytics</h3>
              <Button
                variant="ghost"
                buttonSize="iconSmall"
                onClick={() => setIsExpanded(false)}
                className="hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors duration-150"
              >
                <Icon name="X" className="text-neutral-500 hover:text-red-600 dark:hover:text-red-400 transition-colors" />
              </Button>
            </div>

            {/* Basic Stats Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Words:</span>
                  <span className="font-medium">{analytics.words.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Characters:</span>
                  <span className="font-medium">{analytics.characters.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">No spaces:</span>
                  <span className="font-medium">{analytics.charactersNoSpaces.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Sentences:</span>
                  <span className="font-medium">{analytics.sentences}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Paragraphs:</span>
                  <span className="font-medium">{analytics.paragraphs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Read time:</span>
                  <span className="font-medium">{analytics.readingTime} min</span>
                </div>
              </div>
            </div>

            {/* Readability Score */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Readability
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-sm">Score:</span>
                <span className={cn('text-sm font-medium', readability.color)}>
                  {analytics.readabilityScore} ({readability.level})
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analytics.readabilityScore}%` }}
                />
              </div>
            </div>

            {/* Average Stats */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Averages
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Words per sentence:</span>
                  <span className="font-medium">{analytics.averageWordsPerSentence}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Sentences per paragraph:</span>
                  <span className="font-medium">{analytics.averageSentencesPerParagraph}</span>
                </div>
              </div>
            </div>

            {/* Most Used Words */}
            {analytics.mostUsedWords.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Most Used Words
                </h4>
                <div className="space-y-1">
                  {analytics.mostUsedWords.map(({ word, count }, index) => (
                    <div key={word} className="flex justify-between text-sm">
                      <span className="capitalize">{word}</span>
                      <span className="text-neutral-600 dark:text-neutral-400">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Writing Tips */}
            <div className="space-y-2 p-3 bg-neutral-50 dark:bg-neutral-900 rounded">
              <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                💡 Writing Tips
              </h4>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                {analytics.averageWordsPerSentence > 25 && (
                  <p>• Consider shorter sentences for better readability</p>
                )}
                {analytics.readabilityScore < 50 && (
                  <p>• Text may be difficult to read - try simpler words</p>
                )}
                {analytics.paragraphs > 0 && analytics.sentences / analytics.paragraphs > 8 && (
                  <p>• Consider breaking up long paragraphs</p>
                )}
                {analytics.words > 0 && analytics.words < 100 && (
                  <p>• Add more content to improve SEO and engagement</p>
                )}
              </div>
            </div>
          </div>
        </Surface>
      )}
      
      {/* Keyboard shortcut help tooltip */}
      {isExpanded && (
        <div className="absolute bottom-2 right-2 text-xs text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded shadow-sm animate-in fade-in-0 duration-500 delay-1000">
          Alt + W to toggle
        </div>
      )}
      </div>
    </ErrorBoundary>
  )
})

// Display name for debugging
WritingAnalytics.displayName = 'WritingAnalytics'

export default WritingAnalytics