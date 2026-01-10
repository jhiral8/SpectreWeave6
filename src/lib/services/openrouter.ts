import { 
  AIResponse, 
  AIRequest, 
  AIServiceError, 
  OpenRouterConfig,
  StreamResponse
} from '../ai/types'

export class OpenRouterService {
  private config: OpenRouterConfig

  constructor(config?: Partial<OpenRouterConfig>) {
    const apiKey = config?.apiKey || process.env.OPENROUTER_API_KEY
    
    if (!apiKey) {
      throw new AIServiceError({
        code: 'OPENROUTER_API_KEY_MISSING',
        message: 'OpenRouter API key is missing. Please set OPENROUTER_API_KEY in your environment.',
        provider: 'openrouter'
      })
    }

    let model = config?.model || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.2-3b-instruct:free'
    
    // Handle deprecated/invalid model IDs
    if (model === 'google/gemini-2.0-flash-lite-preview-02-05:free') {
      model = 'meta-llama/llama-3.2-3b-instruct:free'
    }

    this.config = {
      apiKey,
      model,
      timeout: config?.timeout || 30000,
      retries: config?.retries || 3
    }
  }

  async generateText(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://spectreweave.com', // Optional, for OpenRouter rankings
          'X-Title': 'SpectreWeave', // Optional, for OpenRouter rankings
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'user', content: request.prompt }
          ],
          max_tokens: request.options?.maxTokens || 1000,
          temperature: request.options?.temperature || 0.7,
          stream: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('OpenRouter API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          model: this.config.model
        })
        
        // Better error messages for common issues
        let message = errorData.error?.message || `OpenRouter API returned ${response.status}: ${response.statusText}`
        const isRateLimited = response.status === 429 || message.includes('rate-limit')
        
        if (isRateLimited) {
          message = `Model "${this.config.model}" is rate-limited. Try selecting a different model from the dropdown.`
        }
        
        throw new AIServiceError({
          code: isRateLimited ? 'RATE_LIMITED' : 'OPENROUTER_API_ERROR',
          message,
          provider: 'openrouter',
          details: errorData,
          retryable: isRateLimited
        })
      }

      const data = await response.json()
      
      return {
        id: data.id || Math.random().toString(36).substring(7),
        requestId: response.headers.get('x-request-id') || '',
        success: true,
        content: data.choices[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        },
        provider: 'openrouter',
        model: data.model || this.config.model,
        timestamp: new Date(),
        metadata: {
          finishReason: data.choices[0]?.finish_reason
        } as any
      }
    } catch (error) {
      if (error instanceof AIServiceError) throw error
      
      throw new AIServiceError({
        code: 'OPENROUTER_GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error during OpenRouter generation',
        provider: 'openrouter',
        details: error instanceof Error ? { message: error.message, stack: error.stack } : { error: String(error) }
      })
    }
  }

  async streamText(request: AIRequest): Promise<StreamResponse> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://spectreweave.com',
          'X-Title': 'SpectreWeave',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'user', content: request.prompt }
          ],
          max_tokens: request.options?.maxTokens || 1000,
          temperature: request.options?.temperature || 0.7,
          stream: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new AIServiceError({
          code: 'OPENROUTER_STREAM_ERROR',
          message: errorData.error?.message || `OpenRouter API returned ${response.status}: ${response.statusText}`,
          provider: 'openrouter',
          details: errorData
        })
      }

      return {
        stream: response.body as unknown as ReadableStream,
        provider: 'openrouter',
        requestId: response.headers.get('x-request-id') || undefined
      }
    } catch (error) {
      if (error instanceof AIServiceError) throw error
      
      throw new AIServiceError({
        code: 'OPENROUTER_STREAM_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error during OpenRouter streaming',
        provider: 'openrouter',
        details: error instanceof Error ? { message: error.message, stack: error.stack } : { error: String(error) }
      })
    }
  }

  async getChatCompletion(request: any): Promise<AIResponse<string>> {
    return this.generateText({
      id: Math.random().toString(36).substring(7),
      type: 'generation',
      prompt: request.messages[request.messages.length - 1].content,
      timestamp: new Date(),
      options: request.options
    })
  }

  validateConfig(): boolean {
    return !!this.config.apiKey
  }
}
