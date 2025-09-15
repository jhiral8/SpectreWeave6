/**
 * Web Worker for Editor Heavy Computations
 * Handles analytics, statistics, and other CPU-intensive tasks off the main thread
 */

// Define message types
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

// Text analysis functions
function analyzeText(text: string) {
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
    readingTime: Math.ceil(words.length / 200), // Assuming 200 WPM reading speed
    readabilityScore: calculateReadabilityScore(text, words, sentences)
  }
}

function calculateReadabilityScore(text: string, words: string[], sentences: any[]) {
  if (sentences.length === 0 || words.length === 0) return 0
  
  // Simple Flesch Reading Ease approximation
  const avgWordsPerSentence = words.length / sentences.length
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0)
  const avgSyllablesPerWord = syllables / words.length
  
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
  return Math.max(0, Math.min(100, Math.round(score)))
}

function countSyllables(word: string): number {
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
  
  // Handle silent 'e'
  if (word.endsWith('e') && syllableCount > 1) {
    syllableCount--
  }
  
  return Math.max(1, syllableCount)
}

// Advanced search with fuzzy matching
function performAdvancedSearch(content: string, query: string, options: {
  caseSensitive?: boolean
  wholeWords?: boolean
  fuzzy?: boolean
  fuzzyThreshold?: number
}) {
  const { caseSensitive = false, wholeWords = false, fuzzy = false, fuzzyThreshold = 0.8 } = options
  
  let searchText = caseSensitive ? content : content.toLowerCase()
  let searchQuery = caseSensitive ? query : query.toLowerCase()
  
  const results: Array<{
    position: number
    length: number
    context: string
    score?: number
  }> = []
  
  if (!fuzzy) {
    // Exact matching
    const regex = wholeWords 
      ? new RegExp(`\\b${escapeRegExp(searchQuery)}\\b`, caseSensitive ? 'g' : 'gi')
      : new RegExp(escapeRegExp(searchQuery), caseSensitive ? 'g' : 'gi')
    
    let match
    while ((match = regex.exec(searchText)) !== null) {
      const contextStart = Math.max(0, match.index - 50)
      const contextEnd = Math.min(content.length, match.index + match[0].length + 50)
      const context = content.slice(contextStart, contextEnd)
      
      results.push({
        position: match.index,
        length: match[0].length,
        context: context
      })
    }
  } else {
    // Fuzzy matching
    const words = searchText.split(/\s+/)
    const queryWords = searchQuery.split(/\s+/)
    
    words.forEach((word, index) => {
      queryWords.forEach(queryWord => {
        const similarity = calculateSimilarity(word, queryWord)
        if (similarity >= fuzzyThreshold) {
          const position = searchText.indexOf(word, index > 0 ? words.slice(0, index).join(' ').length + index : 0)
          if (position !== -1) {
            const contextStart = Math.max(0, position - 50)
            const contextEnd = Math.min(content.length, position + word.length + 50)
            const context = content.slice(contextStart, contextEnd)
            
            results.push({
              position,
              length: word.length,
              context,
              score: similarity
            })
          }
        }
      })
    })
    
    // Sort by similarity score
    results.sort((a, b) => (b.score || 0) - (a.score || 0))
  }
  
  return results
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function calculateSimilarity(str1: string, str2: string): number {
  const matrix: number[][] = []
  const len1 = str1.length
  const len2 = str2.length
  
  if (len1 === 0) return len2
  if (len2 === 0) return len1
  
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  const maxLen = Math.max(len1, len2)
  return maxLen > 0 ? (maxLen - matrix[len2][len1]) / maxLen : 1
}

// Format text with various options
function formatText(text: string, options: {
  removeExtraSpaces?: boolean
  fixPunctuation?: boolean
  capitalizeFirstLetter?: boolean
  fixQuotes?: boolean
}) {
  let result = text
  
  if (options.removeExtraSpaces) {
    result = result.replace(/\s+/g, ' ').trim()
  }
  
  if (options.fixPunctuation) {
    // Fix spacing around punctuation
    result = result.replace(/\s+([,.!?;:])/g, '$1')
    result = result.replace(/([.!?])\s*([A-Z])/g, '$1 $2')
  }
  
  if (options.capitalizeFirstLetter) {
    result = result.replace(/^\w/, (match) => match.toUpperCase())
    result = result.replace(/([.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase())
  }
  
  if (options.fixQuotes) {
    // Convert straight quotes to smart quotes
    result = result.replace(/"/g, '\u201C').replace(/"/g, '\u201D')
    result = result.replace(/'/g, '\u2018').replace(/'/g, '\u2019')
  }
  
  return result
}

// Message handler
self.onmessage = function(event: MessageEvent<WorkerMessage>) {
  const { id, type, data } = event.data
  
  try {
    let result: any
    
    switch (type) {
      case 'analyze':
        result = analyzeText(data.text)
        break
        
      case 'statistics':
        result = analyzeText(data.text)
        break
        
      case 'search':
        result = performAdvancedSearch(data.content, data.query, data.options || {})
        break
        
      case 'format':
        result = formatText(data.text, data.options || {})
        break
        
      default:
        throw new Error(`Unknown message type: ${type}`)
    }
    
    const response: WorkerResponse = {
      id,
      type: 'success',
      data: result
    }
    
    self.postMessage(response)
  } catch (error) {
    const response: WorkerResponse = {
      id,
      type: 'error',
      data: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }
    
    self.postMessage(response)
  }
}

// Export for TypeScript
export {};