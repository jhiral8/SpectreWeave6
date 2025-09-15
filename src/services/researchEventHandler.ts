'use client'

import { deepResearchService } from './deepResearchService'

interface ResearchEventDetail {
  researchId: string
  researchData: any
  context?: {
    topic: string
    description: string
    existingFindings: any[]
    queries: any[]
  }
  query?: string
  queryId?: string
}

export class ResearchEventHandler {
  private isInitialized: boolean = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    if (typeof window === 'undefined' || this.isInitialized) return

    // Listen for AI suggestion requests
    window.addEventListener('research-ai-suggestion-request', this.handleAISuggestionRequest.bind(this))
    
    // Listen for web search requests  
    window.addEventListener('research-web-search-request', this.handleWebSearchRequest.bind(this))

    this.isInitialized = true
  }

  private async handleAISuggestionRequest(event: CustomEvent<ResearchEventDetail>) {
    const { researchId, researchData, context } = event.detail
    
    try {
      console.log('🔍 Processing AI suggestion request for research:', researchId, { researchData, context })
      
      const topic = context?.topic || researchData?.topic || 'Research Topic'
      const description = context?.description || researchData?.description || ''

      console.log('📋 Research query details:', { topic, description })

      // Use the deep research service to generate suggestions
      const researchQuery = {
        topic,
        context: description,
        depth: 'basic' as const,
        sources: 'both' as const,
        maxResults: 5
      }

      const result = await deepResearchService.conductResearch(researchQuery)
      
      // Convert research findings to suggestions
      const suggestions = [
        `Research recent developments in "${topic}"`,
        `Find academic papers about ${topic}`,
        `Look for case studies related to ${topic}`,
        ...result.keyFindings.slice(0, 2).map(finding => `Investigate: ${finding}`)
      ]

      // Dispatch update event back to the research block
      const updateEvent = new CustomEvent('research-ai-suggestion-response', {
        detail: {
          researchId,
          suggestions,
          findings: result.keyFindings,
          sources: result.sources.slice(0, 3)
        }
      })
      
      console.log('📤 Dispatching AI suggestion response event:', updateEvent.detail)
      window.dispatchEvent(updateEvent)
      
    } catch (error) {
      console.error('AI suggestion request failed:', error)
      
      // Send error event
      const errorEvent = new CustomEvent('research-ai-suggestion-error', {
        detail: {
          researchId,
          error: error instanceof Error ? error.message : 'AI suggestion failed'
        }
      })
      
      window.dispatchEvent(errorEvent)
    }
  }

  private async handleWebSearchRequest(event: CustomEvent<ResearchEventDetail>) {
    const { researchId, query, queryId, researchData } = event.detail
    
    try {
      console.log('🔍 Processing web search request for:', query, { researchId, queryId, researchData })
      
      if (!query) {
        throw new Error('No search query provided')
      }

      // Use the deep research service to perform search
      const researchQuery = {
        topic: query,
        context: researchData?.description || '',
        depth: 'comprehensive' as const,
        sources: 'web' as const,
        maxResults: 5
      }

      const result = await deepResearchService.conductResearch(researchQuery)
      
      // Convert results to research findings format
      const findings = result.sources.map(source => ({
        id: `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: source.title,
        content: source.snippet,
        source: source.url,
        url: source.url,
        relevance: source.relevance,
        timestamp: new Date().toISOString(),
        verified: false,
        tags: [source.type],
        notes: ''
      }))

      // Dispatch search results back to the research block
      const resultsEvent = new CustomEvent('research-web-search-response', {
        detail: {
          researchId,
          queryId,
          query,
          findings,
          summary: result.summary
        }
      })
      
      console.log('📤 Dispatching web search response event:', resultsEvent.detail)
      window.dispatchEvent(resultsEvent)
      
    } catch (error) {
      console.error('Web search request failed:', error)
      
      // Send error event
      const errorEvent = new CustomEvent('research-web-search-error', {
        detail: {
          researchId,
          queryId,
          query,
          error: error instanceof Error ? error.message : 'Web search failed'
        }
      })
      
      window.dispatchEvent(errorEvent)
    }
  }

  public destroy() {
    if (typeof window === 'undefined' || !this.isInitialized) return

    window.removeEventListener('research-ai-suggestion-request', this.handleAISuggestionRequest.bind(this))
    window.removeEventListener('research-web-search-request', this.handleWebSearchRequest.bind(this))
    
    this.isInitialized = false
  }
}

// Create singleton instance
export const researchEventHandler = new ResearchEventHandler()