/**
 * Hook for using Web Workers in Editor Components
 * Provides an interface to offload heavy computations to background threads
 */
'use client'

import { useRef, useCallback, useEffect } from 'react'

interface WorkerMessage {
  id: string
  type: 'analyze' | 'statistics' | 'search' | 'format'
  data: any
}

interface WorkerResponse {
  id: string
  type: 'success' | 'error'
  data: any
}

interface AnalysisResult {
  characterCount: number
  characterCountWithoutSpaces: number
  wordCount: number
  sentenceCount: number
  paragraphCount: number
  averageWordsPerSentence: number
  averageSentencesPerParagraph: number
  readingTime: number
  readabilityScore: number
}

interface SearchResult {
  position: number
  length: number
  context: string
  score?: number
}

export const useEditorWorker = () => {
  const workerRef = useRef<Worker | null>(null)
  const pendingRequests = useRef<Map<string, {
    resolve: (value: any) => void
    reject: (error: Error) => void
  }>>(new Map())

  // Initialize worker
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      // Create worker from inline script to avoid file path issues
      const workerScript = `
        ${workerCode}
      `
      
      const blob = new Blob([workerScript], { type: 'application/javascript' })
      const workerUrl = URL.createObjectURL(blob)
      workerRef.current = new Worker(workerUrl)

      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, type, data } = event.data
        const request = pendingRequests.current.get(id)
        
        if (request) {
          pendingRequests.current.delete(id)
          
          if (type === 'success') {
            request.resolve(data)
          } else {
            request.reject(new Error(data.message || 'Worker error'))
          }
        }
      }

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error)
        // Reject all pending requests
        pendingRequests.current.forEach(({ reject }) => {
          reject(new Error('Worker error'))
        })
        pendingRequests.current.clear()
      }

      return () => {
        if (workerRef.current) {
          workerRef.current.terminate()
          URL.revokeObjectURL(workerUrl)
        }
        pendingRequests.current.clear()
      }
    } catch (error) {
      console.warn('Web Worker not supported:', error)
    }
  }, [])

  // Send message to worker
  const sendMessage = useCallback((type: WorkerMessage['type'], data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not available'))
        return
      }

      const id = Math.random().toString(36).substring(2, 15)
      
      pendingRequests.current.set(id, { resolve, reject })
      
      workerRef.current.postMessage({ id, type, data })
      
      // Timeout after 30 seconds
      setTimeout(() => {
        const request = pendingRequests.current.get(id)
        if (request) {
          pendingRequests.current.delete(id)
          request.reject(new Error('Worker timeout'))
        }
      }, 30000)
    })
  }, [])

  // Analyze text
  const analyzeText = useCallback(async (text: string): Promise<AnalysisResult> => {
    try {
      return await sendMessage('analyze', { text })
    } catch (error) {
      console.error('Text analysis failed:', error)
      // Fallback to simple analysis
      return fallbackAnalyze(text)
    }
  }, [sendMessage])

  // Get text statistics
  const getStatistics = useCallback(async (text: string): Promise<AnalysisResult> => {
    try {
      return await sendMessage('statistics', { text })
    } catch (error) {
      console.error('Statistics calculation failed:', error)
      return fallbackAnalyze(text)
    }
  }, [sendMessage])

  // Search text with options
  const searchText = useCallback(async (
    content: string, 
    query: string, 
    options: {
      caseSensitive?: boolean
      wholeWords?: boolean
      fuzzy?: boolean
      fuzzyThreshold?: number
    } = {}
  ): Promise<SearchResult[]> => {
    try {
      return await sendMessage('search', { content, query, options })
    } catch (error) {
      console.error('Search failed:', error)
      return fallbackSearch(content, query, options)
    }
  }, [sendMessage])

  // Format text
  const formatText = useCallback(async (
    text: string,
    options: {
      removeExtraSpaces?: boolean
      fixPunctuation?: boolean
      capitalizeFirstLetter?: boolean
      fixQuotes?: boolean
    } = {}
  ): Promise<string> => {
    try {
      return await sendMessage('format', { text, options })
    } catch (error) {
      console.error('Text formatting failed:', error)
      return text // Return original text on error
    }
  }, [sendMessage])

  return {
    analyzeText,
    getStatistics,
    searchText,
    formatText,
    isWorkerAvailable: !!workerRef.current
  }
}

// Fallback functions for when worker fails
function fallbackAnalyze(text: string): AnalysisResult {
  const words = text.split(/\s+/).filter(word => word.length > 0)
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0)
  const paragraphs = text.split(/\n\s*\n/).filter(para => para.trim().length > 0)
  
  return {
    characterCount: text.length,
    characterCountWithoutSpaces: text.replace(/\s/g, '').length,
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    averageWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
    averageSentencesPerParagraph: paragraphs.length > 0 ? sentences.length / paragraphs.length : 0,
    readingTime: Math.ceil(words.length / 200),
    readabilityScore: 75 // Default score
  }
}

function fallbackSearch(content: string, query: string, options: any): SearchResult[] {
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), options.caseSensitive ? 'g' : 'gi')
  const results: SearchResult[] = []
  
  let match
  while ((match = regex.exec(content)) !== null) {
    results.push({
      position: match.index,
      length: match[0].length,
      context: content.slice(Math.max(0, match.index - 50), match.index + match[0].length + 50)
    })
  }
  
  return results
}

// Worker code as string (to be inlined)
const workerCode = `
// Text analysis functions
function analyzeText(text) {
  const words = text.split(/\\s+/).filter(word => word.length > 0)
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0)
  const paragraphs = text.split(/\\n\\s*\\n/).filter(para => para.trim().length > 0)
  
  return {
    characterCount: text.length,
    characterCountWithoutSpaces: text.replace(/\\s/g, '').length,
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    averageWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
    averageSentencesPerParagraph: paragraphs.length > 0 ? sentences.length / paragraphs.length : 0,
    readingTime: Math.ceil(words.length / 200),
    readabilityScore: calculateReadabilityScore(text, words, sentences)
  }
}

function calculateReadabilityScore(text, words, sentences) {
  if (sentences.length === 0 || words.length === 0) return 0
  
  const avgWordsPerSentence = words.length / sentences.length
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0)
  const avgSyllablesPerWord = syllables / words.length
  
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
  return Math.max(0, Math.min(100, Math.round(score)))
}

function countSyllables(word) {
  word = word.toLowerCase()
  let syllableCount = 0
  let previousWasVowel = false
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = 'aeiouy'.includes(word[i])
    if (isVowel && !previousWasVowel) {
      syllableCount++
    }
    previousWasVowel = isVowel
  }
  
  if (word.endsWith('e') && syllableCount > 1) {
    syllableCount--
  }
  
  return Math.max(1, syllableCount)
}

// Message handler
self.onmessage = function(event) {
  const { id, type, data } = event.data
  
  try {
    let result
    
    switch (type) {
      case 'analyze':
      case 'statistics':
        result = analyzeText(data.text)
        break
        
      case 'search':
        // Simple search fallback
        const regex = new RegExp(data.query, data.options?.caseSensitive ? 'g' : 'gi')
        const results = []
        let match
        while ((match = regex.exec(data.content)) !== null) {
          results.push({
            position: match.index,
            length: match[0].length,
            context: data.content.slice(Math.max(0, match.index - 50), match.index + match[0].length + 50)
          })
        }
        result = results
        break
        
      case 'format':
        result = data.text // Simple fallback
        break
        
      default:
        throw new Error(\`Unknown message type: \${type}\`)
    }
    
    self.postMessage({
      id,
      type: 'success',
      data: result
    })
  } catch (error) {
    self.postMessage({
      id,
      type: 'error',
      data: {
        message: error.message || 'Unknown error'
      }
    })
  }
}
`

export default useEditorWorker