/**
 * Surface-Aware Prompt Engine for SpectreWeave5
 * 
 * Advanced prompt enhancement system that adapts AI behavior based on:
 * - Active writing surface (manuscript vs framework)
 * - Context fusion from dual surfaces
 * - Dynamic prompt templates
 * - Performance-optimized prompt generation
 */

import { 
  DualSurfaceAIContext, 
  WritingSurface, 
  FrameworkCategory,
  ManuscriptContext,
  FrameworkContext
} from './dualSurfaceContextManager'

import { AIProvider, AIGenerationOptions } from './types'

// Prompt template types
export interface PromptTemplate {
  id: string
  name: string
  surface: WritingSurface | 'both'
  category?: FrameworkCategory
  template: string
  variables: PromptVariable[]
  adaptiveElements: AdaptiveElement[]
  performance: PromptPerformance
}

export interface PromptVariable {
  name: string
  type: 'text' | 'number' | 'boolean' | 'array'
  required: boolean
  defaultValue?: any
  description: string
  extractionPath?: string // JSONPath for context extraction
}

export interface AdaptiveElement {
  condition: string // JavaScript expression
  content: string
  weight: number
}

export interface PromptPerformance {
  avgResponseTime: number
  successRate: number
  tokenEfficiency: number
  userSatisfaction: number
}

// Surface-specific prompt configurations
export interface SurfacePromptConfig {
  surface: WritingSurface
  defaultProvider: AIProvider
  promptTemplates: PromptTemplate[]
  contextPreferences: ContextPreferences
  responseFormat: ResponseFormat
}

export interface ContextPreferences {
  maxContextTokens: number
  prioritizeRecent: boolean
  includeFrameworkContext: boolean
  frameworkContextRatio: number
  adaptiveWeighting: boolean
}

export interface ResponseFormat {
  structured: boolean
  includeMetadata: boolean
  confidenceScores: boolean
  alternatives: boolean
  reasoning: boolean
}

// Enhanced prompt request
export interface EnhancedPromptRequest {
  originalPrompt: string
  surface: WritingSurface
  context: DualSurfaceAIContext
  options?: {
    templateId?: string
    provider?: AIProvider
    customVariables?: Record<string, any>
    adaptationLevel?: 'minimal' | 'standard' | 'maximum'
    includeFramework?: boolean
  }
}

// Enhanced prompt response
export interface EnhancedPromptResponse {
  enhancedPrompt: string
  templateUsed?: string
  adaptationsApplied: string[]
  contextTokensUsed: number
  estimatedResponseQuality: number
  metadata: {
    surface: WritingSurface
    provider: AIProvider
    processingTime: number
    cacheHit: boolean
  }
}

/**
 * Main Surface-Aware Prompt Engine
 */
export class SurfaceAwarePromptEngine {
  private templates = new Map<string, PromptTemplate>()
  private surfaceConfigs = new Map<WritingSurface, SurfacePromptConfig>()
  private promptCache = new Map<string, EnhancedPromptResponse>()
  private performanceTracker = new Map<string, PromptPerformance>()

  constructor() {
    this.initializeDefaultTemplates()
    this.initializeSurfaceConfigs()
  }

  /**
   * Main prompt enhancement method
   */
  async enhancePrompt(request: EnhancedPromptRequest): Promise<EnhancedPromptResponse> {
    const startTime = performance.now()
    const cacheKey = this.generateCacheKey(request)
    
    // Check cache first
    const cached = this.promptCache.get(cacheKey)
    if (cached && this.shouldUseCache(request)) {
      cached.metadata.cacheHit = true
      return cached
    }

    try {
      // Select appropriate template
      const template = this.selectTemplate(request)
      
      // Apply surface-specific adaptations
      const adaptations = await this.applySurfaceAdaptations(request, template)
      
      // Build enhanced prompt
      const enhancedPrompt = await this.buildEnhancedPrompt(request, template, adaptations)
      
      // Calculate quality metrics
      const quality = this.estimateResponseQuality(enhancedPrompt, request.context)
      
      const response: EnhancedPromptResponse = {
        enhancedPrompt,
        templateUsed: template?.id,
        adaptationsApplied: adaptations,
        contextTokensUsed: this.calculateContextTokens(request.context),
        estimatedResponseQuality: quality,
        metadata: {
          surface: request.surface,
          provider: request.options?.provider || this.getDefaultProvider(request.surface),
          processingTime: performance.now() - startTime,
          cacheHit: false
        }
      }

      // Cache the response
      this.promptCache.set(cacheKey, response)
      
      // Update performance tracking
      this.updatePerformanceTracking(template?.id || 'default', response)

      return response
    } catch (error) {
      console.error('Prompt enhancement failed:', error)
      throw new Error(`Failed to enhance prompt: ${error}`)
    }
  }

  /**
   * Generate manuscript-specific prompts
   */
  async generateManuscriptPrompt(
    originalPrompt: string,
    context: DualSurfaceAIContext,
    options?: {
      writingStyle?: 'narrative' | 'dialogue' | 'description' | 'action'
      genre?: string
      includeCharacterContext?: boolean
      includeFrameworkGuidance?: boolean
    }
  ): Promise<string> {
    const request: EnhancedPromptRequest = {
      originalPrompt,
      surface: 'manuscript',
      context,
      options: {
        customVariables: options,
        adaptationLevel: 'standard',
        includeFramework: options?.includeFrameworkGuidance
      }
    }

    const response = await this.enhancePrompt(request)
    return response.enhancedPrompt
  }

  /**
   * Generate framework-specific prompts
   */
  async generateFrameworkPrompt(
    originalPrompt: string,
    context: DualSurfaceAIContext,
    category: FrameworkCategory,
    options?: {
      includeManuscriptContext?: boolean
      structuredOutput?: boolean
      detailLevel?: 'brief' | 'detailed' | 'comprehensive'
    }
  ): Promise<string> {
    const request: EnhancedPromptRequest = {
      originalPrompt,
      surface: 'framework',
      context,
      options: {
        templateId: `framework-${category}`,
        customVariables: { category, ...options },
        adaptationLevel: 'maximum'
      }
    }

    const response = await this.enhancePrompt(request)
    return response.enhancedPrompt
  }

  /**
   * Template selection logic
   */
  private selectTemplate(request: EnhancedPromptRequest): PromptTemplate | null {
    const { surface, options } = request
    
    // Use explicitly requested template
    if (options?.templateId) {
      return this.templates.get(options.templateId) || null
    }

    // Find best matching template
    const candidates = Array.from(this.templates.values()).filter(template => 
      template.surface === surface || template.surface === 'both'
    )

    if (candidates.length === 0) return null

    // Score templates based on context match
    const scored = candidates.map(template => ({
      template,
      score: this.scoreTemplateMatch(template, request)
    }))

    scored.sort((a, b) => b.score - a.score)
    return scored[0]?.template || null
  }

  /**
   * Apply surface-specific adaptations
   */
  private async applySurfaceAdaptations(
    request: EnhancedPromptRequest,
    template: PromptTemplate | null
  ): Promise<string[]> {
    const adaptations: string[] = []
    const { surface, context } = request

    if (surface === 'manuscript') {
      adaptations.push(...await this.applyManuscriptAdaptations(context.manuscriptContext))
    } else {
      adaptations.push(...await this.applyFrameworkAdaptations(context.frameworkContext))
    }

    // Apply cross-surface adaptations if framework context is enabled
    if (request.options?.includeFramework && context.contextFusion.enabled) {
      adaptations.push(...await this.applyCrossSurfaceAdaptations(context))
    }

    return adaptations
  }

  /**
   * Build the final enhanced prompt
   */
  private async buildEnhancedPrompt(
    request: EnhancedPromptRequest,
    template: PromptTemplate | null,
    adaptations: string[]
  ): Promise<string> {
    let prompt = request.originalPrompt

    // Apply template if available
    if (template) {
      prompt = await this.applyTemplate(template, request)
    }

    // Add surface-specific context
    prompt = this.addSurfaceContext(prompt, request)

    // Add framework intelligence if enabled
    if (request.context.contextFusion.enabled) {
      prompt = this.addFrameworkIntelligence(prompt, request.context)
    }

    // Apply performance optimizations
    prompt = this.optimizePrompt(prompt, request)

    return prompt
  }

  /**
   * Manuscript-specific adaptations
   */
  private async applyManuscriptAdaptations(manuscriptContext: ManuscriptContext): Promise<string[]> {
    const adaptations: string[] = []

    // Writing flow adaptations
    if (manuscriptContext.writingFlow.pauseDuration > 5000) {
      adaptations.push('flow-pause-recovery')
    }

    if (manuscriptContext.writingFlow.editFrequency > 0.3) {
      adaptations.push('revision-assistance')
    }

    // Chapter/scene context
    if (manuscriptContext.currentChapter) {
      adaptations.push('chapter-aware')
    }

    if (manuscriptContext.currentScene) {
      adaptations.push('scene-aware')
    }

    // Recent edit patterns
    if (manuscriptContext.recentEdits.length > 0) {
      const editTypes = new Set(manuscriptContext.recentEdits.map(edit => edit.type))
      if (editTypes.has('delete')) {
        adaptations.push('deletion-recovery')
      }
    }

    return adaptations
  }

  /**
   * Framework-specific adaptations
   */
  private async applyFrameworkAdaptations(frameworkContext: FrameworkContext): Promise<string[]> {
    const adaptations: string[] = []

    // Category-specific adaptations
    switch (frameworkContext.activeCategory) {
      case 'character':
        if (frameworkContext.characters.length > 0) {
          adaptations.push('character-aware')
        }
        break
      case 'plot':
        if (frameworkContext.plotElements.length > 0) {
          adaptations.push('plot-aware')
        }
        break
      case 'world':
        if (frameworkContext.worldBuilding.length > 0) {
          adaptations.push('world-aware')
        }
        break
    }

    // Relevance-based adaptations
    if (frameworkContext.relevantElements.length > 0) {
      adaptations.push('relevance-enhanced')
    }

    return adaptations
  }

  /**
   * Cross-surface adaptations
   */
  private async applyCrossSurfaceAdaptations(context: DualSurfaceAIContext): Promise<string[]> {
    const adaptations: string[] = []

    // Surface relationship adaptations
    if (context.surfaceRelationships.length > 0) {
      adaptations.push('cross-surface-relationships')
    }

    // Context fusion adaptations
    if (context.contextFusion.weightingStrategy === 'adaptive') {
      adaptations.push('adaptive-weighting')
    }

    return adaptations
  }

  /**
   * Apply template with variable substitution
   */
  private async applyTemplate(
    template: PromptTemplate,
    request: EnhancedPromptRequest
  ): Promise<string> {
    let prompt = template.template

    // Substitute variables
    for (const variable of template.variables) {
      const value = this.extractVariableValue(variable, request)
      if (value !== undefined) {
        prompt = prompt.replace(new RegExp(`{{${variable.name}}}`, 'g'), String(value))
      }
    }

    // Apply adaptive elements
    for (const element of template.adaptiveElements) {
      if (this.evaluateCondition(element.condition, request)) {
        prompt += '\n' + element.content
      }
    }

    return prompt
  }

  /**
   * Add surface-specific context
   */
  private addSurfaceContext(prompt: string, request: EnhancedPromptRequest): string {
    const { surface, context } = request

    if (surface === 'manuscript') {
      // Add manuscript writing context
      if (context.manuscriptContext.surroundingText.before) {
        prompt += `\n\nCurrent writing context:\n"${context.manuscriptContext.surroundingText.before.slice(-200)}"`
      }

      if (context.manuscriptContext.currentChapter) {
        prompt += `\n\nChapter: ${context.manuscriptContext.currentChapter}`
      }
    } else {
      // Add framework context
      const activeCategory = context.frameworkContext.activeCategory
      prompt += `\n\nFramework Category: ${activeCategory}`

      const relevantElements = context.frameworkContext.relevantElements
        .filter(el => el.category === activeCategory)
        .slice(0, 3)

      if (relevantElements.length > 0) {
        prompt += `\n\nRelevant ${activeCategory} elements:\n`
        relevantElements.forEach(element => {
          prompt += `- ${element.content.slice(0, 100)}...\n`
        })
      }
    }

    return prompt
  }

  /**
   * Add framework intelligence to prompts
   */
  private addFrameworkIntelligence(prompt: string, context: DualSurfaceAIContext): string {
    const { frameworkContext, contextFusion } = context

    if (!contextFusion.enabled) return prompt

    // Add high-relevance framework elements
    const topElements = frameworkContext.relevantElements
      .filter(el => el.relevanceScore > contextFusion.relevanceThreshold)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3)

    if (topElements.length > 0) {
      prompt += `\n\n=== Story Framework Context ===\n`
      topElements.forEach(element => {
        prompt += `${element.category.toUpperCase()}: ${element.content.slice(0, 150)}...\n`
      })
      prompt += `=== End Framework Context ===\n`
    }

    return prompt
  }

  /**
   * Optimize prompt for performance and token efficiency
   */
  private optimizePrompt(prompt: string, request: EnhancedPromptRequest): string {
    const maxTokens = this.getMaxTokensForSurface(request.surface)
    const currentTokens = this.estimateTokens(prompt)

    if (currentTokens > maxTokens) {
      // Trim context while preserving important elements
      prompt = this.trimPromptIntelligently(prompt, maxTokens)
    }

    // Add surface-specific formatting
    if (request.surface === 'framework') {
      prompt += '\n\nPlease provide a structured response appropriate for story planning and development.'
    }

    return prompt
  }

  /**
   * Helper methods
   */

  private generateCacheKey(request: EnhancedPromptRequest): string {
    const contextHash = this.hashContext(request.context)
    return `${request.surface}-${contextHash}-${request.originalPrompt.slice(0, 50)}`
  }

  private shouldUseCache(request: EnhancedPromptRequest): boolean {
    // Use cache for framework requests more aggressively than manuscript
    return request.surface === 'framework' || request.originalPrompt.length < 100
  }

  private scoreTemplateMatch(template: PromptTemplate, request: EnhancedPromptRequest): number {
    let score = 0

    // Surface match
    if (template.surface === request.surface) score += 10
    else if (template.surface === 'both') score += 5

    // Category match for framework
    if (request.surface === 'framework' && template.category) {
      if (template.category === request.context.frameworkContext.activeCategory) {
        score += 8
      }
    }

    // Performance score
    score += template.performance.successRate * 5
    score += template.performance.userSatisfaction * 3

    return score
  }

  private calculateContextTokens(context: DualSurfaceAIContext): number {
    const manuscriptTokens = this.estimateTokens(JSON.stringify(context.manuscriptContext))
    const frameworkTokens = this.estimateTokens(JSON.stringify(context.frameworkContext))
    return manuscriptTokens + frameworkTokens
  }

  private estimateResponseQuality(prompt: string, context: DualSurfaceAIContext): number {
    // Quality estimation based on context richness, prompt clarity, etc.
    let quality = 0.5 // Base quality

    // Context richness
    if (context.frameworkContext.relevantElements.length > 0) quality += 0.2
    if (context.manuscriptContext.surroundingText.before) quality += 0.1
    if (context.surfaceRelationships.length > 0) quality += 0.1

    // Prompt clarity
    if (prompt.length > 100) quality += 0.1

    return Math.min(quality, 1.0)
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4) // Rough estimation
  }

  private hashContext(context: DualSurfaceAIContext): string {
    // Simple hash for caching purposes
    const contextStr = JSON.stringify({
      surface: context.activeSurface,
      cursorPos: context.manuscriptContext.cursorPosition,
      relevantCount: context.frameworkContext.relevantElements.length
    })
    return btoa(contextStr).slice(0, 16)
  }

  private extractVariableValue(variable: PromptVariable, request: EnhancedPromptRequest): any {
    if (request.options?.customVariables?.[variable.name] !== undefined) {
      return request.options.customVariables[variable.name]
    }

    if (variable.extractionPath) {
      // JSONPath extraction would go here
      return this.extractByPath(request.context, variable.extractionPath)
    }

    return variable.defaultValue
  }

  private extractByPath(obj: any, path: string): any {
    // Simple path extraction (would use a proper JSONPath library in production)
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private evaluateCondition(condition: string, request: EnhancedPromptRequest): boolean {
    try {
      // Safe condition evaluation (would use a proper expression evaluator in production)
      const context = request.context
      return eval(condition) // Note: Use safer evaluation in production
    } catch {
      return false
    }
  }

  private getDefaultProvider(surface: WritingSurface): AIProvider {
    const config = this.surfaceConfigs.get(surface)
    return config?.defaultProvider || 'gemini'
  }

  private getMaxTokensForSurface(surface: WritingSurface): number {
    const config = this.surfaceConfigs.get(surface)
    return config?.contextPreferences.maxContextTokens || 4000
  }

  private trimPromptIntelligently(prompt: string, maxTokens: number): string {
    const targetLength = maxTokens * 4 // Convert tokens to characters
    if (prompt.length <= targetLength) return prompt

    // Preserve the original prompt and trim context sections
    const sections = prompt.split('\n\n')
    let result = sections[0] // Keep original prompt

    for (let i = 1; i < sections.length && result.length < targetLength; i++) {
      const section = sections[i]
      if (result.length + section.length < targetLength) {
        result += '\n\n' + section
      }
    }

    return result
  }

  private updatePerformanceTracking(templateId: string, response: EnhancedPromptResponse): void {
    const current = this.performanceTracker.get(templateId) || {
      avgResponseTime: 0,
      successRate: 0,
      tokenEfficiency: 0,
      userSatisfaction: 0
    }

    // Update metrics (simplified)
    current.avgResponseTime = (current.avgResponseTime + response.metadata.processingTime) / 2
    current.tokenEfficiency = response.contextTokensUsed > 0 ? 
      response.estimatedResponseQuality / response.contextTokensUsed : 0

    this.performanceTracker.set(templateId, current)
  }

  /**
   * Initialize default templates and configurations
   */
  private initializeDefaultTemplates(): void {
    // Manuscript templates
    this.templates.set('manuscript-continuation', {
      id: 'manuscript-continuation',
      name: 'Narrative Continuation',
      surface: 'manuscript',
      template: `Continue this narrative naturally, maintaining the established tone and style.

Current context: {{context.before}}

Consider the following story elements if relevant:
{{frameworkElements}}

Continue writing:`,
      variables: [
        {
          name: 'context.before',
          type: 'text',
          required: true,
          description: 'Text before cursor',
          extractionPath: 'manuscriptContext.surroundingText.before'
        }
      ],
      adaptiveElements: [
        {
          condition: 'context.frameworkContext.characters.length > 0',
          content: 'Remember to stay true to established character voices and motivations.',
          weight: 0.8
        }
      ],
      performance: {
        avgResponseTime: 1500,
        successRate: 0.85,
        tokenEfficiency: 0.7,
        userSatisfaction: 0.8
      }
    })

    // Framework templates
    this.templates.set('framework-character', {
      id: 'framework-character',
      name: 'Character Development',
      surface: 'framework',
      category: 'character',
      template: `Help develop this character for a story.

Character context: {{characterInfo}}

Consider the following story elements:
{{storyContext}}

Please provide detailed character development suggestions:`,
      variables: [
        {
          name: 'characterInfo',
          type: 'text',
          required: false,
          description: 'Existing character information'
        }
      ],
      adaptiveElements: [],
      performance: {
        avgResponseTime: 2000,
        successRate: 0.9,
        tokenEfficiency: 0.8,
        userSatisfaction: 0.85
      }
    })
  }

  private initializeSurfaceConfigs(): void {
    // Manuscript surface configuration
    this.surfaceConfigs.set('manuscript', {
      surface: 'manuscript',
      defaultProvider: 'gemini',
      promptTemplates: [],
      contextPreferences: {
        maxContextTokens: 3000,
        prioritizeRecent: true,
        includeFrameworkContext: true,
        frameworkContextRatio: 0.3,
        adaptiveWeighting: true
      },
      responseFormat: {
        structured: false,
        includeMetadata: false,
        confidenceScores: false,
        alternatives: true,
        reasoning: false
      }
    })

    // Framework surface configuration
    this.surfaceConfigs.set('framework', {
      surface: 'framework',
      defaultProvider: 'databricks',
      promptTemplates: [],
      contextPreferences: {
        maxContextTokens: 4000,
        prioritizeRecent: false,
        includeFrameworkContext: false,
        frameworkContextRatio: 0,
        adaptiveWeighting: false
      },
      responseFormat: {
        structured: true,
        includeMetadata: true,
        confidenceScores: true,
        alternatives: true,
        reasoning: true
      }
    })
  }

  /**
   * Public configuration methods
   */
  addTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template)
  }

  updateSurfaceConfig(surface: WritingSurface, config: Partial<SurfacePromptConfig>): void {
    const current = this.surfaceConfigs.get(surface)
    if (current) {
      this.surfaceConfigs.set(surface, { ...current, ...config })
    }
  }

  getPerformanceMetrics(): Map<string, PromptPerformance> {
    return new Map(this.performanceTracker)
  }

  clearCache(): void {
    this.promptCache.clear()
  }
}

// Export singleton instance
export const surfaceAwarePromptEngine = new SurfaceAwarePromptEngine()

// Export template builder utility
export class PromptTemplateBuilder {
  private template: Partial<PromptTemplate> = {}

  static create(): PromptTemplateBuilder {
    return new PromptTemplateBuilder()
  }

  id(id: string): PromptTemplateBuilder {
    this.template.id = id
    return this
  }

  name(name: string): PromptTemplateBuilder {
    this.template.name = name
    return this
  }

  surface(surface: WritingSurface | 'both'): PromptTemplateBuilder {
    this.template.surface = surface
    return this
  }

  category(category: FrameworkCategory): PromptTemplateBuilder {
    this.template.category = category
    return this
  }

  template(template: string): PromptTemplateBuilder {
    this.template.template = template
    return this
  }

  variable(variable: PromptVariable): PromptTemplateBuilder {
    if (!this.template.variables) this.template.variables = []
    this.template.variables.push(variable)
    return this
  }

  adaptive(element: AdaptiveElement): PromptTemplateBuilder {
    if (!this.template.adaptiveElements) this.template.adaptiveElements = []
    this.template.adaptiveElements.push(element)
    return this
  }

  build(): PromptTemplate {
    if (!this.template.id || !this.template.name || !this.template.surface || !this.template.template) {
      throw new Error('Missing required template fields')
    }

    return {
      variables: [],
      adaptiveElements: [],
      performance: {
        avgResponseTime: 0,
        successRate: 0,
        tokenEfficiency: 0,
        userSatisfaction: 0
      },
      ...this.template
    } as PromptTemplate
  }
}