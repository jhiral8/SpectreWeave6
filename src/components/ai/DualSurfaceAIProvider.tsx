/**
 * Dual Surface AI Provider Component
 * 
 * React context provider that manages AI functionality for dual writing surfaces.
 * Provides seamless AI assistance that understands both manuscript content and
 * story framework elements.
 */

'use client'

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  ReactNode,
  useMemo
} from 'react'
import { Editor } from '@tiptap/react'

import { 
  DualSurfaceAIConfig,
  DualSurfaceAIReturn,
  useDualSurfaceAI
} from '../../hooks/useDualSurfaceAI'

import {
  WritingSurface,
  FrameworkCategory,
  ContextFusionConfig,
  DEFAULT_FUSION_CONFIG
} from '../../lib/ai/dualSurfaceContextManager'

import { AIProvider } from '../../lib/ai/types'

// Context interface
export interface DualSurfaceAIContextType extends DualSurfaceAIReturn {
  // Editor management
  manuscriptEditor: Editor | null
  frameworkEditor: Editor | null
  registerManuscriptEditor: (editor: Editor) => void
  registerFrameworkEditor: (editor: Editor) => void
  
  // Surface state
  activeSurface: WritingSurface
  setActiveSurface: (surface: WritingSurface) => void
  
  // Configuration
  config: DualSurfaceAIConfig
  updateConfig: (updates: Partial<DualSurfaceAIConfig>) => void
  
  // Framework category management
  activeFrameworkCategory: FrameworkCategory
  setActiveFrameworkCategory: (category: FrameworkCategory) => void
  
  // Quick actions
  enhanceSelection: () => Promise<void>
  generateFromFramework: (category: FrameworkCategory, prompt: string) => Promise<string>
  analyzeManuscriptWithFramework: () => Promise<any>
}

// Provider props
export interface DualSurfaceAIProviderProps {
  children: ReactNode
  defaultSurface?: WritingSurface
  defaultProvider?: AIProvider
  fusionConfig?: Partial<ContextFusionConfig>
  enableSmartSuggestions?: boolean
  enableCrossSurfaceContext?: boolean
  debounceMs?: number
  cacheEnabled?: boolean
}

// Internal provider state
interface ProviderState {
  manuscriptEditor: Editor | null
  frameworkEditor: Editor | null
  activeSurface: WritingSurface
  activeFrameworkCategory: FrameworkCategory
  config: DualSurfaceAIConfig
}

// Create context
const DualSurfaceAIContext = createContext<DualSurfaceAIContextType | undefined>(undefined)

/**
 * Dual Surface AI Provider Component
 */
export function DualSurfaceAIProvider({
  children,
  defaultSurface = 'manuscript',
  defaultProvider = 'gemini',
  fusionConfig,
  enableSmartSuggestions = true,
  enableCrossSurfaceContext = true,
  debounceMs = 500,
  cacheEnabled = true
}: DualSurfaceAIProviderProps) {
  // Provider state
  const [state, setState] = useState<ProviderState>({
    manuscriptEditor: null,
    frameworkEditor: null,
    activeSurface: defaultSurface,
    activeFrameworkCategory: 'character',
    config: {
      activeSurface: defaultSurface,
      provider: defaultProvider,
      fusionConfig: { ...DEFAULT_FUSION_CONFIG, ...fusionConfig },
      enableSmartSuggestions,
      enableCrossSurfaceContext,
      debounceMs,
      cacheEnabled
    }
  })

  // Update config when editors change
  const currentConfig = useMemo<DualSurfaceAIConfig>(() => ({
    ...state.config,
    manuscriptEditor: state.manuscriptEditor,
    frameworkEditor: state.frameworkEditor,
    activeSurface: state.activeSurface
  }), [state])

  // Use the dual surface AI hook
  const dualSurfaceAI = useDualSurfaceAI(currentConfig)

  /**
   * Register manuscript editor
   */
  const registerManuscriptEditor = useCallback((editor: Editor) => {
    setState(prev => ({
      ...prev,
      manuscriptEditor: editor
    }))
  }, [])

  /**
   * Register framework editor
   */
  const registerFrameworkEditor = useCallback((editor: Editor) => {
    setState(prev => ({
      ...prev,
      frameworkEditor: editor
    }))
  }, [])

  /**
   * Set active surface
   */
  const setActiveSurface = useCallback((surface: WritingSurface) => {
    setState(prev => ({
      ...prev,
      activeSurface: surface
    }))
    
    // Notify the dual surface AI hook
    dualSurfaceAI.switchSurface(surface)
  }, [dualSurfaceAI])

  /**
   * Update configuration
   */
  const updateConfig = useCallback((updates: Partial<DualSurfaceAIConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates }
    }))

    // Update fusion config if provided
    if (updates.fusionConfig) {
      dualSurfaceAI.updateFusionConfig(updates.fusionConfig)
    }
  }, [dualSurfaceAI])

  /**
   * Set active framework category
   */
  const setActiveFrameworkCategory = useCallback((category: FrameworkCategory) => {
    setState(prev => ({
      ...prev,
      activeFrameworkCategory: category
    }))
  }, [])

  /**
   * Enhance current selection with AI
   */
  const enhanceSelection = useCallback(async (): Promise<void> => {
    const editor = state.activeSurface === 'manuscript' 
      ? state.manuscriptEditor 
      : state.frameworkEditor

    if (!editor) {
      throw new Error('No active editor available')
    }

    const { selection } = editor.state
    const { from, to } = selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')

    if (!selectedText.trim()) {
      throw new Error('No text selected for enhancement')
    }

    try {
      let enhancementPrompt: string

      if (state.activeSurface === 'manuscript') {
        enhancementPrompt = `Improve this text while maintaining the author's voice and style: "${selectedText}"`
      } else {
        enhancementPrompt = `Enhance this ${state.activeFrameworkCategory} element with more detail and depth: "${selectedText}"`
      }

      const enhanced = await dualSurfaceAI.generateSurfaceAwareText(enhancementPrompt, {
        useFrameworkContext: state.activeSurface === 'manuscript',
        adaptPrompt: true,
        frameworkCategories: [state.activeFrameworkCategory]
      })

      // Replace the selected text with the enhanced version
      editor.chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent(enhanced)
        .run()

    } catch (error: any) {
      console.error('Selection enhancement failed:', error)
      throw new Error(`Failed to enhance selection: ${error.message}`)
    }
  }, [state, dualSurfaceAI])

  /**
   * Generate content from framework context
   */
  const generateFromFramework = useCallback(async (
    category: FrameworkCategory,
    prompt: string
  ): Promise<string> => {
    try {
      const frameworkPrompt = `Using the ${category} information from the story framework, ${prompt}`
      
      const result = await dualSurfaceAI.generateSurfaceAwareText(frameworkPrompt, {
        useFrameworkContext: true,
        frameworkWeight: 0.8,
        adaptPrompt: true,
        frameworkCategories: [category]
      })

      return result
    } catch (error: any) {
      console.error('Framework generation failed:', error)
      throw new Error(`Failed to generate from framework: ${error.message}`)
    }
  }, [dualSurfaceAI])

  /**
   * Analyze manuscript content using framework context
   */
  const analyzeManuscriptWithFramework = useCallback(async (): Promise<any> => {
    if (!state.manuscriptEditor) {
      throw new Error('Manuscript editor not available')
    }

    try {
      // Get current manuscript content around cursor
      const { selection } = state.manuscriptEditor.state
      const { from } = selection
      const context = state.manuscriptEditor.state.doc.textBetween(
        Math.max(0, from - 500),
        Math.min(state.manuscriptEditor.state.doc.content.size, from + 500),
        ' '
      )

      const analysisPrompt = `Analyze this manuscript excerpt in the context of the established story framework. 
      Identify potential inconsistencies, opportunities for improvement, and alignment with character arcs and plot elements:
      
      "${context}"`

      const analysis = await dualSurfaceAI.generateSurfaceAwareText(analysisPrompt, {
        useFrameworkContext: true,
        frameworkWeight: 0.6,
        adaptPrompt: true,
        frameworkCategories: ['character', 'plot', 'world', 'theme']
      })

      // Parse the analysis into structured format
      return {
        content: context,
        analysis: analysis,
        suggestions: [], // Could be parsed from analysis
        inconsistencies: [], // Could be extracted from analysis
        timestamp: new Date()
      }
    } catch (error: any) {
      console.error('Manuscript analysis failed:', error)
      throw new Error(`Failed to analyze manuscript: ${error.message}`)
    }
  }, [state.manuscriptEditor, dualSurfaceAI])

  // Context value
  const contextValue: DualSurfaceAIContextType = useMemo(() => ({
    // From dual surface AI hook
    ...dualSurfaceAI,
    
    // Editor management
    manuscriptEditor: state.manuscriptEditor,
    frameworkEditor: state.frameworkEditor,
    registerManuscriptEditor,
    registerFrameworkEditor,
    
    // Surface state
    activeSurface: state.activeSurface,
    setActiveSurface,
    
    // Configuration
    config: state.config,
    updateConfig,
    
    // Framework category management
    activeFrameworkCategory: state.activeFrameworkCategory,
    setActiveFrameworkCategory,
    
    // Quick actions
    enhanceSelection,
    generateFromFramework,
    analyzeManuscriptWithFramework
  }), [
    dualSurfaceAI,
    state,
    registerManuscriptEditor,
    registerFrameworkEditor,
    setActiveSurface,
    updateConfig,
    setActiveFrameworkCategory,
    enhanceSelection,
    generateFromFramework,
    analyzeManuscriptWithFramework
  ])

  return (
    <DualSurfaceAIContext.Provider value={contextValue}>
      {children}
    </DualSurfaceAIContext.Provider>
  )
}

/**
 * Hook to use dual surface AI context
 */
export function useDualSurfaceAIContext(): DualSurfaceAIContextType {
  const context = useContext(DualSurfaceAIContext)
  if (!context) {
    throw new Error('useDualSurfaceAIContext must be used within a DualSurfaceAIProvider')
  }
  return context
}

/**
 * Surface Switch Component
 * Utility component for switching between surfaces
 */
export interface SurfaceSwitchProps {
  className?: string
  showLabels?: boolean
  disabled?: boolean
  onSurfaceChange?: (surface: WritingSurface) => void
}

export function SurfaceSwitch({ 
  className = '',
  showLabels = true,
  disabled = false,
  onSurfaceChange
}: SurfaceSwitchProps) {
  const { activeSurface, setActiveSurface } = useDualSurfaceAIContext()

  const handleSurfaceChange = useCallback((surface: WritingSurface) => {
    setActiveSurface(surface)
    onSurfaceChange?.(surface)
  }, [setActiveSurface, onSurfaceChange])

  return (
    <div className={`flex rounded-lg border border-neutral-200 dark:border-neutral-700 ${className}`}>
      <button
        onClick={() => handleSurfaceChange('manuscript')}
        disabled={disabled}
        className={`
          px-3 py-2 text-sm font-medium rounded-l-lg transition-colors
          ${activeSurface === 'manuscript'
            ? 'bg-blue-500 text-white'
            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {showLabels ? 'Manuscript' : 'M'}
      </button>
      <button
        onClick={() => handleSurfaceChange('framework')}
        disabled={disabled}
        className={`
          px-3 py-2 text-sm font-medium rounded-r-lg transition-colors border-l border-neutral-200 dark:border-neutral-700
          ${activeSurface === 'framework'
            ? 'bg-blue-500 text-white'
            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {showLabels ? 'Framework' : 'F'}
      </button>
    </div>
  )
}

/**
 * Framework Category Selector Component
 */
export interface CategorySelectorProps {
  className?: string
  disabled?: boolean
  categories?: FrameworkCategory[]
  onCategoryChange?: (category: FrameworkCategory) => void
}

export function CategorySelector({
  className = '',
  disabled = false,
  categories = ['character', 'plot', 'world', 'theme', 'style', 'outline'],
  onCategoryChange
}: CategorySelectorProps) {
  const { activeFrameworkCategory, setActiveFrameworkCategory } = useDualSurfaceAIContext()

  const handleCategoryChange = useCallback((category: FrameworkCategory) => {
    setActiveFrameworkCategory(category)
    onCategoryChange?.(category)
  }, [setActiveFrameworkCategory, onCategoryChange])

  const categoryLabels: Record<FrameworkCategory, string> = {
    character: 'Characters',
    plot: 'Plot',
    world: 'World',
    theme: 'Themes',
    style: 'Style',
    outline: 'Outline',
    notes: 'Notes',
    research: 'Research'
  }

  return (
    <select
      value={activeFrameworkCategory}
      onChange={(e) => handleCategoryChange(e.target.value as FrameworkCategory)}
      disabled={disabled}
      className={`
        px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 
        rounded-lg bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {categories.map(category => (
        <option key={category} value={category}>
          {categoryLabels[category] || category}
        </option>
      ))}
    </select>
  )
}

/**
 * AI Status Indicator Component
 */
export interface AIStatusIndicatorProps {
  className?: string
  showDetails?: boolean
}

export function AIStatusIndicator({ 
  className = '',
  showDetails = false
}: AIStatusIndicatorProps) {
  const { 
    isGenerating, 
    isContextLoading, 
    error, 
    contextError,
    suggestions,
    currentContext
  } = useDualSurfaceAIContext()

  const isActive = isGenerating || isContextLoading
  const hasError = !!(error || contextError)
  const hasSuggestions = suggestions.length > 0

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Status indicator */}
      <div className={`
        w-3 h-3 rounded-full transition-colors
        ${hasError ? 'bg-red-500' : isActive ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}
      `} />
      
      {showDetails && (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          {hasError && (
            <span className="text-red-500">
              Error: {error || contextError}
            </span>
          )}
          
          {!hasError && isActive && (
            <span>
              {isGenerating ? 'Generating...' : 'Loading context...'}
            </span>
          )}
          
          {!hasError && !isActive && (
            <span className="flex items-center space-x-4">
              {currentContext && (
                <span>Context: {currentContext.activeSurface}</span>
              )}
              {hasSuggestions && (
                <span>{suggestions.length} suggestions</span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Export types for external use
export type {
  DualSurfaceAIContextType,
  DualSurfaceAIProviderProps,
  SurfaceSwitchProps,
  CategorySelectorProps,
  AIStatusIndicatorProps
}