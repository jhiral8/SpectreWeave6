/**
 * Azure AI Foundry service for ChatGPT models
 */

import { 
  AIFoundryConfig, 
  AIRequest, 
  AIResponse, 
  StreamResponse, 
  ChatCompletionRequest,
  ImageAnalysisRequest,
  AIServiceError,
  IAIService
} from '../ai/types'

const getAIFoundryConfig = (): AIFoundryConfig => {
  const apiKey = process.env.AIFOUNDRY_API_KEY
  const endpoint = process.env.AIFOUNDRY_ENDPOINT || 'https://orion-jhiral-resource.cognitiveservices.azure.com'
  const model = process.env.AIFOUNDRY_MODEL || 'gpt-5-nano'
  const apiVersion = process.env.AIFOUNDRY_API_VERSION || '2025-04-01-preview'

  if (!apiKey) {
    throw new AIServiceError({
      code: 'AIFOUNDRY_CONFIG_MISSING',
      message: 'AI Foundry API configuration is incomplete. Check AIFOUNDRY_API_KEY environment variable.',
      provider: 'aifoundry',
      retryable: false
    })
  }

  return {
    apiKey,
    endpoint,
    model,
    apiVersion,
    timeout: 30000,
    retries: 3
  }
}

export class AIFoundryService implements IAIService {
  private config: AIFoundryConfig

  constructor() {
    this.config = getAIFoundryConfig()
  }

  validateConfig(): boolean {
    try {
      getAIFoundryConfig()
      return true
    } catch {
      return false
    }
  }

  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
          ...options.headers,
        },
      })
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new AIServiceError({
          code: `AIFOUNDRY_API_ERROR_${response.status}`,
          message: `AI Foundry API error: ${response.status} - ${errorText}`,
          provider: 'aifoundry',
          retryable: response.status >= 500 || response.status === 429
        })
      }
      
      return response
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new AIServiceError({
          code: 'AIFOUNDRY_TIMEOUT',
          message: 'AI Foundry request timed out',
          provider: 'aifoundry',
          retryable: true
        })
      }
      throw error
    }
  }

  async generateText(request: AIRequest): Promise<AIResponse<string>> {
    const requestId = `aifoundry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Azure AI Foundry uses the responses endpoint format
      const url = `${this.config.endpoint}/openai/responses?api-version=${this.config.apiVersion}`
      
      const body = {
        messages: [
          {
            role: "user",
            content: request.prompt
          }
        ],
        model: this.config.model,
        max_tokens: request.options?.maxTokens || 120,
        temperature: request.options?.temperature || 0.6,
        top_p: 1
      }

      const response = await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(body),
      })

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || ''

      return {
        success: true,
        data: content,
        requestId,
        provider: 'aifoundry',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      }
    } catch (error: any) {
      throw new AIServiceError({
        code: 'AIFOUNDRY_GENERATION_ERROR',
        message: error.message || 'Failed to generate text with AI Foundry',
        provider: 'aifoundry',
        retryable: error.retryable || false
      })
    }
  }

  async streamText(request: AIRequest): Promise<StreamResponse> {
    const requestId = `aifoundry-stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    try {
      const url = `${this.config.endpoint}/openai/responses?api-version=${this.config.apiVersion}`
      
      const body = {
        messages: [
          {
            role: "user",
            content: request.prompt
          }
        ],
        model: this.config.model,
        max_tokens: request.options?.maxTokens || 120,
        temperature: request.options?.temperature || 0.6,
        stream: true
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new AIServiceError({
          code: `AIFOUNDRY_STREAM_ERROR_${response.status}`,
          message: `AI Foundry stream error: ${response.status} - ${errorText}`,
          provider: 'aifoundry',
          retryable: response.status >= 500
        })
      }

      if (!response.body) {
        throw new AIServiceError({
          code: 'AIFOUNDRY_STREAM_NO_BODY',
          message: 'AI Foundry stream response has no body',
          provider: 'aifoundry'
        })
      }

      return {
        stream: response.body,
        requestId,
        provider: 'aifoundry'
      }
    } catch (error: any) {
      if (error instanceof AIServiceError) throw error
      
      throw new AIServiceError({
        code: 'AIFOUNDRY_STREAM_ERROR',
        message: error.message || 'Failed to create AI Foundry stream',
        provider: 'aifoundry',
        retryable: false
      })
    }
  }

  async getChatCompletion(request: ChatCompletionRequest): Promise<AIResponse<string>> {
    const requestId = `aifoundry-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    try {
      const url = `${this.config.endpoint}/openai/responses?api-version=${this.config.apiVersion}`
      
      const body = {
        messages: request.messages,
        model: this.config.model,
        max_tokens: request.options?.maxTokens || 120,
        temperature: request.options?.temperature || 0.6,
        top_p: 1
      }

      const response = await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(body),
      })

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      return {
        success: true,
        data: content,
        requestId,
        provider: 'aifoundry',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      }
    } catch (error: any) {
      throw new AIServiceError({
        code: 'AIFOUNDRY_CHAT_ERROR',
        message: error.message || 'Failed to get chat completion from AI Foundry',
        provider: 'aifoundry',
        retryable: error.retryable || false
      })
    }
  }

  async analyzeImage(request: ImageAnalysisRequest): Promise<AIResponse<string>> {
    throw new AIServiceError({
      code: 'AIFOUNDRY_IMAGE_NOT_SUPPORTED',
      message: 'Image analysis is not supported by this AI Foundry endpoint. Use Gemini for image analysis.',
      provider: 'aifoundry',
      retryable: false
    })
  }
}

// Singleton instance
let _aifoundryInstance: AIFoundryService | null = null
export const getAIFoundryService = (): AIFoundryService => {
  if (!_aifoundryInstance) {
    _aifoundryInstance = new AIFoundryService()
  }
  return _aifoundryInstance
}

// Deprecated: use getAIFoundryService() instead
export const aifoundryService = {
  getInstance: () => {
    return getAIFoundryService()
  }
}