/**
 * Google Gemini service configuration for Next.js
 */

import { 
  GeminiConfig, 
  AIRequest, 
  AIResponse, 
  StreamResponse, 
  ChatCompletionRequest,
  ImageAnalysisRequest,
  AIServiceError,
  IAIService
} from '../ai/types'

const getGeminiConfig = (): GeminiConfig => {
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

  if (!apiKey) {
    throw new AIServiceError({
      code: 'GEMINI_CONFIG_MISSING',
      message: 'Gemini API configuration is incomplete. Check GEMINI_API_KEY environment variable.',
      provider: 'gemini',
      retryable: false
    })
  }

  return {
    apiKey,
    model,
    timeout: 30000,
    retries: 3
  }
}

export class GeminiService implements IAIService {
  private config: GeminiConfig

  constructor() {
    this.config = getGeminiConfig()
  }

  validateConfig(): boolean {
    try {
      getGeminiConfig()
      return true
    } catch {
      return false
    }
  }

  private async makeRequest(url: string, body: any, retries = 0): Promise<any> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new AIServiceError({
          code: `GEMINI_API_ERROR_${response.status}`,
          message: `Gemini API error: ${response.status} - ${errorText}`,
          provider: 'gemini',
          retryable: response.status >= 500 || response.status === 429
        })
      }

      return await response.json()
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new AIServiceError({
          code: 'GEMINI_TIMEOUT',
          message: 'Gemini request timed out',
          provider: 'gemini',
          retryable: true
        })
      }

      if (error instanceof AIServiceError && error.retryable && retries < (this.config.retries || 3)) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)))
        return this.makeRequest(url, body, retries + 1)
      }

      throw error
    }
  }

  async generateText(request: AIRequest): Promise<AIResponse<string>> {
    const startTime = Date.now()
    const requestId = `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`
      const body = {
        contents: [
          {
            parts: [
              {
                text: request.prompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: request.options?.maxTokens || 1000,
          temperature: request.options?.temperature || 0.7,
        },
      }

      const data = await this.makeRequest(url, body)
      const content = data.candidates[0]?.content?.parts[0]?.text || ''
      
      return {
        success: true,
        data: content,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount || 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata?.totalTokenCount || 0
        },
        provider: 'gemini',
        requestId,
        timestamp: Date.now()
      }
    } catch (error: any) {
      if (error instanceof AIServiceError) {
        throw error
      }
      
      throw new AIServiceError({
        code: 'GEMINI_GENERATION_ERROR',
        message: error.message || 'Failed to generate text with Gemini',
        provider: 'gemini',
        details: { requestId, duration: Date.now() - startTime }
      })
    }
  }

  async streamText(request: AIRequest): Promise<StreamResponse> {
    const requestId = `gemini-stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:streamGenerateContent?key=${this.config.apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: request.prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: request.options?.temperature || 0.7,
          },
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new AIServiceError({
          code: `GEMINI_STREAM_ERROR_${response.status}`,
          message: `Gemini stream error: ${response.status} - ${errorText}`,
          provider: 'gemini',
          retryable: response.status >= 500
        })
      }

      if (!response.body) {
        throw new AIServiceError({
          code: 'GEMINI_STREAM_NO_BODY',
          message: 'Gemini stream response has no body',
          provider: 'gemini'
        })
      }

      return {
        stream: response.body,
        provider: 'gemini',
        requestId
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new AIServiceError({
          code: 'GEMINI_STREAM_TIMEOUT',
          message: 'Gemini stream request timed out',
          provider: 'gemini'
        })
      }

      if (error instanceof AIServiceError) {
        throw error
      }
      
      throw new AIServiceError({
        code: 'GEMINI_STREAM_ERROR',
        message: error.message || 'Failed to create Gemini stream',
        provider: 'gemini',
        details: { requestId }
      })
    }
  }

  async getChatCompletion(request: ChatCompletionRequest): Promise<AIResponse<string>> {
    // Convert messages to a single prompt for Gemini
    const prompt = request.messages.map(m => `${m.role}: ${m.content}`).join('\n')
    
    return this.generateText({
      prompt,
      options: request.options
    })
  }

  async analyzeImage(request: ImageAnalysisRequest): Promise<AIResponse<string>> {
    const startTime = Date.now()
    const requestId = `gemini-vision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.config.apiKey}`
      const body = {
        contents: [
          {
            parts: [
              {
                text: request.prompt,
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: request.imageData,
                },
              },
            ],
          },
        ],
      }

      const data = await this.makeRequest(url, body)
      const content = data.candidates[0]?.content?.parts[0]?.text || ''
      
      return {
        success: true,
        data: content,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount || 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata?.totalTokenCount || 0
        },
        provider: 'gemini',
        requestId,
        timestamp: Date.now()
      }
    } catch (error: any) {
      if (error instanceof AIServiceError) {
        throw error
      }
      
      throw new AIServiceError({
        code: 'GEMINI_VISION_ERROR',
        message: error.message || 'Failed to analyze image with Gemini',
        provider: 'gemini',
        details: { requestId, duration: Date.now() - startTime }
      })
    }
  }
}

// Export singleton instance for backward compatibility (lazy initialization)
let _geminiInstance: GeminiService | null = null
export const getGeminiService = (): GeminiService => {
  if (!_geminiInstance) {
    _geminiInstance = new GeminiService()
  }
  return _geminiInstance
}

// Deprecated: use getGeminiService() instead
export const geminiService = {
  get instance() {
    return getGeminiService()
  }
}