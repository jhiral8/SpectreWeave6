/**
 * ControlNet Conditioning System
 * 
 * Implements image-to-image generation with ControlNet for character consistency
 * Provides structured conditioning for pose, depth, edge, and reference guidance
 */

import type { CharacterProfile, ReferenceImage } from './characterLock'

export interface ControlNetConfig {
  type: 'pose' | 'depth' | 'edge' | 'reference' | 'scribble' | 'segmentation'
  strength: number // 0.0 - 2.0, how strongly to apply the conditioning
  guidance_start: number // 0.0 - 1.0, when to start applying guidance
  guidance_end: number // 0.0 - 1.0, when to stop applying guidance
  processor?: string // Specific preprocessor for the control type
}

export interface ControlNetInput {
  image: string // Base64 or URL of control image
  config: ControlNetConfig
  description?: string
}

export interface ImageToImageRequest {
  prompt: string
  base_image: string // Reference image for character consistency
  control_inputs: ControlNetInput[]
  strength: number // Overall img2img strength
  character_embedding?: number[] // Character embedding for consistency
  style_tokens?: string[] // LoRA tokens for character consistency
  generation_config: {
    steps: number
    guidance_scale: number
    scheduler: string
    seed?: number
  }
}

export interface ControlNetResult {
  image_url: string
  control_images: Record<string, string> // Processed control images
  metadata: {
    applied_controls: string[]
    processing_time: number
    consistency_score?: number
    model_used: string
    seed: number
  }
}

export class ControlNetService {
  private apiEndpoint: string
  private apiKey: string

  constructor() {
    this.apiEndpoint = process.env.CONTROLNET_API_ENDPOINT || 'http://localhost:7860'
    this.apiKey = process.env.CONTROLNET_API_KEY || ''
  }

  /**
   * Generate image using ControlNet conditioning with character consistency
   */
  async generateWithControlNet(request: ImageToImageRequest): Promise<ControlNetResult> {
    try {
      // Prepare control inputs
      const processedControls = await this.preprocessControlInputs(request.control_inputs)
      
      // Build the generation request
      const generationRequest = {
        prompt: request.prompt,
        init_images: [request.base_image],
        control_inputs: processedControls,
        
        // Character consistency parameters
        character_embedding: request.character_embedding,
        style_tokens: request.style_tokens,
        
        // Generation parameters
        steps: request.generation_config.steps,
        cfg_scale: request.generation_config.guidance_scale,
        sampler_name: request.generation_config.scheduler,
        seed: request.generation_config.seed || -1,
        denoising_strength: request.strength,
        
        // Output settings
        width: 1024,
        height: 1024,
        batch_size: 1,
        
        // ControlNet specific
        alwayson_scripts: {
          controlnet: {
            args: processedControls.map(control => ({
              enabled: true,
              module: control.config.processor || 'none',
              model: this.getControlNetModel(control.config.type),
              weight: control.config.strength,
              guidance_start: control.config.guidance_start,
              guidance_end: control.config.guidance_end,
              input_image: control.image,
              processor_res: 1024,
              threshold_a: 64,
              threshold_b: 64
            }))
          }
        }
      }

      const startTime = Date.now()
      
      // Call ControlNet API
      const response = await fetch(`${this.apiEndpoint}/sdapi/v1/img2img`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
        },
        body: JSON.stringify(generationRequest)
      })

      if (!response.ok) {
        throw new Error(`ControlNet API error: ${response.statusText}`)
      }

      const result = await response.json()
      const processingTime = Date.now() - startTime

      // Process control images for metadata
      const controlImages: Record<string, string> = {}
      processedControls.forEach((control, index) => {
        controlImages[control.config.type] = control.processed_image || control.image
      })

      return {
        image_url: `data:image/png;base64,${result.images[0]}`,
        control_images: controlImages,
        metadata: {
          applied_controls: processedControls.map(c => c.config.type),
          processing_time: processingTime,
          model_used: 'controlnet_v1.1',
          seed: result.info?.seed || request.generation_config.seed || -1
        }
      }

    } catch (error) {
      console.error('ControlNet generation error:', error)
      throw error
    }
  }

  /**
   * Create character-consistent pose from reference image
   */
  async createPoseControl(
    referenceImage: ReferenceImage,
    targetPose: string
  ): Promise<ControlNetInput> {
    try {
      // Extract pose from reference image
      const poseResponse = await fetch(`${this.apiEndpoint}/controlnet/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
        },
        body: JSON.stringify({
          controlnet_module: 'openpose',
          controlnet_input_images: [referenceImage.url],
          controlnet_processor_res: 1024,
          controlnet_threshold_a: 64,
          controlnet_threshold_b: 64
        })
      })

      if (!poseResponse.ok) {
        throw new Error('Failed to extract pose from reference image')
      }

      const poseData = await poseResponse.json()

      return {
        image: poseData.images[0],
        config: {
          type: 'pose',
          strength: 1.0,
          guidance_start: 0.0,
          guidance_end: 0.8,
          processor: 'openpose'
        },
        description: `Pose control from ${referenceImage.type} reference`
      }

    } catch (error) {
      console.error('Error creating pose control:', error)
      throw error
    }
  }

  /**
   * Create depth control from reference image for better spatial consistency
   */
  async createDepthControl(referenceImage: ReferenceImage): Promise<ControlNetInput> {
    try {
      const depthResponse = await fetch(`${this.apiEndpoint}/controlnet/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
        },
        body: JSON.stringify({
          controlnet_module: 'depth_midas',
          controlnet_input_images: [referenceImage.url],
          controlnet_processor_res: 1024
        })
      })

      if (!depthResponse.ok) {
        throw new Error('Failed to extract depth from reference image')
      }

      const depthData = await depthResponse.json()

      return {
        image: depthData.images[0],
        config: {
          type: 'depth',
          strength: 0.7,
          guidance_start: 0.0,
          guidance_end: 0.7,
          processor: 'depth_midas'
        },
        description: `Depth control from ${referenceImage.type} reference`
      }

    } catch (error) {
      console.error('Error creating depth control:', error)
      throw error
    }
  }

  /**
   * Create edge control for maintaining character silhouette
   */
  async createEdgeControl(referenceImage: ReferenceImage): Promise<ControlNetInput> {
    try {
      const edgeResponse = await fetch(`${this.apiEndpoint}/controlnet/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
        },
        body: JSON.stringify({
          controlnet_module: 'canny',
          controlnet_input_images: [referenceImage.url],
          controlnet_processor_res: 1024,
          controlnet_threshold_a: 100,
          controlnet_threshold_b: 200
        })
      })

      if (!edgeResponse.ok) {
        throw new Error('Failed to extract edges from reference image')
      }

      const edgeData = await edgeResponse.json()

      return {
        image: edgeData.images[0],
        config: {
          type: 'edge',
          strength: 0.8,
          guidance_start: 0.0,
          guidance_end: 0.6,
          processor: 'canny'
        },
        description: `Edge control from ${referenceImage.type} reference`
      }

    } catch (error) {
      console.error('Error creating edge control:', error)
      throw error
    }
  }

  /**
   * Generate character-consistent image using multiple ControlNet inputs
   */
  async generateCharacterConsistentImage(
    character: CharacterProfile,
    scenePrompt: string,
    baseImage?: string,
    options: {
      usePose?: boolean
      useDepth?: boolean
      useEdge?: boolean
      strength?: number
      steps?: number
      guidanceScale?: number
    } = {}
  ): Promise<ControlNetResult> {
    try {
      if (!character.referenceImages || character.referenceImages.length === 0) {
        throw new Error('No reference images available for character consistency')
      }

      // Select best reference image (prioritize front view)
      const frontView = character.referenceImages.find(img => img.type === 'front')
      const referenceImage = frontView || character.referenceImages[0]

      // Prepare control inputs based on options
      const controlInputs: ControlNetInput[] = []

      if (options.usePose !== false) {
        const poseControl = await this.createPoseControl(referenceImage, scenePrompt)
        controlInputs.push(poseControl)
      }

      if (options.useDepth) {
        const depthControl = await this.createDepthControl(referenceImage)
        controlInputs.push(depthControl)
      }

      if (options.useEdge) {
        const edgeControl = await this.createEdgeControl(referenceImage)
        controlInputs.push(edgeControl)
      }

      // Build enhanced prompt with character details
      const enhancedPrompt = this.buildCharacterPrompt(character, scenePrompt)

      const request: ImageToImageRequest = {
        prompt: enhancedPrompt,
        base_image: baseImage || referenceImage.url,
        control_inputs: controlInputs,
        strength: options.strength || 0.7,
        character_embedding: character.characterEmbeddings?.master,
        style_tokens: character.styleTokens,
        generation_config: {
          steps: options.steps || 30,
          guidance_scale: options.guidanceScale || 7.5,
          scheduler: 'DPM++ 2M Karras'
        }
      }

      return await this.generateWithControlNet(request)

    } catch (error) {
      console.error('Error generating character-consistent image:', error)
      throw error
    }
  }

  /**
   * Batch generate turnaround views using ControlNet
   */
  async generateTurnaroundViews(
    character: CharacterProfile,
    illustrationStyle: string,
    artStyleNotes?: string
  ): Promise<Record<string, ControlNetResult>> {
    try {
      const results: Record<string, ControlNetResult> = {}
      
      const views = [
        { key: 'front', description: 'front view, facing forward' },
        { key: 'side', description: 'side profile view, 90 degrees' },
        { key: 'back', description: 'back view, facing away' },
        { key: 'three_quarter', description: 'three-quarter view, 45 degrees' }
      ]

      // Use first reference image as base if available
      const baseReference = character.referenceImages?.[0]
      
      for (const view of views) {
        const prompt = this.buildTurnaroundPrompt(character, view.description, illustrationStyle, artStyleNotes)
        
        try {
          const result = await this.generateCharacterConsistentImage(
            character,
            prompt,
            baseReference?.url,
            {
              usePose: true,
              useEdge: true,
              strength: 0.8,
              steps: 35,
              guidanceScale: 8.0
            }
          )
          
          results[view.key] = result
          
          // Add delay between generations to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000))
          
        } catch (error) {
          console.error(`Failed to generate ${view.key} view:`, error)
          // Continue with other views
        }
      }

      return results

    } catch (error) {
      console.error('Error generating turnaround views:', error)
      throw error
    }
  }

  // Helper methods

  private async preprocessControlInputs(inputs: ControlNetInput[]): Promise<Array<ControlNetInput & { processed_image?: string }>> {
    const processed = []
    
    for (const input of inputs) {
      if (input.config.processor && input.config.processor !== 'none') {
        // Image is already processed or will be processed by ControlNet
        processed.push(input)
      } else {
        // Process the image if needed
        processed.push(input)
      }
    }
    
    return processed
  }

  private getControlNetModel(type: string): string {
    const models = {
      'pose': 'control_v11p_sd15_openpose',
      'depth': 'control_v11f1p_sd15_depth',
      'edge': 'control_v11p_sd15_canny',
      'reference': 'control_v11p_sd15_ip2p',
      'scribble': 'control_v11p_sd15_scribble',
      'segmentation': 'control_v11p_sd15_seg'
    }
    
    return models[type] || 'control_v11p_sd15_openpose'
  }

  private buildCharacterPrompt(character: CharacterProfile, scenePrompt: string): string {
    const characterDesc = this.buildCharacterDescription(character)
    
    return `${characterDesc}, ${scenePrompt}, consistent character design, high quality children's book illustration, professional art, masterpiece`
  }

  private buildTurnaroundPrompt(
    character: CharacterProfile,
    viewDescription: string,
    style: string,
    notes?: string
  ): string {
    const characterDesc = this.buildCharacterDescription(character)
    
    let prompt = `Character turnaround sheet: ${characterDesc}, ${viewDescription}, ${style} style`
    
    if (notes) {
      prompt += `, ${notes}`
    }
    
    prompt += `, clean white background, consistent lighting, professional character reference, high quality, detailed`
    
    return prompt
  }

  private buildCharacterDescription(character: CharacterProfile): string {
    const parts: string[] = [character.name]
    
    if (character.description) {
      parts.push(character.description)
    }
    
    const traits = character.physicalTraits || {}
    if (traits.hairColor && traits.hairStyle) {
      parts.push(`${traits.hairColor} ${traits.hairStyle} hair`)
    }
    if (traits.eyeColor) parts.push(`${traits.eyeColor} eyes`)
    if (traits.clothing?.primary_outfit) {
      parts.push(`wearing ${traits.clothing.primary_outfit}`)
    }
    
    return parts.join(', ')
  }
}

export const controlNetService = new ControlNetService()