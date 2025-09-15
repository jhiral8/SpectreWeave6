/**
 * Stability AI service configuration for Next.js
 */

import { 
  StabilityConfig, 
  ImageRequest, 
  ImageAnalysisRequest,
  ImageEditRequest,
  AIResponse, 
  AIServiceError,
  IImageService
} from '../ai/types'

const getStabilityConfig = (): StabilityConfig => {
  const apiKey = process.env.STABILITY_API_KEY

  if (!apiKey) {
    throw new AIServiceError({
      code: 'STABILITY_CONFIG_MISSING',
      message: 'Stability AI configuration is incomplete. Check environment variables.',
      provider: 'stability',
      retryable: false
    })
  }

  return {
    apiKey,
    timeout: 60000, // Image generation takes longer
    retries: 3
  }
}

export class StabilityService implements IImageService {
  private config: StabilityConfig

  constructor() {
    this.config = getStabilityConfig()
  }

  validateConfig(): boolean {
    try {
      getStabilityConfig()
      return true
    } catch {
      return false
    }
  }

  private async makeRequest(url: string, options: RequestInit, retries = 0): Promise<any> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new AIServiceError({
          code: `STABILITY_API_ERROR_${response.status}`,
          message: `Stability AI API error: ${response.status} - ${errorText}`,
          provider: 'stability',
          retryable: response.status >= 500 || response.status === 429
        })
      }

      return await response.json()
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new AIServiceError({
          code: 'STABILITY_TIMEOUT',
          message: 'Stability AI request timed out',
          provider: 'stability',
          retryable: true
        })
      }

      if (error instanceof AIServiceError && error.retryable && retries < (this.config.retries || 3)) {
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retries)))
        return this.makeRequest(url, options, retries + 1)
      }

      throw error
    }
  }

  async generateImage(request: ImageRequest): Promise<AIResponse<string>> {
    const startTime = Date.now()
    const requestId = `stability-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      const body = {
        text_prompts: [
          {
            text: request.prompt,
            weight: 1,
          },
        ],
        width: request.options?.width || 1024,
        height: request.options?.height || 1024,
        steps: request.options?.steps || 30,
        seed: request.options?.seed || 0,
        cfg_scale: request.options?.cfgScale || 7,
        samples: request.options?.samples || 1,
      }

      const data = await this.makeRequest(
        'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(body),
        }
      )

      const imageBase64 = data.artifacts[0]?.base64 || ''
      
      return {
        success: true,
        data: imageBase64,
        provider: 'stability',
        requestId,
        timestamp: Date.now()
      }
    } catch (error: any) {
      if (error instanceof AIServiceError) {
        throw error
      }
      
      throw new AIServiceError({
        code: 'STABILITY_GENERATION_ERROR',
        message: error.message || 'Failed to generate image with Stability AI',
        provider: 'stability',
        details: { requestId, duration: Date.now() - startTime }
      })
    }
  }

  async analyzeImage(request: ImageAnalysisRequest): Promise<AIResponse<string>> {
    // Stability AI doesn't provide image analysis, throw appropriate error
    throw new AIServiceError({
      code: 'STABILITY_UNSUPPORTED_OPERATION',
      message: 'Image analysis is not supported by Stability AI. Use Gemini for image analysis.',
      provider: 'stability',
      retryable: false
    })
  }

  async editImage(request: ImageEditRequest): Promise<AIResponse<string>> {
    const startTime = Date.now()
    const requestId = `stability-edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      const formData = new FormData()
      
      // Convert base64 to blob
      const imageBuffer = Buffer.from(request.imageData.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64')
      const imageBlob = new Blob([imageBuffer], { type: 'image/png' })
      
      formData.append('init_image', imageBlob)
      formData.append('text_prompts[0][text]', request.prompt)
      formData.append('text_prompts[0][weight]', '1')
      formData.append('init_image_mode', 'IMAGE_STRENGTH')
      formData.append('image_strength', String(request.options?.strength || 0.35))
      formData.append('steps', String(request.options?.steps || 30))
      formData.append('seed', '0')
      formData.append('cfg_scale', '7')
      formData.append('samples', '1')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(
        'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: formData,
          signal: controller.signal
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new AIServiceError({
          code: `STABILITY_EDIT_ERROR_${response.status}`,
          message: `Stability AI image edit error: ${response.status} - ${errorText}`,
          provider: 'stability',
          retryable: response.status >= 500
        })
      }

      const data = await response.json()
      const editedImageBase64 = data.artifacts[0]?.base64 || ''
      
      return {
        success: true,
        data: editedImageBase64,
        provider: 'stability',
        requestId,
        timestamp: Date.now()
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new AIServiceError({
          code: 'STABILITY_EDIT_TIMEOUT',
          message: 'Stability AI image edit request timed out',
          provider: 'stability'
        })
      }

      if (error instanceof AIServiceError) {
        throw error
      }
      
      throw new AIServiceError({
        code: 'STABILITY_EDIT_ERROR',
        message: error.message || 'Failed to edit image with Stability AI',
        provider: 'stability',
        details: { requestId, duration: Date.now() - startTime }
      })
    }
  }
}

// Export singleton instance for backward compatibility (lazy initialization)
let _stabilityInstance: StabilityService | null = null
export const getStabilityService = (): StabilityService => {
  if (!_stabilityInstance) {
    _stabilityInstance = new StabilityService()
  }
  return _stabilityInstance
}

// Deprecated: use getStabilityService() instead
export const stabilityService = {
  get instance() {
    return getStabilityService()
  }
}