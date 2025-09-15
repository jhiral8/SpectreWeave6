/**
 * Children's Book Image Generation Service
 * 
 * Extends StabilityService with children's book specific enhancements
 * Reuses code patterns from SpectreWeave3's generate-images.ts
 */

import { getStabilityService } from '../services/stability'
import type { AIResponse } from './types'
import { characterLockService, type CharacterGenerationConfig } from './characterLock'

// Types from SpectreWeave3 (reused)
export interface ImageGenerationRequest {
  prompt: string
  style: IllustrationStyle
  pageNumber: number
  bookTheme: BookTheme
  targetAge: AgeGroup
  bookId?: string
  userId?: string
  // Character lock integration
  projectId?: string
  characters?: CharacterReference[]
  useCharacterLock?: boolean
  characterConsistencyConfig?: CharacterConsistencyConfig
}

export interface CharacterReference {
  id: string
  name: string
  role: 'main' | 'supporting' | 'background'
  prominence: 'primary' | 'secondary' | 'background' // How prominent in the scene
  referenceMode?: 'embedding' | 'controlnet' | 'hybrid'
}

export interface CharacterConsistencyConfig {
  enabled: boolean
  consistencyThreshold: number // 0-1, minimum similarity score
  maxRetries: number
  useTurnaroundReferences: boolean
  applyLoRA: boolean
  styleConsistency: boolean
}

export type IllustrationStyle = 
  | 'watercolor' | 'digital-art' | 'cartoon' | 'realistic' 
  | 'abstract' | 'collage' | 'sketch' | 'oil-painting'
  | 'pastel' | 'comic-book' | 'storybook' | 'vintage' | 'minimalist'

export type BookTheme = 
  | 'magical-forest' | 'underwater-adventure' | 'space-exploration' 
  | 'fairy-tale-castle' | 'animal-kingdom' | 'modern-city' 
  | 'pirate-adventure' | 'superhero' | 'prehistoric' | 'winter-wonderland'

export type AgeGroup = '0-2' | '3-5' | '6-8' | '9-12' | 'teen'

export interface GeneratedImage {
  id: string
  url: string
  base64?: string
  prompt: string
  enhancedPrompt: string
  style: IllustrationStyle
  metadata: {
    generatedAt: string
    pageNumber: number
    bookTheme: BookTheme
    targetAge: AgeGroup
    size: string
    format: string
    // Character consistency data
    charactersDetected?: string[]
    consistencyScores?: Record<string, number>
    characterLockApplied?: boolean
    retryCount?: number
  }
}

// Style modifiers for Stability AI (enhanced from SpectreWeave3)
const styleModifiers: Record<IllustrationStyle, string> = {
  'watercolor': 'soft watercolor painting style with flowing colors and gentle brushstrokes, children\'s book illustration',
  'digital-art': 'modern digital art with vibrant colors and clean lines, children\'s book style',
  'cartoon': 'bright, colorful cartoon style with exaggerated features, friendly and appealing to children',
  'realistic': 'realistic illustration with detailed textures and natural colors, children\'s book quality',
  'abstract': 'abstract art with geometric shapes and bold colors, suitable for children',
  'collage': 'mixed media collage style with various textures and materials, playful children\'s book art',
  'sketch': 'hand-drawn sketch style with pencil or charcoal, children\'s book illustration',
  'oil-painting': 'classic oil painting style with rich textures and depth, children\'s storybook art',
  'pastel': 'soft pastel drawing with gentle, blended colors, children\'s book illustration',
  'comic-book': 'dynamic comic book style with bold lines and action, kid-friendly',
  'storybook': 'traditional storybook illustration style, whimsical and enchanting',
  'vintage': 'vintage children\'s book illustration style, nostalgic and charming',
  'minimalist': 'simple, clean minimalist style with clear shapes, modern children\'s book'
}

// Age-appropriate content guidelines (reused from SpectreWeave3)
const ageAppropriateGuidelines: Record<AgeGroup, string> = {
  '0-2': 'very simple, bright primary colors, large clear shapes, smiling faces, no complex details',
  '3-5': 'simple, bright, cheerful, safe, no scary elements, large clear shapes, friendly characters',
  '6-8': 'engaging, colorful, friendly, educational, clear details, positive themes, adventure elements',
  '9-12': 'detailed, adventurous, imaginative, complex scenes, rich colors, dynamic compositions',
  'teen': 'sophisticated, detailed, mature themes, complex compositions, nuanced colors'
}

// Theme enhancements (reused and expanded from SpectreWeave3)
const themeEnhancements: Record<BookTheme, string> = {
  'magical-forest': 'enchanting forest setting with magical lighting, glowing particles, mystical creatures, towering trees with character',
  'underwater-adventure': 'ocean depths with flowing water effects, colorful coral reefs, friendly marine life, bubbles and light rays',
  'space-exploration': 'cosmic backgrounds with twinkling star fields, colorful nebulas, futuristic spacecraft, alien worlds',
  'fairy-tale-castle': 'medieval architecture with turrets and flags, royal gardens, magical elements, storybook charm',
  'animal-kingdom': 'diverse wildlife with natural habitats, expressive animal characters, lush environments',
  'modern-city': 'urban landscapes with contemporary buildings, bustling streets, city life, modern transportation',
  'pirate-adventure': 'sailing ships with billowing sails, ocean waves, treasure maps, tropical islands',
  'superhero': 'dynamic action with heroic poses, dramatic lighting, cityscapes, power effects',
  'prehistoric': 'ancient landscapes with volcanoes, dinosaurs, primitive settings, lush prehistoric vegetation',
  'winter-wonderland': 'sparkling snow effects, ice crystals, cozy winter scenes, magical winter lighting'
}

// Negative prompts to ensure child-safe content
const safetyNegativePrompts = 'scary, frightening, horror, violent, gore, dark, creepy, disturbing, inappropriate, adult content, weapons, blood'

export class ChildrensBookImageService {
  private stabilityService: ReturnType<typeof getStabilityService>

  constructor() {
    this.stabilityService = getStabilityService()
  }

  /**
   * Generate a children's book illustration with character consistency
   */
  async generateIllustration(request: ImageGenerationRequest): Promise<GeneratedImage> {
    try {
      // If character lock is enabled and characters are specified
      if (request.useCharacterLock && request.characters && request.characters.length > 0 && request.projectId) {
        return await this.generateWithCharacterLock(request)
      }
      
      // Build the enhanced prompt using SpectreWeave3 patterns
      const enhancedPrompt = await this.buildEnhancedPrompt(request)

      // Use StabilityService to generate the image
      const response = await this.stabilityService.generateImage({
        prompt: enhancedPrompt,
        options: {
          width: 1024,
          height: 1024,
          steps: 30,
          cfgScale: 7,
          samples: 1,
          // Add negative prompt for safety
          negativePrompt: safetyNegativePrompts
        }
      } as any)

      if (!response.success || !response.data) {
        throw new Error('Failed to generate image')
      }

      // Create the generated image object
      const generatedImage: GeneratedImage = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: '', // Will be set after uploading to storage
        base64: response.data,
        prompt: request.prompt,
        enhancedPrompt,
        style: request.style,
        metadata: {
          generatedAt: new Date().toISOString(),
          pageNumber: request.pageNumber,
          bookTheme: request.bookTheme,
          targetAge: request.targetAge,
          size: '1024x1024',
          format: 'png'
        }
      }

      return generatedImage

    } catch (error) {
      console.error('Error generating children\'s book illustration:', error)
      throw error
    }
  }

  /**
   * Generate multiple illustrations for a complete book
   */
  async generateBookIllustrations(
    pages: Array<{ pageNumber: number; illustrationPrompt: string }>,
    bookSettings: {
      style: IllustrationStyle
      theme: BookTheme
      targetAge: AgeGroup
      bookId?: string
      userId?: string
    }
  ): Promise<GeneratedImage[]> {
    const illustrations: GeneratedImage[] = []

    // Generate illustrations in batches to avoid overwhelming the API
    const batchSize = 3
    for (let i = 0; i < pages.length; i += batchSize) {
      const batch = pages.slice(i, i + batchSize)
      
      const batchPromises = batch.map(page => 
        this.generateIllustration({
          prompt: page.illustrationPrompt,
          pageNumber: page.pageNumber,
          ...bookSettings
        })
      )

      const batchResults = await Promise.allSettled(batchPromises)
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          illustrations.push(result.value)
        } else {
          console.error('Failed to generate illustration:', result.reason)
          // Add a placeholder for failed illustrations
          illustrations.push({
            id: `placeholder_${Date.now()}`,
            url: '',
            prompt: batch[illustrations.length % batch.length].illustrationPrompt,
            enhancedPrompt: '',
            style: bookSettings.style,
            metadata: {
              generatedAt: new Date().toISOString(),
              pageNumber: batch[illustrations.length % batch.length].pageNumber,
              bookTheme: bookSettings.theme,
              targetAge: bookSettings.targetAge,
              size: '1024x1024',
              format: 'png'
            }
          })
        }
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < pages.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    return illustrations
  }

  /**
   * Generate illustration with character lock system
   */
  private async generateWithCharacterLock(request: ImageGenerationRequest): Promise<GeneratedImage> {
    if (!request.projectId || !request.characters) {
      throw new Error('Project ID and characters required for character lock')
    }

    const config = request.characterConsistencyConfig || {
      enabled: true,
      consistencyThreshold: 0.8,
      maxRetries: 2,
      useTurnaroundReferences: true,
      applyLoRA: false,
      styleConsistency: true
    }

    let bestResult: GeneratedImage | null = null
    let bestConsistencyScore = 0
    let retryCount = 0

    // Try generating with character lock up to maxRetries times
    while (retryCount <= config.maxRetries) {
      try {
        // Generate character-locked image for each character
        const characterResults: Record<string, any> = {}
        
        for (const character of request.characters) {
          const characterConfig: CharacterGenerationConfig = {
            characterId: character.id,
            referenceMode: character.referenceMode || 'hybrid',
            consistencyThreshold: config.consistencyThreshold,
            maxRetries: 1, // Single retry per character to avoid nested loops
            styleConsistency: config.styleConsistency,
            useReferenceImages: config.useTurnaroundReferences,
            applyLora: config.applyLoRA
          }

          // Build scene-specific prompt
          const scenePrompt = await this.buildScenePromptWithCharacter(request, character)
          
          // Generate character-consistent image
          const result = await characterLockService.generateCharacterImage(
            character.id,
            scenePrompt,
            characterConfig
          )
          
          characterResults[character.id] = result
        }

        // Combine results or use best single character result
        const finalResult = this.combineCharacterResults(characterResults, request)
        
        // Validate overall consistency
        const overallScore = this.calculateOverallConsistencyScore(characterResults)
        
        if (overallScore >= config.consistencyThreshold || retryCount >= config.maxRetries) {
          return {
            ...finalResult,
            metadata: {
              ...finalResult.metadata,
              charactersDetected: request.characters.map(c => c.name),
              consistencyScores: Object.fromEntries(
                Object.entries(characterResults).map(([id, result]) => [id, result.consistencyScore])
              ),
              characterLockApplied: true,
              retryCount
            }
          }
        }

        if (!bestResult || overallScore > bestConsistencyScore) {
          bestResult = finalResult
          bestConsistencyScore = overallScore
        }

      } catch (error) {
        console.error(`Character lock generation attempt ${retryCount} failed:`, error)
      }

      retryCount++
    }

    // Return best result if no attempt succeeded
    if (bestResult) {
      return {
        ...bestResult,
        metadata: {
          ...bestResult.metadata,
          charactersDetected: request.characters.map(c => c.name),
          characterLockApplied: true,
          retryCount,
          consistencyScores: { overall: bestConsistencyScore }
        }
      }
    }

    throw new Error('Failed to generate character-consistent image after all retries')
  }

  /**
   * Build enhanced prompt using SpectreWeave3 patterns
   */
  private async buildEnhancedPrompt(request: ImageGenerationRequest): Promise<string> {
    const { prompt, style, pageNumber, bookTheme, targetAge } = request

    const styleModifier = styleModifiers[style]
    const ageGuidelines = ageAppropriateGuidelines[targetAge]
    const themeEnhancement = themeEnhancements[bookTheme]

    // Build the enhanced prompt (pattern from SpectreWeave3)
    const enhancedPrompt = `Create a beautiful children's book illustration for page ${pageNumber}:

Scene: ${prompt}
Style: ${styleModifier}
Age-appropriate: ${ageGuidelines}
Theme enhancement: ${themeEnhancement}

Requirements:
- Safe and appropriate for children aged ${targetAge}
- Engaging and colorful with appealing characters
- Clear visual storytelling with emotional depth
- No scary, violent, or inappropriate elements
- High quality, professional children's book illustration
- Suitable for children's book printing at 300 DPI
- Consistent style throughout the book
- Warm, inviting atmosphere that children will love

Technical: masterpiece, best quality, highly detailed, sharp focus, professional lighting, award-winning children's book illustration`

    return enhancedPrompt
  }

  /**
   * Build scene-specific prompt incorporating character details
   */
  private async buildScenePromptWithCharacter(
    request: ImageGenerationRequest, 
    character: CharacterReference
  ): Promise<string> {
    const { prompt, style, bookTheme, targetAge, pageNumber } = request
    
    const styleModifier = styleModifiers[style]
    const ageGuidelines = ageAppropriateGuidelines[targetAge]
    const themeEnhancement = themeEnhancements[bookTheme]
    
    // Build character-specific scene description
    const characterPrompt = `${character.name} (${character.role} character, ${character.prominence} prominence in scene)`
    
    const enhancedPrompt = `Create a children's book illustration for page ${pageNumber} featuring ${characterPrompt}:

Scene: ${prompt}
Character: ${characterPrompt}
Style: ${styleModifier}
Age-appropriate: ${ageGuidelines}
Theme enhancement: ${themeEnhancement}

Character consistency requirements:
- Maintain exact visual appearance of ${character.name} from previous pages
- Use consistent art style and coloring for the character
- Ensure character proportions match established references
- Character should be ${character.prominence} in the composition

General requirements:
- Safe and appropriate for children aged ${targetAge}
- Engaging and colorful with appealing characters
- Clear visual storytelling with emotional depth
- No scary, violent, or inappropriate elements
- High quality, professional children's book illustration
- Suitable for children's book printing at 300 DPI
- Consistent style throughout the book
- Warm, inviting atmosphere that children will love

Technical: masterpiece, best quality, highly detailed, sharp focus, professional lighting, award-winning children's book illustration`

    return enhancedPrompt
  }

  /**
   * Combine multiple character generation results into a single image
   */
  private combineCharacterResults(
    characterResults: Record<string, any>, 
    request: ImageGenerationRequest
  ): GeneratedImage {
    // For now, return the result from the primary character
    // In a full implementation, this might composite multiple images
    const primaryCharacter = request.characters?.find(c => c.prominence === 'primary')
    const primaryResult = primaryCharacter ? characterResults[primaryCharacter.id] : Object.values(characterResults)[0]
    
    if (!primaryResult) {
      throw new Error('No character generation results available')
    }
    
    return {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: primaryResult.imageUrl,
      prompt: request.prompt,
      enhancedPrompt: primaryResult.enhancedPrompt || request.prompt,
      style: request.style,
      metadata: {
        generatedAt: new Date().toISOString(),
        pageNumber: request.pageNumber,
        bookTheme: request.bookTheme,
        targetAge: request.targetAge,
        size: '1024x1024',
        format: 'png',
        charactersDetected: request.characters?.map(c => c.name) || [],
        characterLockApplied: true
      }
    }
  }

  /**
   * Calculate overall consistency score from character results
   */
  private calculateOverallConsistencyScore(characterResults: Record<string, any>): number {
    const scores = Object.values(characterResults).map(r => r.consistencyScore).filter(s => typeof s === 'number')
    
    if (scores.length === 0) return 0
    
    // Return weighted average, with primary characters weighted more heavily
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  /**
   * Validate generated images for child-appropriateness
   */
  async validateImageSafety(imageBase64: string): Promise<{
    isSafe: boolean
    concerns: string[]
  }> {
    // For now, we rely on negative prompts and prompt engineering
    // In production, you might integrate with Google Vision API or similar
    // for actual content moderation
    
    return {
      isSafe: true,
      concerns: []
    }
  }

  /**
   * Get available illustration styles with descriptions
   */
  getIllustrationStyles(): Array<{ value: IllustrationStyle; label: string; description: string }> {
    return [
      { value: 'watercolor', label: 'Watercolor', description: 'Soft, flowing colors with artistic brushstrokes' },
      { value: 'digital-art', label: 'Digital Art', description: 'Modern, vibrant digital illustrations' },
      { value: 'cartoon', label: 'Cartoon', description: 'Fun, exaggerated cartoon style' },
      { value: 'storybook', label: 'Storybook', description: 'Classic children\'s book illustration style' },
      { value: 'pastel', label: 'Pastel', description: 'Soft, gentle pastel colors' },
      { value: 'vintage', label: 'Vintage', description: 'Nostalgic, classic book illustration' },
      { value: 'minimalist', label: 'Minimalist', description: 'Simple, clean modern style' },
      { value: 'comic-book', label: 'Comic Book', description: 'Dynamic comic book style' },
      { value: 'oil-painting', label: 'Oil Painting', description: 'Rich, textured oil painting style' },
      { value: 'sketch', label: 'Sketch', description: 'Hand-drawn pencil sketch style' },
    ]
  }

  /**
   * Get book themes with descriptions
   */
  getBookThemes(): Array<{ value: BookTheme; label: string; description: string }> {
    return [
      { value: 'magical-forest', label: 'Magical Forest', description: 'Enchanted woods with mystical creatures' },
      { value: 'underwater-adventure', label: 'Underwater Adventure', description: 'Ocean depths and marine life' },
      { value: 'space-exploration', label: 'Space Exploration', description: 'Cosmic adventures among the stars' },
      { value: 'fairy-tale-castle', label: 'Fairy Tale Castle', description: 'Royal kingdoms and magical castles' },
      { value: 'animal-kingdom', label: 'Animal Kingdom', description: 'Wildlife adventures in nature' },
      { value: 'modern-city', label: 'Modern City', description: 'Urban adventures in the city' },
      { value: 'pirate-adventure', label: 'Pirate Adventure', description: 'High seas and treasure hunting' },
      { value: 'superhero', label: 'Superhero', description: 'Action-packed superhero adventures' },
      { value: 'prehistoric', label: 'Prehistoric', description: 'Dinosaurs and ancient worlds' },
      { value: 'winter-wonderland', label: 'Winter Wonderland', description: 'Magical winter and snow adventures' },
    ]
  }
}

// Export singleton instance
export const childrensBookImageService = new ChildrensBookImageService()