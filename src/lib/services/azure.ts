/**
 * Azure AI Foundry service configuration for Next.js
 */

import { 
  AzureAIConfig, 
  AIRequest, 
  AIResponse, 
  StreamResponse, 
  ChatCompletionRequest,
  AIServiceError,
  IAIService
} from '../ai/types'

const getAzureConfig = (): AzureAIConfig => {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT || process.env.NEXT_PUBLIC_AZURE_AI_ENDPOINT
  const apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_AI_API_KEY
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'o3-mini-2'
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview'

  if (!endpoint || !apiKey) {
    throw new AIServiceError({
      code: 'AZURE_CONFIG_MISSING',
      message: 'Azure OpenAI configuration is incomplete. Need AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY.',
      provider: 'azure',
      retryable: false
    })
  }

  return {
    endpoint,
    apiKey,
    deployment,
    apiVersion,
    timeout: 30000,
    retries: 3
  }
}

export class AzureAIService implements IAIService {
  private config: AzureAIConfig

  constructor() {
    this.config = getAzureConfig()
  }

  validateConfig(): boolean {
    try {
      getAzureConfig()
      return true
    } catch {
      return false
    }
  }

  private async makeRequest(endpoint: string, body: any, retries = 0): Promise<any> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new AIServiceError({
          code: `AZURE_API_ERROR_${response.status}`,
          message: `Azure OpenAI API error: ${response.status} - ${errorText}`,
          provider: 'azure',
          retryable: response.status >= 500 || response.status === 429
        })
      }

      return await response.json()
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new AIServiceError({
          code: 'AZURE_TIMEOUT',
          message: 'Azure OpenAI request timed out',
          provider: 'azure',
          retryable: true
        })
      }

      if (error instanceof AIServiceError && error.retryable && retries < (this.config.retries || 3)) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)))
        return this.makeRequest(endpoint, body, retries + 1)
      }

      throw error
    }
  }

  async generateText(request: AIRequest): Promise<AIResponse<string>> {
    const startTime = Date.now()
    const requestId = `azure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      const body = {
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        max_completion_tokens: request.options?.maxTokens || 1000,
      }

      const endpoint = `${this.config.endpoint}/openai/deployments/${this.config.deployment}/chat/completions?api-version=${this.config.apiVersion}`
      const data = await this.makeRequest(endpoint, body)
      const content = data.choices[0]?.message?.content || ''
      
      return {
        success: true,
        data: content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        },
        provider: 'azure',
        requestId,
        timestamp: Date.now()
      }
    } catch (error: any) {
      if (error instanceof AIServiceError) {
        throw error
      }
      
      throw new AIServiceError({
        code: 'AZURE_GENERATION_ERROR',
        message: error.message || 'Failed to generate text with Azure OpenAI',
        provider: 'azure',
        details: { requestId, duration: Date.now() - startTime }
      })
    }
  }

  async streamText(request: AIRequest): Promise<StreamResponse> {
    const requestId = `azure-stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const endpoint = `${this.config.endpoint}/openai/deployments/${this.config.deployment}/chat/completions?api-version=${this.config.apiVersion}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: request.prompt,
            },
          ],
          stream: true,
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new AIServiceError({
          code: `AZURE_STREAM_ERROR_${response.status}`,
          message: `Azure OpenAI stream error: ${response.status} - ${errorText}`,
          provider: 'azure',
          retryable: response.status >= 500
        })
      }

      if (!response.body) {
        throw new AIServiceError({
          code: 'AZURE_STREAM_NO_BODY',
          message: 'Azure OpenAI stream response has no body',
          provider: 'azure'
        })
      }

      return {
        stream: response.body,
        provider: 'azure',
        requestId
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new AIServiceError({
          code: 'AZURE_STREAM_TIMEOUT',
          message: 'Azure OpenAI stream request timed out',
          provider: 'azure'
        })
      }

      if (error instanceof AIServiceError) {
        throw error
      }
      
      throw new AIServiceError({
        code: 'AZURE_STREAM_ERROR',
        message: error.message || 'Failed to create Azure OpenAI stream',
        provider: 'azure',
        details: { requestId }
      })
    }
  }

  async getChatCompletion(request: ChatCompletionRequest): Promise<AIResponse<string>> {
    const startTime = Date.now()
    const requestId = `azure-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      const body = {
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_completion_tokens: request.options?.maxTokens || 2000,
      }

      const endpoint = `${this.config.endpoint}/openai/deployments/${this.config.deployment}/chat/completions?api-version=${this.config.apiVersion}`
      const data = await this.makeRequest(endpoint, body)
      const content = data.choices[0]?.message?.content || ''
      
      return {
        success: true,
        data: content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        },
        provider: 'azure',
        requestId,
        timestamp: Date.now()
      }
    } catch (error: any) {
      if (error instanceof AIServiceError) {
        throw error
      }
      
      throw new AIServiceError({
        code: 'AZURE_CHAT_ERROR',
        message: error.message || 'Failed to get chat completion from Azure OpenAI',
        provider: 'azure',
        details: { requestId, duration: Date.now() - startTime }
      })
    }
  }
}

// Export singleton instance for backward compatibility (lazy initialization)
let _azureInstance: AzureAIService | null = null
export const getAzureAIService = (): AzureAIService => {
  if (!_azureInstance) {
    _azureInstance = new AzureAIService()
  }
  return _azureInstance
}

// Deprecated: use getAzureAIService() instead
export const azureAIService = {
  get instance() {
    return getAzureAIService()
  }
}