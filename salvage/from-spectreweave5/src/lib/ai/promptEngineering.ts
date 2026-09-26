/**
 * Advanced Prompt Engineering System for Character Consistency
 * 
 * Implements sophisticated prompt construction with character locking tokens,
 * contextual awareness, and dynamic adaptation based on consistency feedback
 */

import type { 
  CharacterProfile, 
  CharacterAppearance, 
  ConsistencyValidationResult,
  SimilarityBreakdown 
} from './characterLock'

export interface PromptTemplate {
  id: string
  name: string
  category: 'character' | 'scene' | 'style' | 'technical'
  template: string
  variables: string[]
  weight: number
  conditions?: PromptCondition[]
}

export interface PromptCondition {
  type: 'consistency_score' | 'character_role' | 'scene_type' | 'style_type'
  operator: 'gt' | 'lt' | 'eq' | 'contains'
  value: any
}

export interface PromptContext {
  character: CharacterProfile
  sceneDescription: string
  previousAppearances?: CharacterAppearance[]
  consistencyHistory?: ConsistencyValidationResult[]
  targetStyle: string
  pageNumber?: number
  bookTheme?: string
  targetAge?: string
}

export interface PromptWeights {
  character_identity: number      // Base character description
  physical_consistency: number    // Physical trait emphasis
  style_consistency: number      // Art style maintenance
  scene_integration: number      // Scene-specific adaptation
  negative_reinforcement: number // Avoiding inconsistencies
  quality_enhancement: number    // Technical quality prompts
}

export interface GeneratedPrompt {
  positive: string
  negative: string
  style_tokens: string[]
  lora_weights: Record<string, number>
  metadata: {
    template_ids: string[]
    character_weight: number
    consistency_adaptations: string[]
    generated_at: string
  }
}

export class PromptEngineeringService {
  private templates: Map<string, PromptTemplate> = new Map()
  private characterTokens: Map<string, string[]> = new Map()
  private styleTemplates: Map<string, PromptTemplate[]> = new Map()

  constructor() {
    this.initializeTemplates()
  }

  /**
   * Generate optimized prompt for character-consistent image generation
   */
  async generateCharacterPrompt(
    context: PromptContext,
    weights: Partial<PromptWeights> = {}
  ): Promise<GeneratedPrompt> {
    const defaultWeights: PromptWeights = {
      character_identity: 1.2,
      physical_consistency: 1.0,
      style_consistency: 0.8,
      scene_integration: 0.9,
      negative_reinforcement: 0.7,
      quality_enhancement: 0.6,
      ...weights
    }

    // Analyze character consistency history for adaptive prompting
    const consistencyInsights = this.analyzeConsistencyHistory(context)
    
    // Build character identity tokens
    const characterTokens = this.buildCharacterTokens(context.character)
    
    // Generate positive prompt components
    const positiveComponents = await this.buildPositivePrompt(context, defaultWeights, consistencyInsights)
    
    // Generate negative prompt components
    const negativeComponents = await this.buildNegativePrompt(context, consistencyInsights)
    
    // Combine and optimize
    const positivePrompt = this.combinePromptComponents(positiveComponents, defaultWeights)
    const negativePrompt = this.combinePromptComponents(negativeComponents, defaultWeights)
    
    // Extract style tokens and LoRA weights
    const styleTokens = this.extractStyleTokens(context.character, context.targetStyle)
    const loraWeights = this.calculateLoRAWeights(context, consistencyInsights)

    return {
      positive: positivePrompt,
      negative: negativePrompt,
      style_tokens: styleTokens,
      lora_weights: loraWeights,
      metadata: {
        template_ids: Array.from(this.templates.keys()),
        character_weight: defaultWeights.character_identity,
        consistency_adaptations: consistencyInsights.adaptations,
        generated_at: new Date().toISOString()
      }
    }
  }

  /**
   * Adapt prompt based on previous generation results and consistency feedback
   */
  async adaptPromptFromFeedback(
    originalPrompt: GeneratedPrompt,
    context: PromptContext,
    validationResult: ConsistencyValidationResult
  ): Promise<GeneratedPrompt> {
    const adaptations: string[] = []
    
    // Analyze consistency issues and adapt accordingly
    for (const issue of validationResult.issues) {
      switch (issue.type) {
        case 'facial_inconsistency':
          adaptations.push('detailed facial features')
          adaptations.push('consistent face structure')
          if (context.character.physicalTraits.eyeColor) {
            adaptations.push(`${context.character.physicalTraits.eyeColor} eyes`)
          }
          break
          
        case 'clothing_mismatch':
          if (context.character.physicalTraits.clothing?.primary_outfit) {
            adaptations.push(`wearing ${context.character.physicalTraits.clothing.primary_outfit}`)
          }
          adaptations.push('consistent clothing design')
          break
          
        case 'style_drift':
          adaptations.push('consistent art style')
          adaptations.push(`${context.targetStyle} illustration style`)
          break
          
        case 'pose_inconsistency':
          adaptations.push('natural pose')
          adaptations.push('consistent body proportions')
          break
      }
    }

    // Rebuild prompt with adaptations
    const updatedContext = { ...context }
    const updatedWeights: Partial<PromptWeights> = {}
    
    // Increase weights for problematic areas
    if (validationResult.breakdown.facial < 0.7) {
      updatedWeights.physical_consistency = 1.4
    }
    if (validationResult.breakdown.style < 0.7) {
      updatedWeights.style_consistency = 1.3
    }
    
    const adaptedPrompt = await this.generateCharacterPrompt(updatedContext, updatedWeights)
    
    // Add specific adaptations to the prompt
    if (adaptations.length > 0) {
      adaptedPrompt.positive = `${adaptations.join(', ')}, ${adaptedPrompt.positive}`
      adaptedPrompt.metadata.consistency_adaptations = [
        ...adaptedPrompt.metadata.consistency_adaptations,
        ...adaptations
      ]
    }

    return adaptedPrompt
  }

  /**
   * Generate character-specific style tokens for LoRA/textual inversion
   */
  generateCharacterStyleTokens(character: CharacterProfile): string[] {
    const tokens: string[] = []
    
    // Base character token
    const baseToken = `<${character.name.toLowerCase().replace(/\s+/g, '_')}_char>`
    tokens.push(baseToken)
    
    // Physical trait tokens
    if (character.physicalTraits.hairColor && character.physicalTraits.hairStyle) {
      tokens.push(`<${character.name.toLowerCase()}_${character.physicalTraits.hairColor}_${character.physicalTraits.hairStyle}_hair>`)
    }
    
    if (character.physicalTraits.clothing?.primary_outfit) {
      const outfitToken = `<${character.name.toLowerCase()}_${character.physicalTraits.clothing.primary_outfit.replace(/\s+/g, '_')}_outfit>`
      tokens.push(outfitToken)
    }
    
    // Store tokens for character
    this.characterTokens.set(character.id, tokens)
    
    return tokens
  }

  /**
   * Build prompt for turnaround generation with multi-angle consistency
   */
  async generateTurnaroundPrompt(
    character: CharacterProfile,
    viewAngle: string,
    style: string,
    previousViews?: string[]
  ): Promise<GeneratedPrompt> {
    const context: PromptContext = {
      character,
      sceneDescription: `character turnaround sheet, ${viewAngle}, clean white background`,
      targetStyle: style
    }

    // Increase consistency weights for turnarounds
    const weights: PromptWeights = {
      character_identity: 1.5,
      physical_consistency: 1.4,
      style_consistency: 1.2,
      scene_integration: 0.3,
      negative_reinforcement: 1.0,
      quality_enhancement: 0.9
    }

    const basePrompt = await this.generateCharacterPrompt(context, weights)
    
    // Add turnaround-specific elements
    const turnaroundElements = [
      'character reference sheet',
      'model sheet',
      'character design',
      'consistent proportions',
      'clean background',
      'professional character art',
      'turnaround view'
    ]
    
    basePrompt.positive = `${turnaroundElements.join(', ')}, ${basePrompt.positive}`
    
    // Add consistency tokens from previous views
    if (previousViews && previousViews.length > 0) {
      basePrompt.positive += ', consistent with previous views'
    }

    return basePrompt
  }

  // Helper methods

  private initializeTemplates(): void {
    // Character identity templates
    this.templates.set('char_base', {
      id: 'char_base',
      name: 'Character Base Identity',
      category: 'character',
      template: '{character_name}, {character_description}',
      variables: ['character_name', 'character_description'],
      weight: 1.0
    })

    this.templates.set('char_physical', {
      id: 'char_physical',
      name: 'Physical Characteristics',
      category: 'character',
      template: '{hair_description}, {eye_description}, {build_description}, {clothing_description}',
      variables: ['hair_description', 'eye_description', 'build_description', 'clothing_description'],
      weight: 1.2
    })

    // Scene integration templates
    this.templates.set('scene_integration', {
      id: 'scene_integration',
      name: 'Scene Integration',
      category: 'scene',
      template: '{scene_description}, {character_name} in scene',
      variables: ['scene_description', 'character_name'],
      weight: 0.9
    })

    // Style consistency templates
    this.templates.set('style_base', {
      id: 'style_base',
      name: 'Base Style',
      category: 'style',
      template: '{art_style} style, {medium} illustration',
      variables: ['art_style', 'medium'],
      weight: 0.8
    })

    // Quality enhancement templates
    this.templates.set('quality_tech', {
      id: 'quality_tech',
      name: 'Technical Quality',
      category: 'technical',
      template: 'high quality, detailed, masterpiece, professional illustration',
      variables: [],
      weight: 0.6
    })
  }

  private analyzeConsistencyHistory(context: PromptContext): {
    weak_areas: string[]
    strong_areas: string[]
    adaptations: string[]
    average_score: number
  } {
    if (!context.consistencyHistory || context.consistencyHistory.length === 0) {
      return {
        weak_areas: [],
        strong_areas: [],
        adaptations: [],
        average_score: 0
      }
    }

    const recentResults = context.consistencyHistory.slice(-5) // Last 5 results
    const avgScore = recentResults.reduce((sum, r) => sum + r.overallScore, 0) / recentResults.length

    const weakAreas: string[] = []
    const strongAreas: string[] = []
    const adaptations: string[] = []

    // Analyze breakdown scores
    const avgBreakdown: SimilarityBreakdown = {
      overall: 0, facial: 0, body: 0, clothing: 0, pose: 0, style: 0, color: 0
    }

    recentResults.forEach(result => {
      Object.keys(avgBreakdown).forEach(key => {
        avgBreakdown[key as keyof SimilarityBreakdown] += result.breakdown[key as keyof SimilarityBreakdown] || 0
      })
    })

    Object.keys(avgBreakdown).forEach(key => {
      avgBreakdown[key as keyof SimilarityBreakdown] /= recentResults.length
      
      const score = avgBreakdown[key as keyof SimilarityBreakdown]
      if (score < 0.7) {
        weakAreas.push(key)
        adaptations.push(`improve ${key} consistency`)
      } else if (score > 0.9) {
        strongAreas.push(key)
      }
    })

    return {
      weak_areas: weakAreas,
      strong_areas: strongAreas,
      adaptations,
      average_score: avgScore
    }
  }

  private buildCharacterTokens(character: CharacterProfile): string[] {
    const tokens: string[] = []
    
    // Check if character has custom style tokens
    if (character.styleTokens && character.styleTokens.length > 0) {
      tokens.push(...character.styleTokens)
    } else {
      // Generate tokens if they don't exist
      tokens.push(...this.generateCharacterStyleTokens(character))
    }
    
    return tokens
  }

  private async buildPositivePrompt(
    context: PromptContext,
    weights: PromptWeights,
    insights: ReturnType<typeof this.analyzeConsistencyHistory>
  ): Promise<Array<{ content: string; weight: number; category: string }>> {
    const components: Array<{ content: string; weight: number; category: string }> = []

    // Character identity
    let characterDesc = context.character.name
    if (context.character.description) {
      characterDesc += `, ${context.character.description}`
    }
    components.push({
      content: characterDesc,
      weight: weights.character_identity,
      category: 'character'
    })

    // Physical traits with emphasis on weak areas
    const physicalParts: string[] = []
    const traits = context.character.physicalTraits
    
    if (traits.hairColor && traits.hairStyle) {
      const emphasis = insights.weak_areas.includes('facial') ? 'detailed ' : ''
      physicalParts.push(`${emphasis}${traits.hairColor} ${traits.hairStyle} hair`)
    }
    
    if (traits.eyeColor) {
      const emphasis = insights.weak_areas.includes('facial') ? 'expressive ' : ''
      physicalParts.push(`${emphasis}${traits.eyeColor} eyes`)
    }
    
    if (traits.clothing?.primary_outfit) {
      const emphasis = insights.weak_areas.includes('clothing') ? 'detailed ' : ''
      physicalParts.push(`${emphasis}${traits.clothing.primary_outfit}`)
    }

    if (physicalParts.length > 0) {
      components.push({
        content: physicalParts.join(', '),
        weight: weights.physical_consistency,
        category: 'physical'
      })
    }

    // Scene integration
    components.push({
      content: context.sceneDescription,
      weight: weights.scene_integration,
      category: 'scene'
    })

    // Style consistency
    const styleEmphasis = insights.weak_areas.includes('style') ? 'consistent ' : ''
    components.push({
      content: `${styleEmphasis}${context.targetStyle} style children's book illustration`,
      weight: weights.style_consistency,
      category: 'style'
    })

    // Quality enhancement
    components.push({
      content: 'high quality, detailed, masterpiece, professional art',
      weight: weights.quality_enhancement,
      category: 'quality'
    })

    return components
  }

  private async buildNegativePrompt(
    context: PromptContext,
    insights: ReturnType<typeof this.analyzeConsistencyHistory>
  ): Promise<Array<{ content: string; weight: number; category: string }>> {
    const components: Array<{ content: string; weight: number; category: string }> = []

    // Base negative prompts
    components.push({
      content: 'low quality, blurry, distorted, deformed, ugly, bad anatomy, wrong proportions',
      weight: 1.0,
      category: 'quality'
    })

    // Character-specific negatives based on weak areas
    if (insights.weak_areas.includes('facial')) {
      components.push({
        content: 'inconsistent face, different facial features, wrong eye color, wrong hair',
        weight: 1.2,
        category: 'facial'
      })
    }

    if (insights.weak_areas.includes('clothing')) {
      components.push({
        content: 'wrong clothing, different outfit, inconsistent costume',
        weight: 1.1,
        category: 'clothing'
      })
    }

    if (insights.weak_areas.includes('style')) {
      components.push({
        content: 'inconsistent art style, style mixing, different art medium',
        weight: 1.1,
        category: 'style'
      })
    }

    // Child safety
    components.push({
      content: 'scary, frightening, violent, inappropriate, adult content',
      weight: 1.5,
      category: 'safety'
    })

    return components
  }

  private combinePromptComponents(
    components: Array<{ content: string; weight: number; category: string }>,
    weights: PromptWeights
  ): string {
    // Sort by weight and combine
    const sorted = components.sort((a, b) => b.weight - a.weight)
    
    // Apply attention syntax based on weights
    const formatted = sorted.map(comp => {
      if (comp.weight > 1.2) {
        return `((${comp.content}))`
      } else if (comp.weight > 1.0) {
        return `(${comp.content})`
      }
      return comp.content
    })

    return formatted.join(', ')
  }

  private extractStyleTokens(character: CharacterProfile, targetStyle: string): string[] {
    const tokens: string[] = []
    
    // Character tokens
    if (character.styleTokens) {
      tokens.push(...character.styleTokens)
    }
    
    // Style-specific tokens
    const styleTokenMap: Record<string, string[]> = {
      'watercolor': ['<watercolor_style>', '<soft_colors>'],
      'digital-art': ['<digital_art>', '<clean_lines>'],
      'cartoon': ['<cartoon_style>', '<simplified_forms>'],
      'realistic': ['<realistic_rendering>', '<detailed_textures>']
    }
    
    if (styleTokenMap[targetStyle]) {
      tokens.push(...styleTokenMap[targetStyle])
    }
    
    return tokens
  }

  private calculateLoRAWeights(
    context: PromptContext,
    insights: ReturnType<typeof this.analyzeConsistencyHistory>
  ): Record<string, number> {
    const weights: Record<string, number> = {}
    
    // Character LoRA weight based on consistency needs
    if (insights.average_score < 0.7) {
      weights.character_lora = 1.2
    } else {
      weights.character_lora = 0.8
    }
    
    // Style LoRA weights
    weights.style_lora = insights.weak_areas.includes('style') ? 1.1 : 0.7
    
    return weights
  }
}

export const promptEngineeringService = new PromptEngineeringService()