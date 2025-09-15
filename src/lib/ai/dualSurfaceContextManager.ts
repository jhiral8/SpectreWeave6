/**
 * Dual Surface AI Context Manager for SpectreWeave5
 * 
 * Intelligent context management system for novel writing applications with:
 * - Manuscript Surface (primary writing content)
 * - Story Framework Surface (character profiles, plot outlines, world-building)
 * 
 * Features:
 * - Context fusion between surfaces
 * - Surface-aware prompt enhancement
 * - Smart context weighting
 * - Performance-optimized context extraction
 * - Cross-surface intelligence
 */

import { Editor } from '@tiptap/react'
import { 
  AIProvider, 
  AIRequest, 
  AIContext as BaseAIContext,
  AIGenerationOptions,
  SmartSuggestion,
  AIResponse
} from './types'

// Surface Types
export type WritingSurface = 'manuscript' | 'framework'

// Context Categories for Framework Surface
export type FrameworkCategory = 
  | 'character' 
  | 'plot' 
  | 'world' 
  | 'theme' 
  | 'style' 
  | 'outline'
  | 'notes'
  | 'research'

// Enhanced AI Context with dual surface awareness
export interface DualSurfaceAIContext extends BaseAIContext {
  activeSurface: WritingSurface
  manuscriptContext: ManuscriptContext
  frameworkContext: FrameworkContext
  contextFusion: ContextFusionConfig
  surfaceRelationships: SurfaceRelationship[]
}

// Manuscript-specific context
export interface ManuscriptContext {
  currentChapter?: string
  currentScene?: string
  selectedText: string
  cursorPosition: number
  surroundingText: {
    before: string
    after: string
    paragraph: string
    section: string
  }
  recentEdits: RecentEdit[]
  writingFlow: WritingFlowMetrics
}

// Framework-specific context
export interface FrameworkContext {
  activeCategory: FrameworkCategory
  characters: CharacterProfile[]
  plotElements: PlotElement[]
  worldBuilding: WorldElement[]
  themes: ThemeElement[]
  styleGuides: StyleGuide[]
  outlines: OutlineElement[]
  relevantElements: RelevantFrameworkElement[]
}

// Context fusion configuration
export interface ContextFusionConfig {
  enabled: boolean
  weightingStrategy: 'balanced' | 'manuscript-focused' | 'framework-informed' | 'adaptive'
  maxFrameworkTokens: number
  priorityCategories: FrameworkCategory[]
  relevanceThreshold: number
  contextRatio: {
    manuscript: number  // 0.0 - 1.0
    framework: number   // 0.0 - 1.0
  }
}

// Surface relationship mapping
export interface SurfaceRelationship {
  manuscriptElement: string  // chapter, scene, paragraph ID
  frameworkElements: string[] // framework element IDs
  relationshipType: 'direct' | 'thematic' | 'character' | 'setting'
  strength: number // 0.0 - 1.0
  lastUpdated: Date
}

// Supporting interfaces
export interface RecentEdit {
  position: number
  content: string
  timestamp: Date
  type: 'insert' | 'delete' | 'replace'
}

export interface WritingFlowMetrics {
  wordsPerMinute: number
  pauseDuration: number
  editFrequency: number
  focusScore: number
}

export interface CharacterProfile {
  id: string
  name: string
  description: string
  traits: string[]
  relationships: string[]
  arc: string
  relevanceScore?: number
}

export interface PlotElement {
  id: string
  type: 'event' | 'conflict' | 'resolution' | 'setup'
  title: string
  description: string
  chapterReferences: string[]
  relevanceScore?: number
}

export interface WorldElement {
  id: string
  type: 'location' | 'culture' | 'technology' | 'rules'
  name: string
  description: string
  relevanceScore?: number
}

export interface ThemeElement {
  id: string
  name: string
  description: string
  manifestations: string[]
  relevanceScore?: number
}

export interface StyleGuide {
  id: string
  name: string
  rules: string[]
  examples: string[]
  tone: string
}

export interface OutlineElement {
  id: string
  level: number
  title: string
  content: string
  children: OutlineElement[]
  relevanceScore?: number
}

export interface RelevantFrameworkElement {
  id: string
  category: FrameworkCategory
  content: string
  relevanceScore: number
  tokens: number
}

// Context extraction strategies
export interface ContextExtractionStrategy {
  name: string
  extractorFunction: (editor: Editor, surface: WritingSurface) => Promise<any>
  priority: number
  maxTokens: number
}

// Performance metrics
export interface ContextPerformanceMetrics {
  extractionTime: number
  fusionTime: number
  totalTokens: number
  cacheHitRate: number
  relevanceAccuracy: number
}

/**
 * Main Dual Surface Context Manager Class
 */
export class DualSurfaceContextManager {
  private manuscriptEditor: Editor | null = null
  private frameworkEditor: Editor | null = null
  private contextCache = new Map<string, any>()
  private performanceMetrics: ContextPerformanceMetrics
  private fusionConfig: ContextFusionConfig
  private extractionStrategies: Map<WritingSurface, ContextExtractionStrategy[]>

  constructor(config?: Partial<ContextFusionConfig>) {
    this.fusionConfig = {
      enabled: true,
      weightingStrategy: 'adaptive',
      maxFrameworkTokens: 2000,
      priorityCategories: ['character', 'plot', 'world'],
      relevanceThreshold: 0.3,
      contextRatio: { manuscript: 0.7, framework: 0.3 },
      ...config
    }

    this.performanceMetrics = {
      extractionTime: 0,
      fusionTime: 0,
      totalTokens: 0,
      cacheHitRate: 0,
      relevanceAccuracy: 0
    }

    this.extractionStrategies = new Map()
    this.initializeExtractionStrategies()
  }

  /**
   * Register editors for both surfaces
   */
  registerEditors(manuscriptEditor: Editor, frameworkEditor: Editor) {
    this.manuscriptEditor = manuscriptEditor
    this.frameworkEditor = frameworkEditor
  }

  /**
   * Extract comprehensive context for AI requests
   */
  async extractDualSurfaceContext(
    activeSurface: WritingSurface,
    options?: {
      includeFramework?: boolean
      maxTokens?: number
      categories?: FrameworkCategory[]
    }
  ): Promise<DualSurfaceAIContext> {
    const startTime = performance.now()

    try {
      // Extract manuscript context
      const manuscriptContext = await this.extractManuscriptContext()
      
      // Extract framework context (if enabled and available)
      let frameworkContext: FrameworkContext = {
        activeCategory: 'character',
        characters: [],
        plotElements: [],
        worldBuilding: [],
        themes: [],
        styleGuides: [],
        outlines: [],
        relevantElements: []
      }

      if (options?.includeFramework !== false && this.fusionConfig.enabled) {
        frameworkContext = await this.extractFrameworkContext(
          manuscriptContext,
          options?.categories
        )
      }

      // Fuse contexts intelligently
      const fusedContext = await this.fuseContexts(
        manuscriptContext,
        frameworkContext,
        activeSurface,
        options?.maxTokens
      )

      // Update performance metrics
      this.performanceMetrics.extractionTime = performance.now() - startTime
      this.performanceMetrics.totalTokens = this.calculateTokenCount(fusedContext)

      return fusedContext
    } catch (error) {
      console.error('Context extraction failed:', error)
      throw new Error(`Failed to extract dual surface context: ${error}`)
    }
  }

  /**
   * Extract manuscript-specific context
   */
  private async extractManuscriptContext(): Promise<ManuscriptContext> {
    if (!this.manuscriptEditor) {
      throw new Error('Manuscript editor not registered')
    }

    const editor = this.manuscriptEditor
    const { selection } = editor.state
    const { from, to } = selection
    
    // Get surrounding text with different granularities
    const doc = editor.state.doc
    const selectedText = doc.textBetween(from, to, ' ')
    
    // Context windows
    const contextWindow = 500
    const paragraphWindow = 200
    const sectionWindow = 1000
    
    const surroundingText = {
      before: doc.textBetween(Math.max(0, from - contextWindow), from, ' '),
      after: doc.textBetween(to, Math.min(doc.content.size, to + contextWindow), ' '),
      paragraph: this.extractParagraphContext(editor, from),
      section: this.extractSectionContext(editor, from, sectionWindow)
    }

    // Extract recent edits from editor history
    const recentEdits = this.extractRecentEdits(editor)
    
    // Calculate writing flow metrics
    const writingFlow = this.calculateWritingFlow(editor)

    return {
      selectedText,
      cursorPosition: from,
      surroundingText,
      recentEdits,
      writingFlow,
      currentChapter: this.detectCurrentChapter(editor, from),
      currentScene: this.detectCurrentScene(editor, from)
    }
  }

  /**
   * Extract framework-specific context
   */
  private async extractFrameworkContext(
    manuscriptContext: ManuscriptContext,
    categories?: FrameworkCategory[]
  ): Promise<FrameworkContext> {
    if (!this.frameworkEditor) {
      return {
        activeCategory: 'character',
        characters: [],
        plotElements: [],
        worldBuilding: [],
        themes: [],
        styleGuides: [],
        outlines: [],
        relevantElements: []
      }
    }

    const activeCategories = categories || this.fusionConfig.priorityCategories
    const frameworkContent = this.frameworkEditor.getHTML()
    
    // Parse framework content by categories
    const characters = await this.parseCharacterProfiles(frameworkContent)
    const plotElements = await this.parsePlotElements(frameworkContent)
    const worldBuilding = await this.parseWorldBuilding(frameworkContent)
    const themes = await this.parseThemes(frameworkContent)
    const styleGuides = await this.parseStyleGuides(frameworkContent)
    const outlines = await this.parseOutlines(frameworkContent)

    // Calculate relevance scores based on manuscript context
    await this.calculateRelevanceScores(
      { characters, plotElements, worldBuilding, themes, outlines },
      manuscriptContext
    )

    // Extract most relevant elements within token limits
    const relevantElements = await this.selectRelevantElements(
      { characters, plotElements, worldBuilding, themes, outlines },
      activeCategories
    )

    return {
      activeCategory: activeCategories[0] || 'character',
      characters,
      plotElements,
      worldBuilding,
      themes,
      styleGuides,
      outlines,
      relevantElements
    }
  }

  /**
   * Intelligently fuse manuscript and framework contexts
   */
  private async fuseContexts(
    manuscriptContext: ManuscriptContext,
    frameworkContext: FrameworkContext,
    activeSurface: WritingSurface,
    maxTokens?: number
  ): Promise<DualSurfaceAIContext> {
    const fusionStartTime = performance.now()

    // Determine context weighting based on active surface and strategy
    const weights = this.calculateContextWeights(activeSurface)
    
    // Build surface relationships
    const surfaceRelationships = await this.buildSurfaceRelationships(
      manuscriptContext,
      frameworkContext
    )

    // Create base context
    const baseContext: BaseAIContext = {
      selectedText: manuscriptContext.selectedText,
      documentContent: manuscriptContext.surroundingText.section,
      userPreferences: {
        autoSuggest: true,
        suggestionDelay: 500,
        showConfidence: true,
        showCitations: true,
        streamResponses: true,
        saveHistory: true,
        maxHistoryItems: 100,
        preferredTone: 'creative',
        defaultProvider: 'gemini'
      },
      previousGenerations: []
    }

    const fusedContext: DualSurfaceAIContext = {
      ...baseContext,
      activeSurface,
      manuscriptContext,
      frameworkContext,
      contextFusion: this.fusionConfig,
      surfaceRelationships
    }

    // Apply token limits and optimization
    if (maxTokens) {
      await this.optimizeContextForTokens(fusedContext, maxTokens)
    }

    this.performanceMetrics.fusionTime = performance.now() - fusionStartTime
    return fusedContext
  }

  /**
   * Generate surface-aware enhanced prompts
   */
  generateSurfaceAwarePrompt(
    originalPrompt: string,
    context: DualSurfaceAIContext
  ): string {
    const { activeSurface, manuscriptContext, frameworkContext, contextFusion } = context

    let enhancedPrompt = originalPrompt

    // Add surface-specific context
    if (activeSurface === 'manuscript') {
      enhancedPrompt = this.enhanceManuscriptPrompt(enhancedPrompt, context)
    } else {
      enhancedPrompt = this.enhanceFrameworkPrompt(enhancedPrompt, context)
    }

    // Add cross-surface intelligence if enabled
    if (contextFusion.enabled) {
      enhancedPrompt = this.addFrameworkIntelligence(enhancedPrompt, context)
    }

    return enhancedPrompt
  }

  /**
   * Generate surface-specific smart suggestions
   */
  async generateSurfaceSmartSuggestions(
    context: DualSurfaceAIContext,
    aiRequest: (prompt: string, options?: AIGenerationOptions) => Promise<AIResponse<string>>
  ): Promise<SmartSuggestion[]> {
    const { activeSurface } = context

    if (activeSurface === 'manuscript') {
      return this.generateManuscriptSuggestions(context, aiRequest)
    } else {
      return this.generateFrameworkSuggestions(context, aiRequest)
    }
  }

  /**
   * Performance optimization methods
   */
  private async optimizeContextForTokens(
    context: DualSurfaceAIContext,
    maxTokens: number
  ): Promise<void> {
    const currentTokens = this.calculateTokenCount(context)
    
    if (currentTokens <= maxTokens) return

    // Prioritize based on active surface
    if (context.activeSurface === 'manuscript') {
      // Keep more manuscript context, reduce framework
      context.frameworkContext.relevantElements = context.frameworkContext.relevantElements
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, Math.floor(context.frameworkContext.relevantElements.length * 0.6))
    } else {
      // Reduce manuscript context window
      const reductionFactor = 0.7
      context.manuscriptContext.surroundingText.before = 
        context.manuscriptContext.surroundingText.before.slice(-Math.floor(
          context.manuscriptContext.surroundingText.before.length * reductionFactor
        ))
      context.manuscriptContext.surroundingText.after = 
        context.manuscriptContext.surroundingText.after.slice(0, Math.floor(
          context.manuscriptContext.surroundingText.after.length * reductionFactor
        ))
    }
  }

  // Helper methods for context extraction and processing

  private extractParagraphContext(editor: Editor, position: number): string {
    const doc = editor.state.doc
    let paragraphStart = position
    let paragraphEnd = position

    // Find paragraph boundaries
    const text = doc.textBetween(0, doc.content.size, '\n')
    const lines = text.split('\n')
    let currentPos = 0

    for (const line of lines) {
      if (currentPos <= position && position <= currentPos + line.length) {
        return line
      }
      currentPos += line.length + 1
    }

    return ''
  }

  private extractSectionContext(editor: Editor, position: number, windowSize: number): string {
    const doc = editor.state.doc
    const start = Math.max(0, position - windowSize)
    const end = Math.min(doc.content.size, position + windowSize)
    return doc.textBetween(start, end, ' ')
  }

  private extractRecentEdits(editor: Editor): RecentEdit[] {
    // This would integrate with editor's history/undo system
    // For now, return empty array as placeholder
    return []
  }

  private calculateWritingFlow(editor: Editor): WritingFlowMetrics {
    // Placeholder implementation
    return {
      wordsPerMinute: 30,
      pauseDuration: 2000,
      editFrequency: 0.1,
      focusScore: 0.8
    }
  }

  private detectCurrentChapter(editor: Editor, position: number): string | undefined {
    // Look for chapter headings in the document
    const doc = editor.state.doc
    const text = doc.textBetween(0, position, '\n')
    const chapterMatch = text.match(/chapter\s+(\w+)/i)
    return chapterMatch ? chapterMatch[1] : undefined
  }

  private detectCurrentScene(editor: Editor, position: number): string | undefined {
    // Look for scene breaks or headings
    const doc = editor.state.doc
    const text = doc.textBetween(Math.max(0, position - 1000), position, '\n')
    const sceneMatch = text.match(/scene\s+(\w+)/i)
    return sceneMatch ? sceneMatch[1] : undefined
  }

  private async parseCharacterProfiles(content: string): Promise<CharacterProfile[]> {
    // Parse character information from framework content
    // This would use structured parsing or AI to extract character data
    return []
  }

  private async parsePlotElements(content: string): Promise<PlotElement[]> {
    return []
  }

  private async parseWorldBuilding(content: string): Promise<WorldElement[]> {
    return []
  }

  private async parseThemes(content: string): Promise<ThemeElement[]> {
    return []
  }

  private async parseStyleGuides(content: string): Promise<StyleGuide[]> {
    return []
  }

  private async parseOutlines(content: string): Promise<OutlineElement[]> {
    return []
  }

  private async calculateRelevanceScores(
    elements: any,
    manuscriptContext: ManuscriptContext
  ): Promise<void> {
    // Calculate relevance scores based on manuscript context
    // This would use semantic similarity, keyword matching, etc.
  }

  private async selectRelevantElements(
    elements: any,
    categories: FrameworkCategory[]
  ): Promise<RelevantFrameworkElement[]> {
    return []
  }

  private calculateContextWeights(activeSurface: WritingSurface): { manuscript: number, framework: number } {
    if (this.fusionConfig.weightingStrategy === 'adaptive') {
      return activeSurface === 'manuscript' 
        ? { manuscript: 0.8, framework: 0.2 }
        : { manuscript: 0.4, framework: 0.6 }
    }
    return this.fusionConfig.contextRatio
  }

  private async buildSurfaceRelationships(
    manuscriptContext: ManuscriptContext,
    frameworkContext: FrameworkContext
  ): Promise<SurfaceRelationship[]> {
    return []
  }

  private calculateTokenCount(context: DualSurfaceAIContext): number {
    // Rough token estimation (4 characters ≈ 1 token)
    const manuscriptTokens = JSON.stringify(context.manuscriptContext).length / 4
    const frameworkTokens = JSON.stringify(context.frameworkContext).length / 4
    return Math.ceil(manuscriptTokens + frameworkTokens)
  }

  private enhanceManuscriptPrompt(prompt: string, context: DualSurfaceAIContext): string {
    const { manuscriptContext, frameworkContext } = context
    
    let enhanced = prompt
    
    // Add current writing context
    if (manuscriptContext.currentChapter) {
      enhanced += `\n\nCurrent Chapter: ${manuscriptContext.currentChapter}`
    }
    
    if (manuscriptContext.surroundingText.before) {
      enhanced += `\n\nPreceding text: "${manuscriptContext.surroundingText.before.slice(-200)}"`
    }
    
    return enhanced
  }

  private enhanceFrameworkPrompt(prompt: string, context: DualSurfaceAIContext): string {
    const { frameworkContext } = context
    
    let enhanced = prompt
    
    // Add framework-specific guidance
    if (frameworkContext.characters.length > 0) {
      enhanced += `\n\nAvailable Characters: ${frameworkContext.characters.map(c => c.name).join(', ')}`
    }
    
    return enhanced
  }

  private addFrameworkIntelligence(prompt: string, context: DualSurfaceAIContext): string {
    const { frameworkContext } = context
    const relevantElements = frameworkContext.relevantElements
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3)
    
    if (relevantElements.length > 0) {
      prompt += `\n\nRelevant Story Elements:\n`
      relevantElements.forEach(element => {
        prompt += `- ${element.category}: ${element.content.slice(0, 100)}...\n`
      })
    }
    
    return prompt
  }

  private async generateManuscriptSuggestions(
    context: DualSurfaceAIContext,
    aiRequest: (prompt: string, options?: AIGenerationOptions) => Promise<AIResponse<string>>
  ): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = []
    
    // Text continuation suggestions
    if (context.manuscriptContext.surroundingText.before) {
      const continuationPrompt = `Continue this narrative naturally: "${context.manuscriptContext.surroundingText.before.slice(-100)}"`
      const response = await aiRequest(continuationPrompt, { maxTokens: 50 })
      
      if (response.success && response.data) {
        suggestions.push({
          id: `continuation-${Date.now()}`,
          type: 'completion',
          text: response.data,
          confidence: 0.8,
          position: context.manuscriptContext.cursorPosition,
          reason: 'Narrative continuation',
          category: 'writing'
        } as SmartSuggestion)
      }
    }
    
    return suggestions
  }

  private async generateFrameworkSuggestions(
    context: DualSurfaceAIContext,
    aiRequest: (prompt: string, options?: AIGenerationOptions) => Promise<AIResponse<string>>
  ): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = []
    
    // Framework-specific suggestions based on active category
    const category = context.frameworkContext.activeCategory
    
    if (category === 'character') {
      const prompt = `Suggest character development ideas based on existing characters`
      const response = await aiRequest(prompt, { maxTokens: 100 })
      
      if (response.success && response.data) {
        suggestions.push({
          id: `character-dev-${Date.now()}`,
          type: 'suggestion',
          text: response.data,
          confidence: 0.7,
          position: 0,
          reason: 'Character development',
          category: 'framework'
        } as SmartSuggestion)
      }
    }
    
    return suggestions
  }

  private initializeExtractionStrategies(): void {
    // Initialize context extraction strategies for different surfaces
    // This would contain various extraction methods optimized for performance
  }

  /**
   * Public API methods
   */

  updateFusionConfig(config: Partial<ContextFusionConfig>): void {
    this.fusionConfig = { ...this.fusionConfig, ...config }
  }

  getPerformanceMetrics(): ContextPerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  clearContextCache(): void {
    this.contextCache.clear()
  }

  // Context caching for performance
  private getCachedContext(key: string): any {
    return this.contextCache.get(key)
  }

  private setCachedContext(key: string, context: any): void {
    this.contextCache.set(key, context)
    
    // Implement cache size limit
    if (this.contextCache.size > 100) {
      const firstKey = this.contextCache.keys().next().value
      this.contextCache.delete(firstKey)
    }
  }
}

// Export singleton instance
export const dualSurfaceContextManager = new DualSurfaceContextManager()

// Export default configuration
export const DEFAULT_FUSION_CONFIG: ContextFusionConfig = {
  enabled: true,
  weightingStrategy: 'adaptive',
  maxFrameworkTokens: 2000,
  priorityCategories: ['character', 'plot', 'world'],
  relevanceThreshold: 0.3,
  contextRatio: { manuscript: 0.7, framework: 0.3 }
}