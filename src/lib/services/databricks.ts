/**
 * Databricks service configuration for Next.js
 */

import { 
  DatabricksConfig, 
  AIRequest, 
  AIResponse, 
  StreamResponse, 
  ChatCompletionRequest,
  AIServiceError,
  IAIService
} from '../ai/types'

const getDatabricksConfig = (): DatabricksConfig => {
  const workspaceUrl = process.env.NEXT_PUBLIC_DATABRICKS_WORKSPACE_URL
  const modelName = process.env.NEXT_PUBLIC_DATABRICKS_MODEL_NAME
  const apiToken = process.env.DATABRICKS_API_TOKEN

  if (!workspaceUrl || !modelName || !apiToken) {
    throw new AIServiceError({
      code: 'DATABRICKS_CONFIG_MISSING',
      message: 'Databricks configuration is incomplete. Check environment variables.',
      provider: 'databricks',
      retryable: false
    })
  }

  return {
    workspaceUrl,
    modelName,
    apiToken,
    timeout: 30000,
    retries: 3
  }
}

export class DatabricksService implements IAIService {
  private config: DatabricksConfig

  constructor() {
    this.config = getDatabricksConfig()
  }

  validateConfig(): boolean {
    try {
      getDatabricksConfig()
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
          'Authorization': `Bearer ${this.config.apiToken}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new AIServiceError({
          code: `DATABRICKS_API_ERROR_${response.status}`,
          message: `Databricks API error: ${response.status} - ${errorText}`,
          provider: 'databricks',
          retryable: response.status >= 500 || response.status === 429
        })
      }

      return await response.json()
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new AIServiceError({
          code: 'DATABRICKS_TIMEOUT',
          message: 'Databricks request timed out',
          provider: 'databricks',
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
    const requestId = `databricks-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      const body = {
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        max_tokens: request.options?.maxTokens || 1000,
        temperature: request.options?.temperature || 0.7,
      }

      const data = await this.makeRequest(
        `${this.config.workspaceUrl}/serving-endpoints/${this.config.modelName}/invocations`,
        body
      )
      
      const content = data.choices[0]?.message?.content || ''
      
      return {
        success: true,
        data: content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        },
        provider: 'databricks',
        requestId,
        timestamp: Date.now()
      }
    } catch (error: any) {
      if (error instanceof AIServiceError) {
        throw error
      }
      
      throw new AIServiceError({
        code: 'DATABRICKS_GENERATION_ERROR',
        message: error.message || 'Failed to generate text with Databricks',
        provider: 'databricks',
        details: { requestId, duration: Date.now() - startTime }
      })
    }
  }

  async streamText(request: AIRequest): Promise<StreamResponse> {
    const requestId = `databricks-stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(
        `${this.config.workspaceUrl}/serving-endpoints/${this.config.modelName}/invocations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiToken}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: request.prompt,
              },
            ],
            stream: true,
            temperature: request.options?.temperature || 0.7,
          }),
          signal: controller.signal
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new AIServiceError({
          code: `DATABRICKS_STREAM_ERROR_${response.status}`,
          message: `Databricks stream error: ${response.status} - ${errorText}`,
          provider: 'databricks',
          retryable: response.status >= 500
        })
      }

      if (!response.body) {
        throw new AIServiceError({
          code: 'DATABRICKS_STREAM_NO_BODY',
          message: 'Databricks stream response has no body',
          provider: 'databricks'
        })
      }

      return {
        stream: response.body,
        provider: 'databricks',
        requestId
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new AIServiceError({
          code: 'DATABRICKS_STREAM_TIMEOUT',
          message: 'Databricks stream request timed out',
          provider: 'databricks'
        })
      }

      if (error instanceof AIServiceError) {
        throw error
      }
      
      throw new AIServiceError({
        code: 'DATABRICKS_STREAM_ERROR',
        message: error.message || 'Failed to create Databricks stream',
        provider: 'databricks',
        details: { requestId }
      })
    }
  }

  async getChatCompletion(request: ChatCompletionRequest): Promise<AIResponse<string>> {
    const startTime = Date.now()
    const requestId = `databricks-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      const body = {
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: request.options?.maxTokens || 2000,
        temperature: request.options?.temperature || 0.7,
      }

      const data = await this.makeRequest(
        `${this.config.workspaceUrl}/serving-endpoints/${this.config.modelName}/invocations`,
        body
      )
      
      const content = data.choices[0]?.message?.content || ''
      
      return {
        success: true,
        data: content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        },
        provider: 'databricks',
        requestId,
        timestamp: Date.now()
      }
    } catch (error: any) {
      if (error instanceof AIServiceError) {
        throw error
      }
      
      throw new AIServiceError({
        code: 'DATABRICKS_CHAT_ERROR',
        message: error.message || 'Failed to get chat completion from Databricks',
        provider: 'databricks',
        details: { requestId, duration: Date.now() - startTime }
      })
    }
  }
}

// Export singleton instance for backward compatibility (lazy initialization)
let _databricksInstance: DatabricksService | null = null
export const getDatabricksService = (): DatabricksService => {
  if (!_databricksInstance) {
    _databricksInstance = new DatabricksService()
  }
  return _databricksInstance
}

// Deprecated: use getDatabricksService() instead
export const databricksService = {
  get instance() {
    return getDatabricksService()
  }
}