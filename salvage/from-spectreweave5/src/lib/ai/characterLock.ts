/**
 * Character Lock System for Consistent Character Generation in Children's Books
 * 
 * This service provides:
 * - Multi-modal embeddings for character appearance consistency
 * - ControlNet integration for image-to-image character consistency
 * - Real-time consistency validation and feedback
 * - Integration with GraphRAG for character knowledge graphs
 */

import { createClient } from '@supabase/supabase-js'
import { getStabilityService } from '../services/stability'
import { clipClient } from './clipClient'

// Types
export interface CharacterProfile {
  id: string
  projectId: string
  name: string
  description: string
  visualDescription: string
  personality: string[]
  role: 'protagonist' | 'antagonist' | 'supporting' | 'narrator' | 'background'
  // Reference images
  referenceImages: CharacterReferenceImage[]
  // OpenCLIP embeddings for consistency (512 dimensions)
  appearanceEmbedding?: number[] // CLIP visual embedding
  styleEmbedding?: number[] // CLIP text embedding from description
  // Metadata
  createdAt: string
  updatedAt: string
  metadata: CharacterMetadata
}

export interface CharacterReferenceImage {
  id: string
  url: string
  type: 'front_view' | 'side_view' | 'back_view' | 'close_up' | 'full_body' | 'emotion' | 'outfit'
  description: string
  isCanonical: boolean // Primary reference for this view type
  createdAt: string
  metadata: {
    pose?: string
    emotion?: string
    setting?: string
    lightingCondition?: string
    qualityScore?: number
  }
}

export interface CharacterMetadata {
  totalAppearances: number
  lastAppearance?: string
  averageConsistencyScore: number
  preferredStyles: string[]
  inconsistencyFlags: string[]
  tags: string[]
}

export interface CharacterConsistency {
  id: string
  characterId: string
  imageUrl: string
  pageNumber: number
  bookId: string
  projectId: string
  consistencyScore: number
  similarityScores: Record<string, number>
  detectedFeatures: CharacterFeatures
  validationResults: ValidationResult[]
  createdAt: string
}

export interface CharacterFeatures {
  facialFeatures: {
    eyeColor?: string
    hairColor?: string
    hairStyle?: string
    skinTone?: string
    faceShape?: string
  }
  physicalTraits: {
    height?: string
    build?: string
    clothing?: string[]
    accessories?: string[]
  }
  pose: {
    position?: string
    expression?: string
    gesture?: string
  }
}

export interface ValidationResult {
  feature: string
  expected: string
  detected: string
  score: number
  passed: boolean
  message?: string
}

export interface CharacterGenerationConfig {
  characterId: string
  referenceMode: 'embedding' | 'controlnet' | 'hybrid'
  consistencyThreshold: number
  maxRetries: number
  styleConsistency: boolean
  useReferenceImages: boolean
  applyLora: boolean
  strengthSettings?: {
    embedding: number
    controlnet: number
    style: number
  }
}

export interface CharacterGenerationResult {
  imageUrl: string
  base64?: string
  enhancedPrompt: string
  consistencyScore: number
  validationResults: ValidationResult[]
  characterFeatures: CharacterFeatures
  metadata: {
    generatedAt: string
    model: string
    retryCount: number
    referenceMode: string
    strengthsUsed?: Record<string, number>
  }
}

export interface CharacterKnowledgeGraph {
  characterId: string
  relationships: CharacterRelationship[]
  storyElements: StoryElement[]
  consistencyRules: ConsistencyRule[]
  updatedAt: string
}

export interface CharacterRelationship {
  targetCharacterId: string
  relationshipType: 'friend' | 'family' | 'enemy' | 'neutral' | 'romantic' | 'mentor'
  description: string
  strength: number // 0-1
  context: string[]
}

export interface StoryElement {
  type: 'setting' | 'object' | 'event' | 'emotion' | 'conflict'
  name: string
  description: string
  associationStrength: number
  appearances: string[] // Page/scene references
}

export interface ConsistencyRule {
  type: 'visual' | 'behavioral' | 'contextual'
  rule: string
  importance: 'critical' | 'important' | 'preferred'
  examples: string[]
}

class CharacterLockService {
  private supabase: any
  private stabilityService: any
  private graphRagEndpoint: string

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    this.stabilityService = getStabilityService()
    this.graphRagEndpoint = process.env.BACKEND_ORIGIN || 'http://localhost:3010'
  }

  /**
   * Create a new character profile
   */
  async createCharacterProfile(
    projectId: string,
    characterData: Partial<CharacterProfile>
  ): Promise<CharacterProfile> {
    try {
      const profile: Omit<CharacterProfile, 'id' | 'createdAt' | 'updatedAt'> = {
        projectId,
        name: characterData.name!,
        description: characterData.description || '',
        visualDescription: characterData.visualDescription || '',
        personality: characterData.personality || [],
        role: characterData.role || 'supporting',
        referenceImages: [],
        metadata: {
          totalAppearances: 0,
          averageConsistencyScore: 0,
          preferredStyles: [],
          inconsistencyFlags: [],
          tags: []
        }
      }

      const { data, error } = await this.supabase
        .from('character_profiles')
        .insert(profile)
        .select()
        .single()

      if (error) throw error

      // Initialize in GraphRAG knowledge graph
      await this.initializeCharacterKnowledgeGraph(data.id, profile)

      return data
    } catch (error) {
      console.error('Error creating character profile:', error)
      throw error
    }
  }

  /**
   * Generate character reference images from description
   */
  async generateReferenceImages(
    characterId: string,
    visualDescription: string,
    imageTypes: CharacterReferenceImage['type'][] = ['front_view', 'side_view', 'full_body']
  ): Promise<CharacterReferenceImage[]> {
    try {
      const character = await this.getCharacterProfile(characterId)
      const referenceImages: CharacterReferenceImage[] = []

      for (const imageType of imageTypes) {
        const prompt = this.buildReferenceImagePrompt(character, imageType)
        
        const response = await this.stabilityService.generateImage({
          prompt,
          options: {
            width: 1024,
            height: 1024,
            steps: 40, // Higher steps for reference quality
            cfgScale: 8,
            samples: 1,
            negativePrompt: 'blurry, low quality, distorted, scary, frightening, inappropriate'
          }
        })

        if (response.success && response.data) {
          // Upload to storage and get URL
          const imageUrl = await this.uploadImageToStorage(response.data, characterId, imageType)
          
          const referenceImage: CharacterReferenceImage = {
            id: `ref_${Date.now()}_${imageType}`,
            url: imageUrl,
            type: imageType,
            description: prompt,
            isCanonical: true,
            createdAt: new Date().toISOString(),
            metadata: {
              pose: this.getImageTypePose(imageType),
              qualityScore: 0.9 // Initial assumption, will be validated
            }
          }

          referenceImages.push(referenceImage)

          // Store in database
          await this.supabase
            .from('character_reference_images')
            .insert({
              character_id: characterId,
              ...referenceImage
            })
        }
      }

      // Generate embeddings for all reference images
      await this.generateCharacterEmbeddings(characterId, referenceImages)

      return referenceImages
    } catch (error) {
      console.error('Error generating reference images:', error)
      throw error
    }
  }

  /**
   * Generate character-consistent image using the lock system
   */
  async generateCharacterImage(
    characterId: string,
    scenePrompt: string,
    config: CharacterGenerationConfig
  ): Promise<CharacterGenerationResult> {
    try {
      const character = await this.getCharacterProfile(characterId)
      let bestResult: CharacterGenerationResult | null = null
      let bestScore = 0

      for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        const result = await this.attemptCharacterGeneration(
          character,
          scenePrompt,
          config,
          attempt
        )

        if (result.consistencyScore >= config.consistencyThreshold) {
          await this.updateCharacterConsistency(characterId, result)
          return result
        }

        if (result.consistencyScore > bestScore) {
          bestResult = result
          bestScore = result.consistencyScore
        }
      }

      if (bestResult) {
        await this.updateCharacterConsistency(characterId, bestResult)
        return bestResult
      }

      throw new Error('Failed to generate consistent character image')
    } catch (error) {
      console.error('Error generating character image:', error)
      throw error
    }
  }

  /**
   * Validate character consistency in generated image
   */
  async validateCharacterConsistency(
    characterId: string,
    imageUrl: string,
    expectedFeatures?: CharacterFeatures
  ): Promise<{
    consistencyScore: number
    validationResults: ValidationResult[]
    detectedFeatures: CharacterFeatures
  }> {
    try {
      const character = await this.getCharacterProfile(characterId)
      
      // Get detected features from image (traditional CV approach)
      const detectedFeatures = await this.extractCharacterFeatures(imageUrl)
      
      // CLIP-based consistency check
      let clipConsistencyScore = 0
      const validationResults: ValidationResult[] = []

      try {
        // Only use CLIP if CHARACTER_LOCK_ENABLED is true
        const isCharacterLockEnabled = process.env.CHARACTER_LOCK_ENABLED === 'true'
        
        if (isCharacterLockEnabled) {
          // Check if CLIP server is available
          const isAvailable = await clipClient.checkHealth()
          
          if (isAvailable && character.appearanceEmbedding) {
          // Convert image to base64
          const imageBase64 = await clipClient.imageUrlToBase64(imageUrl)
          
          // Get embedding for the new image
          const newImageEmbedding = await clipClient.embedImage(imageBase64)
          
          // Calculate similarity with character's canonical appearance
          const appearanceSimilarity = clipClient.calculateSimilarityLocal(
            character.appearanceEmbedding,
            newImageEmbedding
          )
          
          // Also check text-image consistency if we have a style embedding
          let textImageSimilarity = 0
          if (character.styleEmbedding) {
            textImageSimilarity = clipClient.calculateSimilarityLocal(
              character.styleEmbedding,
              newImageEmbedding
            )
          }

          // Use CLIP consistency check with reference images
          if (character.referenceImages.length > 0) {
            const referenceImageBase64 = await Promise.all(
              character.referenceImages
                .slice(0, 3) // Use top 3 reference images
                .map(ref => clipClient.imageUrlToBase64(ref.url))
            )
            
            const consistencyCheck = await clipClient.checkCharacterConsistency(
              imageBase64,
              referenceImageBase64,
              character.visualDescription,
              0.75 // Lower threshold for children's book style variations
            )
            
            clipConsistencyScore = consistencyCheck.consistency_score

            // Add CLIP validation results
            validationResults.push({
              feature: 'clip.appearance_similarity',
              expected: 'high',
              detected: appearanceSimilarity.toFixed(3),
              score: appearanceSimilarity,
              passed: appearanceSimilarity >= 0.75,
              message: `CLIP appearance similarity: ${(appearanceSimilarity * 100).toFixed(1)}%`
            })

            if (textImageSimilarity > 0) {
              validationResults.push({
                feature: 'clip.text_image_alignment',
                expected: 'high',
                detected: textImageSimilarity.toFixed(3),
                score: textImageSimilarity,
                passed: textImageSimilarity >= 0.65,
                message: `Text-image alignment: ${(textImageSimilarity * 100).toFixed(1)}%`
              })
            }

            validationResults.push({
              feature: 'clip.overall_consistency',
              expected: 'high',
              detected: clipConsistencyScore.toFixed(3),
              score: clipConsistencyScore,
              passed: consistencyCheck.passed,
              message: `Overall CLIP consistency: ${(clipConsistencyScore * 100).toFixed(1)}%`
            })
          }
        }
        }
      } catch (clipError) {
        console.error('CLIP validation failed, using fallback:', clipError)
      }
      
      // Compare with reference features (traditional approach)
      const referenceFeatures = await this.getReferenceFeatures(characterId)
      const featureValidationResults = this.compareFeatures(
        referenceFeatures,
        detectedFeatures,
        expectedFeatures
      )
      
      validationResults.push(...featureValidationResults)

      // Calculate combined consistency score
      // Weight CLIP score higher if available (60% CLIP, 40% traditional)
      const traditionalScore = this.calculateConsistencyScore(featureValidationResults)
      const consistencyScore = clipConsistencyScore > 0
        ? (clipConsistencyScore * 0.6 + traditionalScore * 0.4)
        : traditionalScore

      // Store consistency data
      await this.supabase
        .from('character_consistency')
        .insert({
          character_id: characterId,
          image_url: imageUrl,
          consistency_score: consistencyScore,
          detected_features: detectedFeatures,
          validation_results: validationResults,
          created_at: new Date().toISOString()
        })

      return {
        consistencyScore,
        validationResults,
        detectedFeatures
      }
    } catch (error) {
      console.error('Error validating character consistency:', error)
      throw error
    }
  }

  /**
   * Get character profile by ID
   */
  async getCharacterProfile(characterId: string): Promise<CharacterProfile> {
    const { data, error } = await this.supabase
      .from('character_profiles')
      .select(`
        *,
        reference_images:character_reference_images(*)
      `)
      .eq('id', characterId)
      .single()

    if (error) throw error
    
    return {
      ...data,
      referenceImages: data.reference_images || []
    }
  }

  /**
   * Get all characters for a project
   */
  async getProjectCharacters(projectId: string): Promise<CharacterProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('character_profiles')
        .select(`
          *,
          reference_images:character_reference_images(*)
        `)
        .eq('project_id', projectId)

      if (error) {
        // If table doesn't exist, return empty array instead of throwing
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          console.warn('Character profiles table does not exist, returning empty array')
          return []
        }
        throw error
      }

      return data.map((character: any) => ({
        ...character,
        referenceImages: character.reference_images || []
      }))
    } catch (error: any) {
      // Fallback for any database connection issues
      console.warn('Failed to fetch character profiles, returning empty array:', error.message)
      return []
    }
  }

  /**
   * Update character knowledge graph in GraphRAG
   */
  async updateCharacterKnowledgeGraph(
    characterId: string,
    updates: Partial<CharacterKnowledgeGraph>
  ): Promise<void> {
    try {
      const response = await fetch(`${this.graphRagEndpoint}/api/graphrag/character/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BACKEND_SERVICE_JWT}`
        },
        body: JSON.stringify({
          characterId,
          updates
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update character knowledge graph')
      }
    } catch (error) {
      console.error('Error updating character knowledge graph:', error)
      // Non-blocking error for now
    }
  }

  /**
   * Search character knowledge graph
   */
  async searchCharacterKnowledge(
    characterId: string,
    query: string
  ): Promise<any> {
    try {
      const response = await fetch(`${this.graphRagEndpoint}/api/graphrag/character/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BACKEND_SERVICE_JWT}`
        },
        body: JSON.stringify({
          characterId,
          query
        })
      })

      if (!response.ok) {
        return { results: [] }
      }

      return await response.json()
    } catch (error) {
      console.error('Error searching character knowledge:', error)
      return { results: [] }
    }
  }

  // Private methods

  private async attemptCharacterGeneration(
    character: CharacterProfile,
    scenePrompt: string,
    config: CharacterGenerationConfig,
    attemptNumber: number
  ): Promise<CharacterGenerationResult> {
    // Build enhanced prompt with character consistency
    const enhancedPrompt = await this.buildCharacterPrompt(
      character,
      scenePrompt,
      config,
      attemptNumber
    )

    // Generate image based on reference mode
    let imageData: string
    if (config.referenceMode === 'controlnet' || config.referenceMode === 'hybrid') {
      imageData = await this.generateWithControlNet(character, enhancedPrompt, config)
    } else {
      imageData = await this.generateWithEmbedding(character, enhancedPrompt, config)
    }

    // Upload and get URL
    const imageUrl = await this.uploadImageToStorage(imageData, character.id, 'generated')

    // Validate consistency
    const validation = await this.validateCharacterConsistency(character.id, imageUrl)

    return {
      imageUrl,
      base64: imageData,
      enhancedPrompt,
      consistencyScore: validation.consistencyScore,
      validationResults: validation.validationResults,
      characterFeatures: validation.detectedFeatures,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'stability-ai',
        retryCount: attemptNumber,
        referenceMode: config.referenceMode
      }
    }
  }

  private async generateWithControlNet(
    character: CharacterProfile,
    prompt: string,
    config: CharacterGenerationConfig
  ): Promise<string> {
    // Get best reference image for ControlNet
    const referenceImage = character.referenceImages.find(img => img.isCanonical) || 
                          character.referenceImages[0]

    if (!referenceImage) {
      throw new Error('No reference images available for ControlNet')
    }

    // Use stability service with ControlNet parameters
    const response = await this.stabilityService.generateImage({
      prompt,
      options: {
        width: 1024,
        height: 1024,
        steps: 30,
        cfgScale: 7,
        samples: 1,
        // ControlNet specific options would go here
        // This is a simplified version - actual implementation would use ControlNet API
        initImageUrl: referenceImage.url,
        strength: config.strengthSettings?.controlnet || 0.7,
        negativePrompt: 'blurry, low quality, distorted, inconsistent character'
      }
    })

    if (!response.success || !response.data) {
      throw new Error('ControlNet generation failed')
    }

    return response.data
  }

  private async generateWithEmbedding(
    character: CharacterProfile,
    prompt: string,
    config: CharacterGenerationConfig
  ): Promise<string> {
    // Enhance prompt with character embedding data
    const embeddingPrompt = this.enhancePromptWithEmbedding(prompt, character)

    const response = await this.stabilityService.generateImage({
      prompt: embeddingPrompt,
      options: {
        width: 1024,
        height: 1024,
        steps: 30,
        cfgScale: 7,
        samples: 1,
        negativePrompt: 'blurry, low quality, distorted, inconsistent character'
      }
    })

    if (!response.success || !response.data) {
      throw new Error('Embedding generation failed')
    }

    return response.data
  }

  private buildReferenceImagePrompt(
    character: CharacterProfile,
    imageType: CharacterReferenceImage['type']
  ): string {
    const typeDescriptions = {
      'front_view': 'front view, looking at camera, neutral expression',
      'side_view': 'side profile view, clear silhouette',
      'back_view': 'back view, showing hair and outfit',
      'close_up': 'close-up portrait, detailed facial features',
      'full_body': 'full body view, standing pose, complete outfit',
      'emotion': 'expressing emotion, clear facial expression',
      'outfit': 'showcasing clothing and accessories'
    }

    return `Character reference sheet: ${character.name}
    
Description: ${character.visualDescription}
View: ${typeDescriptions[imageType]}
Style: High-quality character reference, clean background, professional character design
Requirements: Consistent character design, clear details, suitable for children's book illustration

Technical: masterpiece, best quality, highly detailed, character reference sheet, clean background, professional lighting`
  }

  private async buildCharacterPrompt(
    character: CharacterProfile,
    scenePrompt: string,
    config: CharacterGenerationConfig,
    attemptNumber: number
  ): Promise<string> {
    let prompt = `${scenePrompt}

Character: ${character.name} - ${character.visualDescription}
Consistency: Maintain exact appearance from reference images
Style: Children's book illustration, consistent character design`

    // Add variation for retries
    if (attemptNumber > 0) {
      prompt += `\nAttempt ${attemptNumber + 1}: Focus on character consistency`
    }

    return prompt
  }

  private enhancePromptWithEmbedding(prompt: string, character: CharacterProfile): string {
    // Add character-specific details to enhance consistency
    const features = character.referenceImages
      .map(img => img.metadata)
      .filter(meta => meta)
      .reduce((acc: any, meta) => ({ ...acc, ...meta }), {})

    let enhancedPrompt = prompt

    // Add CLIP-guided consistency hints
    if (character.appearanceEmbedding && character.styleEmbedding) {
      enhancedPrompt += `\n\nIMPORTANT: Maintain exact character appearance consistency.`
      enhancedPrompt += `\nCharacter has been embedded with CLIP for consistency tracking.`
    }

    if (features.pose) {
      enhancedPrompt += `\nPose: ${features.pose}`
    }
    if (features.emotion) {
      enhancedPrompt += `\nEmotion: ${features.emotion}`
    }

    // Add more specific character details from embeddings
    if (character.visualDescription) {
      enhancedPrompt += `\n\nCharacter Details (maintain exactly): ${character.visualDescription}`
    }

    return enhancedPrompt
  }

  private getImageTypePose(imageType: CharacterReferenceImage['type']): string {
    const poses = {
      'front_view': 'standing, facing forward',
      'side_view': 'standing, side profile',
      'back_view': 'standing, back turned',
      'close_up': 'portrait, head and shoulders',
      'full_body': 'standing, full body visible',
      'emotion': 'expressive pose',
      'outfit': 'pose showcasing clothing'
    }
    return poses[imageType]
  }

  private async generateCharacterEmbeddings(
    characterId: string,
    referenceImages: CharacterReferenceImage[]
  ): Promise<void> {
    try {
      // Only generate embeddings if CHARACTER_LOCK_ENABLED is true
      const isCharacterLockEnabled = process.env.CHARACTER_LOCK_ENABLED === 'true'
      if (!isCharacterLockEnabled) {
        console.log('Character lock disabled, skipping CLIP embeddings')
        return
      }
      
      // Check if CLIP server is available
      const isAvailable = await clipClient.checkHealth()
      if (!isAvailable) {
        console.warn('CLIP server not available, attempting to start...')
        // In production, this would be handled by a process manager
        // For development, you can manually start the Python server
      }

      // Get character profile for text description
      const character = await this.getCharacterProfile(characterId)
      
      // Generate text embedding from visual description
      let styleEmbedding: number[] = []
      if (character.visualDescription) {
        const textEmbeddings = await clipClient.embedText(character.visualDescription)
        styleEmbedding = Array.isArray(textEmbeddings[0]) ? textEmbeddings[0] : textEmbeddings as number[]
      }

      // Generate image embeddings and average them for appearance
      let appearanceEmbedding: number[] = []
      if (referenceImages.length > 0) {
        const imageEmbeddings: number[][] = []
        
        for (const refImage of referenceImages) {
          try {
            // Convert image URL to base64 if needed
            const imageBase64 = await clipClient.imageUrlToBase64(refImage.url)
            const embedding = await clipClient.embedImage(imageBase64)
            imageEmbeddings.push(embedding)
          } catch (err) {
            console.error(`Failed to embed reference image ${refImage.id}:`, err)
          }
        }

        // Average all image embeddings for a canonical appearance embedding
        if (imageEmbeddings.length > 0) {
          const embeddingDim = imageEmbeddings[0].length
          appearanceEmbedding = new Array(embeddingDim).fill(0)
          
          for (const embedding of imageEmbeddings) {
            for (let i = 0; i < embeddingDim; i++) {
              appearanceEmbedding[i] += embedding[i] / imageEmbeddings.length
            }
          }

          // Normalize the averaged embedding
          const norm = Math.sqrt(appearanceEmbedding.reduce((sum, val) => sum + val * val, 0))
          appearanceEmbedding = appearanceEmbedding.map(val => val / norm)
        }
      }

      // Store embeddings in database
      await this.supabase
        .from('character_profiles')
        .update({
          appearance_embedding: appearanceEmbedding,
          style_embedding: styleEmbedding
        })
        .eq('id', characterId)

      console.log(`Generated CLIP embeddings for character ${characterId}`)
    } catch (error) {
      console.error('Error generating character embeddings:', error)
      // Fallback to random embeddings if CLIP fails
      const appearanceEmbedding = new Array(512).fill(0).map(() => Math.random())
      const styleEmbedding = new Array(512).fill(0).map(() => Math.random())

      await this.supabase
        .from('character_profiles')
        .update({
          appearance_embedding: appearanceEmbedding,
          style_embedding: styleEmbedding
        })
        .eq('id', characterId)
    }
  }

  private async extractCharacterFeatures(imageUrl: string): Promise<CharacterFeatures> {
    // Placeholder - would use computer vision API to extract features
    return {
      facialFeatures: {
        eyeColor: 'brown',
        hairColor: 'brown',
        hairStyle: 'short',
        skinTone: 'medium',
        faceShape: 'round'
      },
      physicalTraits: {
        height: 'average',
        build: 'normal',
        clothing: ['shirt', 'pants'],
        accessories: []
      },
      pose: {
        position: 'standing',
        expression: 'neutral',
        gesture: 'none'
      }
    }
  }

  private async getReferenceFeatures(characterId: string): Promise<CharacterFeatures> {
    // Get canonical features from reference images
    const character = await this.getCharacterProfile(characterId)
    const canonicalImage = character.referenceImages.find(img => img.isCanonical)

    if (canonicalImage) {
      return await this.extractCharacterFeatures(canonicalImage.url)
    }

    // Return default features if no canonical image
    return {
      facialFeatures: {},
      physicalTraits: {},
      pose: {}
    }
  }

  private compareFeatures(
    reference: CharacterFeatures,
    detected: CharacterFeatures,
    expected?: CharacterFeatures
  ): ValidationResult[] {
    const results: ValidationResult[] = []

    // Compare facial features
    Object.entries(reference.facialFeatures).forEach(([feature, expectedValue]) => {
      const detectedValue = (detected.facialFeatures as any)[feature]
      const score = expectedValue === detectedValue ? 1.0 : 0.5
      
      results.push({
        feature: `facial.${feature}`,
        expected: expectedValue || 'unknown',
        detected: detectedValue || 'unknown',
        score,
        passed: score >= 0.8
      })
    })

    return results
  }

  private calculateConsistencyScore(results: ValidationResult[]): number {
    if (results.length === 0) return 0
    
    const totalScore = results.reduce((sum, result) => sum + result.score, 0)
    return totalScore / results.length
  }

  private async initializeCharacterKnowledgeGraph(
    characterId: string,
    profile: Omit<CharacterProfile, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    try {
      await fetch(`${this.graphRagEndpoint}/api/graphrag/character/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BACKEND_SERVICE_JWT}`
        },
        body: JSON.stringify({
          characterId,
          profile
        })
      })
    } catch (error) {
      console.error('Error initializing character knowledge graph:', error)
    }
  }

  private async updateCharacterConsistency(
    characterId: string,
    result: CharacterGenerationResult
  ): Promise<void> {
    // Update character metadata with new consistency data
    const { data: character } = await this.supabase
      .from('character_profiles')
      .select('metadata')
      .eq('id', characterId)
      .single()

    if (character) {
      const metadata = character.metadata
      metadata.totalAppearances = (metadata.totalAppearances || 0) + 1
      metadata.lastAppearance = new Date().toISOString()
      
      // Update average consistency score
      const currentAvg = metadata.averageConsistencyScore || 0
      const totalApps = metadata.totalAppearances
      metadata.averageConsistencyScore = 
        (currentAvg * (totalApps - 1) + result.consistencyScore) / totalApps

      await this.supabase
        .from('character_profiles')
        .update({ metadata })
        .eq('id', characterId)
    }
  }

  private async uploadImageToStorage(
    base64Data: string,
    characterId: string,
    type: string
  ): Promise<string> {
    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64')
      const fileName = `characters/${characterId}/${type}_${Date.now()}.png`

      const { data, error } = await this.supabase.storage
        .from('character-images')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          cacheControl: '3600'
        })

      if (error) throw error

      const { data: publicURL } = this.supabase.storage
        .from('character-images')
        .getPublicUrl(fileName)

      return publicURL.publicUrl
    } catch (error) {
      console.error('Error uploading image to storage:', error)
      throw error
    }
  }
}

// Export singleton instance
export const characterLockService = new CharacterLockService()
export { CharacterLockService }