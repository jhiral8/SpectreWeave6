/**
 * Dual Surface AI Hook for SpectreWeave5
 * 
 * React hook that provides AI functionality aware of dual writing surfaces:
 * - Manuscript surface (primary writing)
 * - Framework surface (story planning)
 * 
 * Features:
 * - Surface-aware context management
 * - Cross-surface intelligence
 * - Performance-optimized AI requests
 * - Smart caching and debouncing
 */

'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Editor } from '@tiptap/react'

import { 
  dualSurfaceContextManager,
  DualSurfaceAIContext,
  WritingSurface,
  FrameworkCategory,
  ContextFusionConfig
} from '../lib/ai/dualSurfaceContextManager'

import {
  surfaceAwarePromptEngine,
  EnhancedPromptRequest,
  EnhancedPromptResponse
} from '../lib/ai/surfaceAwarePromptEngine'

import { useAI } from './useAI'
import { useAdvancedAI } from '../lib/ai/advancedAIContext'
import { AIProvider, AIGenerationOptions, SmartSuggestion } from '../lib/ai/types'

// Hook configuration
export interface DualSurfaceAIConfig {
  manuscriptEditor?: Editor
  frameworkEditor?: Editor
  activeSurface: WritingSurface
  fusionConfig?: Partial<ContextFusionConfig>
  provider?: AIProvider
  enableSmartSuggestions?: boolean
  enableCrossSurfaceContext?: boolean
  debounceMs?: number
  cacheEnabled?: boolean
}

// Hook return interface
export interface DualSurfaceAIReturn {
  // Context state
  currentContext: DualSurfaceAIContext | null
  isContextLoading: boolean
  contextError: string | null
  
  // AI generation
  generateText: (prompt: string, options?: AIGenerationOptions) => Promise<string>
  generateSurfaceAwareText: (prompt: string, options?: SurfaceAwareGenerationOptions) => Promise<string>
  streamText: (prompt: string, onChunk: (chunk: string) => void, options?: AIGenerationOptions) => Promise<void>
  
  // Smart suggestions
  suggestions: SmartSuggestion[]
  generateSuggestions: (forceRefresh?: boolean) => Promise<SmartSuggestion[]>
  acceptSuggestion: (suggestionId: string) => void
  dismissSuggestion: (suggestionId: string) => void
  clearSuggestions: () => void
  
  // Surface management
  switchSurface: (surface: WritingSurface) => void
  updateFusionConfig: (config: Partial<ContextFusionConfig>) => void
  
  // Cross-surface operations
  syncContextBetweenSurfaces: () => Promise<void>
  getRelevantFrameworkElements: (query: string) => Promise<any[]>
  
  // Performance and debugging
  getPerformanceMetrics: () => any
  debugContext: () => DualSurfaceAIContext | null
  
  // State
  isGenerating: boolean
  error: string | null
}

// Surface-aware generation options
export interface SurfaceAwareGenerationOptions extends AIGenerationOptions {
  useFrameworkContext?: boolean
  frameworkWeight?: number
  adaptPrompt?: boolean
  includeRelevantElements?: boolean
  frameworkCategories?: FrameworkCategory[]
}

// Internal hook state
interface HookState {
  currentContext: DualSurfaceAIContext | null
  isContextLoading: boolean
  contextError: string | null
  suggestions: SmartSuggestion[]
  isGenerating: boolean
  error: string | null
  lastContextUpdate: number
  cachedContexts: Map<string, DualSurfaceAIContext>
}

/**
 * Main dual surface AI hook
 */
function useDualSurfaceAI(config: DualSurfaceAIConfig): DualSurfaceAIReturn {
  const {
    manuscriptEditor,
    frameworkEditor,
    activeSurface,
    fusionConfig,
    provider = 'gemini',
    enableSmartSuggestions = true,
    enableCrossSurfaceContext = true,
    debounceMs = 500,
    cacheEnabled = true
  } = config

  // Internal state
  const [state, setState] = useState<HookState>({
    currentContext: null,
    isContextLoading: false,
    contextError: null,
    suggestions: [],
    isGenerating: false,
    error: null,
    lastContextUpdate: 0,
    cachedContexts: new Map()
  })

  // Dependencies
  const { generateText: baseGenerateText, generateStream } = useAI({ provider })
  const advancedAI = useAdvancedAI()
  
  // Refs for debouncing and caching
  const contextUpdateTimer = useRef<NodeJS.Timeout>()
  const suggestionTimer = useRef<NodeJS.Timeout>()
  const lastPromptCache = useRef<Map<string, EnhancedPromptResponse>>(new Map())

  // Initialize dual surface context manager
  useEffect(() => {
    if (manuscriptEditor && frameworkEditor) {
      dualSurfaceContextManager.registerEditors(manuscriptEditor, frameworkEditor)
      
      if (fusionConfig) {
        dualSurfaceContextManager.updateFusionConfig(fusionConfig)
      }
    }
  }, [manuscriptEditor, frameworkEditor, fusionConfig])

  /**
   * Generate cache key for context caching
   */
  const generateContextCacheKey = useCallback((surface: WritingSurface): string => {
    const manuscriptPos = manuscriptEditor?.state.selection.from || 0
    const frameworkHash = frameworkEditor?.getHTML().slice(0, 100) || ''
    return `${surface}-${manuscriptPos}-${frameworkHash.length}`
  }, [manuscriptEditor, frameworkEditor])

  /**
   * Extract current dual surface context
   */
  const extractContext = useCallback(async (
    surface: WritingSurface = activeSurface,
    forceRefresh = false
  ): Promise<DualSurfaceAIContext> => {
    setState(prev => ({ ...prev, isContextLoading: true, contextError: null }))

    try {
      // Check cache first
      if (cacheEnabled && !forceRefresh) {
        const cacheKey = generateContextCacheKey(surface)
        const cached = state.cachedContexts.get(cacheKey)
        if (cached && Date.now() - state.lastContextUpdate < 30000) { // 30 second cache
          setState(prev => ({ ...prev, isContextLoading: false, currentContext: cached }))
          return cached
        }
      }

      // Extract fresh context
      const context = await dualSurfaceContextManager.extractDualSurfaceContext(
        surface,
        {
          includeFramework: enableCrossSurfaceContext,
          maxTokens: surface === 'manuscript' ? 4000 : 6000
        }
      )

      // Update state and cache
      setState(prev => ({
        ...prev,
        currentContext: context,
        isContextLoading: false,
        lastContextUpdate: Date.now(),
        cachedContexts: cacheEnabled ? 
          new Map(prev.cachedContexts).set(generateContextCacheKey(surface), context) :
          prev.cachedContexts
      }))

      return context
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to extract context'
      setState(prev => ({
        ...prev,
        isContextLoading: false,
        contextError: errorMessage
      }))
      throw new Error(errorMessage)
    }
  }, [activeSurface, enableCrossSurfaceContext, cacheEnabled, generateContextCacheKey, state.cachedContexts, state.lastContextUpdate])

  /**
   * Debounced context extraction
   */
  const debouncedContextExtraction = useCallback((surface: WritingSurface = activeSurface) => {
    if (contextUpdateTimer.current) {
      clearTimeout(contextUpdateTimer.current)
    }

    contextUpdateTimer.current = setTimeout(() => {
      extractContext(surface, false).catch(console.error)
    }, debounceMs)
  }, [extractContext, debounceMs, activeSurface])

  /**
   * Basic text generation
   */
  const generateText = useCallback(async (
    prompt: string,
    options?: AIGenerationOptions
  ): Promise<string> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      const response = await baseGenerateText(prompt, {
        provider,
        ...options
      })

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Generation failed')
      }

      setState(prev => ({ ...prev, isGenerating: false }))
      return response.data
    } catch (error: any) {
      const errorMessage = error.message || 'Text generation failed'
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage
      }))
      throw new Error(errorMessage)
    }
  }, [baseGenerateText, provider])

  /**
   * Surface-aware text generation
   */
  const generateSurfaceAwareText = useCallback(async (
    prompt: string,
    options?: SurfaceAwareGenerationOptions
  ): Promise<string> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      // Get current context
      const context = await extractContext(activeSurface, false)

      // Generate enhanced prompt
      const enhancedPromptRequest: EnhancedPromptRequest = {
        originalPrompt: prompt,
        surface: activeSurface,
        context,
        options: {
          provider,
          adaptationLevel: options?.adaptPrompt ? 'maximum' : 'standard',
          includeFramework: options?.useFrameworkContext ?? enableCrossSurfaceContext,
          customVariables: {
            frameworkWeight: options?.frameworkWeight,
            categories: options?.frameworkCategories
          }
        }
      }

      const enhancedResponse = await surfaceAwarePromptEngine.enhancePrompt(enhancedPromptRequest)
      
      // Cache the enhanced prompt
      if (cacheEnabled) {
        lastPromptCache.current.set(prompt.slice(0, 50), enhancedResponse)
      }

      // Generate with enhanced prompt
      const result = await generateText(enhancedResponse.enhancedPrompt, {
        ...options,
        provider: enhancedResponse.metadata.provider
      })

      setState(prev => ({ ...prev, isGenerating: false }))
      return result
    } catch (error: any) {
      const errorMessage = error.message || 'Surface-aware generation failed'
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage
      }))
      throw new Error(errorMessage)
    }
  }, [extractContext, activeSurface, enableCrossSurfaceContext, generateText, provider, cacheEnabled])

  /**
   * Stream text generation
   */
  const streamText = useCallback(async (
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: AIGenerationOptions
  ): Promise<void> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      const context = await extractContext(activeSurface, false)
      
      // For streaming, we'll use the advanced AI context if available
      if (advancedAI.generateStream) {
        await advancedAI.generateStream(prompt, options, onChunk)
      } else {
        // Fallback to basic streaming
        const response = await generateStream({
          id: `stream-${Date.now()}`,
          type: 'generation',
          prompt,
          provider,
          options: { ...options, stream: true },
          timestamp: new Date()
        })

        // Since generateStream returns a StreamResponse, we need to handle it appropriately
        // This is a simplified implementation
        onChunk(response.content || '')
      }

      setState(prev => ({ ...prev, isGenerating: false }))
    } catch (error: any) {
      const errorMessage = error.message || 'Stream generation failed'
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage
      }))
      throw new Error(errorMessage)
    }
  }, [extractContext, activeSurface, advancedAI, generateStream, provider])

  /**
   * Generate smart suggestions
   */
  const generateSuggestions = useCallback(async (forceRefresh = false): Promise<SmartSuggestion[]> => {
    if (!enableSmartSuggestions) return []

    try {
      const context = await extractContext(activeSurface, false)
      
      // Generate surface-specific suggestions
      const suggestions = await dualSurfaceContextManager.generateSurfaceSmartSuggestions(
        context,
        (prompt, opts) => generateText(prompt, opts).then(result => ({ 
          success: true, 
          data: result, 
          provider, 
          model: 'unknown',
          usage: undefined
        }))
      )

      setState(prev => ({ ...prev, suggestions }))
      return suggestions
    } catch (error) {
      console.error('Suggestion generation failed:', error)
      return []
    }
  }, [enableSmartSuggestions, extractContext, activeSurface, generateText, provider])

  /**
   * Debounced suggestion generation
   */
  const debouncedSuggestionGeneration = useCallback(() => {
    if (!enableSmartSuggestions) return

    if (suggestionTimer.current) {
      clearTimeout(suggestionTimer.current)
    }

    suggestionTimer.current = setTimeout(() => {
      generateSuggestions(false).catch(console.error)
    }, debounceMs * 2) // Longer debounce for suggestions
  }, [generateSuggestions, debounceMs, enableSmartSuggestions])

  /**
   * Accept a suggestion
   */
  const acceptSuggestion = useCallback((suggestionId: string) => {
    const suggestion = state.suggestions.find(s => s.id === suggestionId)
    if (!suggestion) return

    const editor = activeSurface === 'manuscript' ? manuscriptEditor : frameworkEditor
    if (!editor) return

    // Apply the suggestion to the editor
    const { position, text, type } = suggestion
    
    if (type === 'completion') {
      editor.chain().focus().insertContentAt(position, text).run()
    } else if (type === 'replacement') {
      // For replacements, we need the selection range
      const range = suggestion.range || { from: position, to: position }
      editor.chain().focus().deleteRange(range).insertContent(text).run()
    }

    // Remove the accepted suggestion
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId)
    }))

    // Track acceptance for analytics
    console.log('Suggestion accepted:', { type, text, surface: activeSurface })
  }, [state.suggestions, activeSurface, manuscriptEditor, frameworkEditor])

  /**
   * Dismiss a suggestion
   */
  const dismissSuggestion = useCallback((suggestionId: string) => {
    setState(prev => ({
      ...prev,
      suggestions: prev.suggestions.filter(s => s.id !== suggestionId)
    }))
  }, [])

  /**
   * Clear all suggestions
   */
  const clearSuggestions = useCallback(() => {
    setState(prev => ({ ...prev, suggestions: [] }))
  }, [])

  /**
   * Switch active surface
   */
  const switchSurface = useCallback((surface: WritingSurface) => {
    if (surface !== activeSurface) {
      // Extract context for new surface
      debouncedContextExtraction(surface)
      
      // Clear suggestions when switching surfaces
      clearSuggestions()
    }
  }, [activeSurface, debouncedContextExtraction, clearSuggestions])

  /**
   * Update fusion configuration
   */
  const updateFusionConfig = useCallback((config: Partial<ContextFusionConfig>) => {
    dualSurfaceContextManager.updateFusionConfig(config)
    
    // Force context refresh
    extractContext(activeSurface, true).catch(console.error)
  }, [extractContext, activeSurface])

  /**
   * Sync context between surfaces
   */
  const syncContextBetweenSurfaces = useCallback(async (): Promise<void> => {
    try {
      // Extract context for both surfaces
      await Promise.all([
        extractContext('manuscript', true),
        extractContext('framework', true)
      ])
    } catch (error) {
      console.error('Context sync failed:', error)
    }
  }, [extractContext])

  /**
   * Get relevant framework elements
   */
  const getRelevantFrameworkElements = useCallback(async (query: string): Promise<any[]> => {
    try {
      if (advancedAI.searchRelevantContext) {
        const results = await advancedAI.searchRelevantContext(query, {
          categories: ['character', 'plot', 'world'],
          limit: 10,
          threshold: 0.3
        })
        return results
      }
      return []
    } catch (error) {
      console.error('Framework element search failed:', error)
      return []
    }
  }, [advancedAI])

  /**
   * Get performance metrics
   */
  const getPerformanceMetrics = useCallback(() => {
    return {
      contextManager: dualSurfaceContextManager.getPerformanceMetrics(),
      promptEngine: surfaceAwarePromptEngine.getPerformanceMetrics(),
      cacheHitRate: state.cachedContexts.size > 0 ? 0.7 : 0, // Simplified metric
      suggestionAccuracy: 0.8 // Placeholder
    }
  }, [state.cachedContexts.size])

  /**
   * Debug context (development helper)
   */
  const debugContext = useCallback((): DualSurfaceAIContext | null => {
    if (process.env.NODE_ENV === 'development') {
      return state.currentContext
    }
    return null
  }, [state.currentContext])

  // Effect: Auto-extract context when editors change
  useEffect(() => {
    if (manuscriptEditor || frameworkEditor) {
      debouncedContextExtraction(activeSurface)
    }
  }, [manuscriptEditor, frameworkEditor, activeSurface, debouncedContextExtraction])

  // Effect: Listen to editor updates for context refresh
  useEffect(() => {
    const editor = activeSurface === 'manuscript' ? manuscriptEditor : frameworkEditor
    if (!editor) return

    const handleUpdate = () => {
      debouncedContextExtraction(activeSurface)
      if (enableSmartSuggestions) {
        debouncedSuggestionGeneration()
      }
    }

    const handleSelection = () => {
      // Clear suggestions on significant cursor movement
      const context = state.currentContext
      if (context) {
        const currentPos = editor.state.selection.from
        const lastPos = context.manuscriptContext.cursorPosition
        if (Math.abs(currentPos - lastPos) > 100) {
          clearSuggestions()
        }
      }
    }

    editor.on('update', handleUpdate)
    editor.on('selectionUpdate', handleSelection)

    return () => {
      editor.off('update', handleUpdate)
      editor.off('selectionUpdate', handleSelection)
    }
  }, [
    activeSurface, 
    manuscriptEditor, 
    frameworkEditor, 
    debouncedContextExtraction, 
    debouncedSuggestionGeneration, 
    enableSmartSuggestions,
    state.currentContext,
    clearSuggestions
  ])

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (contextUpdateTimer.current) {
        clearTimeout(contextUpdateTimer.current)
      }
      if (suggestionTimer.current) {
        clearTimeout(suggestionTimer.current)
      }
    }
  }, [])

  // Memoized return value for performance
  return useMemo(() => ({
    // Context state
    currentContext: state.currentContext,
    isContextLoading: state.isContextLoading,
    contextError: state.contextError,
    
    // AI generation
    generateText,
    generateSurfaceAwareText,
    streamText,
    
    // Smart suggestions
    suggestions: state.suggestions,
    generateSuggestions,
    acceptSuggestion,
    dismissSuggestion,
    clearSuggestions,
    
    // Surface management
    switchSurface,
    updateFusionConfig,
    
    // Cross-surface operations
    syncContextBetweenSurfaces,
    getRelevantFrameworkElements,
    
    // Performance and debugging
    getPerformanceMetrics,
    debugContext,
    
    // State
    isGenerating: state.isGenerating,
    error: state.error
  }), [
    state,
    generateText,
    generateSurfaceAwareText,
    streamText,
    generateSuggestions,
    acceptSuggestion,
    dismissSuggestion,
    clearSuggestions,
    switchSurface,
    updateFusionConfig,
    syncContextBetweenSurfaces,
    getRelevantFrameworkElements,
    getPerformanceMetrics,
    debugContext
  ])
}

export default useDualSurfaceAI