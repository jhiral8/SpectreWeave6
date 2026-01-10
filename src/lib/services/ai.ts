/**
 * Unified AI service aggregator for SpectreWeave
 * Enhanced with proper error handling, rate limiting, and cost tracking
 */

import { AzureAIService } from './azure'
import { GeminiService } from './gemini'
import { DatabricksService } from './databricks'
import { StabilityService } from './stability'
import { AIFoundryService } from './aifoundry'
import { OpenRouterService } from './openrouter'
import { 
  AIProvider, 
  ImageProvider, 
  SupportedProvider,
  AIRequest, 
  ImageRequest,
  ImageAnalysisRequest,
  ImageEditRequest,
  ChatCompletionRequest,
  AIResponse,
  StreamResponse,
  AIServiceError,
  ProviderStatus,
  UsageTracking,
  CostEstimate
} from '../ai/types'

// Cost estimates per 1k tokens (approximate)
const COST_PER_1K_TOKENS: Record<string, any> = {
  azure: { input: 0.0015, output: 0.002 },
  gemini: { input: 0.00125, output: 0.005 },
  databricks: { input: 0.0005, output: 0.0015 },
  aifoundry: { input: 0.00005, output: 0.00015 },
  openrouter: { input: 0, output: 0 },
  openai: { input: 0.0015, output: 0.002 },
  anthropic: { input: 0.008, output: 0.024 },
  local: { input: 0, output: 0 },
  stability: { perImage: 0.02 }
}

export class AIService {
  private azure: AzureAIService | null = null
  private gemini: GeminiService | null = null
  private databricks: DatabricksService | null = null
  private stability: StabilityService | null = null
  private aifoundry: AIFoundryService | null = null
  private openrouter: OpenRouterService | null = null
  private usage: UsageTracking

  constructor() {
    // Initialize services that are properly configured
    try {
      this.azure = new AzureAIService()
    } catch (error) {
      console.warn('Azure AI service not available:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    try {
      this.gemini = new GeminiService()
    } catch (error) {
      console.warn('Gemini service not available:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    try {
      this.databricks = new DatabricksService()
    } catch (error) {
      console.warn('Databricks service not available:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    try {
      this.stability = new StabilityService()
    } catch (error) {
      console.warn('Stability service not available:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    try {
      this.aifoundry = new AIFoundryService()
    } catch (error) {
      console.warn('AI Foundry service not available:', error instanceof Error ? error.message : 'Unknown error')
    }

    try {
      this.openrouter = new OpenRouterService()
    } catch (error) {
      console.warn('OpenRouter service not available:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    this.usage = this.initializeUsageTracking()
  }

  private initializeUsageTracking(): UsageTracking {
    return {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      byProvider: {
        azure: { requests: 0, tokens: 0, cost: 0 },
        gemini: { requests: 0, tokens: 0, cost: 0 },
        databricks: { requests: 0, tokens: 0, cost: 0 },
        aifoundry: { requests: 0, tokens: 0, cost: 0 },
        openrouter: { requests: 0, tokens: 0, cost: 0 },
        stability: { requests: 0, tokens: 0, cost: 0 },
        openai: { requests: 0, tokens: 0, cost: 0 },
        anthropic: { requests: 0, tokens: 0, cost: 0 },
        local: { requests: 0, tokens: 0, cost: 0 }
      } as any
    }
  }

  private getService(provider: AIProvider) {
    switch (provider) {
      case 'openrouter':
        if (!this.openrouter) {
          throw new AIServiceError({
            code: 'OPENROUTER_NOT_AVAILABLE',
            message: 'OpenRouter service is not configured or available',
            provider: 'openrouter'
          })
        }
        return this.openrouter
      case 'azure':
        if (!this.azure) {
          throw new AIServiceError({
            code: 'AZURE_NOT_AVAILABLE',
            message: 'Azure AI service is not properly configured',
            provider: 'azure',
            retryable: false
          })
        }
        return this.azure
      case 'gemini':
        if (!this.gemini) {
          throw new AIServiceError({
            code: 'GEMINI_NOT_AVAILABLE',
            message: 'Gemini service is not properly configured',
            provider: 'gemini',
            retryable: false
          })
        }
        return this.gemini
      case 'databricks':
        if (!this.databricks) {
          throw new AIServiceError({
            code: 'DATABRICKS_NOT_AVAILABLE',
            message: 'Databricks service is not properly configured',
            provider: 'databricks',
            retryable: false
          })
        }
        return this.databricks
      case 'aifoundry':
        if (!this.aifoundry) {
          throw new AIServiceError({
            code: 'AIFOUNDRY_NOT_AVAILABLE',
            message: 'AI Foundry service is not properly configured',
            provider: 'aifoundry',
            retryable: false
          })
        }
        return this.aifoundry
      default:
        throw new AIServiceError({
          code: 'UNSUPPORTED_PROVIDER',
          message: `Unsupported AI provider: ${provider}`,
          provider: provider as SupportedProvider,
          retryable: false
        })
    }
  }

  private updateUsage(provider: SupportedProvider, tokens: number, cost: number) {
    this.usage.totalRequests++
    this.usage.totalTokens += tokens
    this.usage.totalCost += cost
    
    this.usage.byProvider[provider].requests++
    this.usage.byProvider[provider].tokens += tokens
    this.usage.byProvider[provider].cost += cost
  }

  private estimateCost(provider: SupportedProvider, promptTokens: number, completionTokens: number): CostEstimate {
    if (provider === 'stability') {
      return {
        provider,
        estimatedCost: COST_PER_1K_TOKENS.stability.perImage,
        currency: 'USD',
        breakdown: {
          inputTokens: 0,
          outputTokens: 0,
          inputCost: 0,
          outputCost: COST_PER_1K_TOKENS.stability.perImage
        }
      }
    }

    const rates = COST_PER_1K_TOKENS[provider as AIProvider]
    const inputCost = (promptTokens / 1000) * rates.input
    const outputCost = (completionTokens / 1000) * rates.output
    
    return {
      provider,
      estimatedCost: inputCost + outputCost,
      currency: 'USD',
      breakdown: {
        inputTokens: promptTokens,
        outputTokens: completionTokens,
        inputCost,
        outputCost
      }
    }
  }

  async generateText(request: AIRequest): Promise<AIResponse<string>> {
    const primaryProvider = request.options?.provider || 'openrouter'
    const service = this.getService(primaryProvider as AIProvider)
    
    try {
      const result = await service.generateText(request)
      
      // Track usage
      if (result.usage) {
        const cost = this.estimateCost(primaryProvider as SupportedProvider, result.usage.promptTokens, result.usage.completionTokens)
        result.usage.cost = cost.estimatedCost
        this.updateUsage(primaryProvider as SupportedProvider, result.usage.totalTokens, cost.estimatedCost)
      }
      
      return result
    } catch (error) {
      console.error(`Primary provider ${primaryProvider} failed:`, error)
      
      // Fallback logic
      const fallbackProviders: AIProvider[] = (['openrouter', 'aifoundry', 'gemini', 'azure', 'databricks'] as AIProvider[]).filter(p => p !== primaryProvider)
      let lastError: AIServiceError | null = null

      for (const provider of fallbackProviders) {
        try {
          const service = this.getService(provider)
          const result = await service.generateText({ ...request, options: { ...request.options, provider } })
          
          // Update usage tracking
          if (result.usage) {
            const cost = this.estimateCost(result.provider, result.usage.promptTokens, result.usage.completionTokens)
            this.updateUsage(result.provider, result.usage.totalTokens, cost.estimatedCost)
            result.usage.cost = cost.estimatedCost
          }
          
          return result
        } catch (error: any) {
          lastError = error
          console.warn(`Provider ${provider} failed for text generation:`, error.message)
          continue
        }
      }

      // If all providers failed, throw the last error
      throw lastError || new AIServiceError({
        code: 'ALL_PROVIDERS_FAILED',
        message: 'All AI providers failed for text generation',
        provider: primaryProvider as SupportedProvider,
        retryable: false
      })
    }
  }

  async streamText(request: AIRequest): Promise<StreamResponse> {
    const service = this.getService((request.options?.provider || 'openrouter') as AIProvider)
    return await service.streamText(request)
  }

  async getChatCompletion(request: ChatCompletionRequest): Promise<AIResponse<string>> {
    const primaryProvider = request.provider || 'openrouter'
    const service = this.getService(primaryProvider as AIProvider)
    
    try {
      // @ts-ignore - Some services might not have getChatCompletion yet
      const result = await service.getChatCompletion(request)
      
      // Track usage
      if (result.usage) {
        const cost = this.estimateCost(primaryProvider as SupportedProvider, result.usage.promptTokens, result.usage.completionTokens)
        result.usage.cost = cost.estimatedCost
        this.updateUsage(primaryProvider as SupportedProvider, result.usage.totalTokens, cost.estimatedCost)
      }
      
      return result
    } catch (error) {
      console.error(`Primary provider ${primaryProvider} failed:`, error)
      
      // Fallback logic
      const fallbackProviders: AIProvider[] = (['openrouter', 'aifoundry', 'gemini', 'databricks', 'azure'] as AIProvider[]).filter(p => p !== primaryProvider)
      let lastError: AIServiceError | null = null

      for (const provider of fallbackProviders) {
        try {
          const service = this.getService(provider)
          const result = await service.getChatCompletion({ ...request, provider })
          
          // Update usage tracking
          if (result.usage) {
            const cost = this.estimateCost(result.provider, result.usage.promptTokens, result.usage.completionTokens)
            this.updateUsage(result.provider, result.usage.totalTokens, cost.estimatedCost)
            result.usage.cost = cost.estimatedCost
          }
          
          return result
        } catch (error: any) {
          lastError = error
          console.warn(`Provider ${provider} failed for chat completion:`, error.message)
          continue
        }
      }

      // If all providers failed, throw the last error
      throw lastError || new AIServiceError({
        code: 'ALL_PROVIDERS_FAILED',
        message: 'All AI providers failed for chat completion',
        provider: primaryProvider as SupportedProvider,
        retryable: false
      })
    }
  }

  async generateImage(request: ImageRequest): Promise<AIResponse<string>> {
    if (request.provider && request.provider !== 'stability') {
      throw new AIServiceError({
        code: 'UNSUPPORTED_IMAGE_PROVIDER',
        message: `Image generation is only supported by Stability AI`,
        provider: request.provider,
        retryable: false
      })
    }

    if (!this.stability) {
      throw new AIServiceError({
        code: 'STABILITY_NOT_AVAILABLE',
        message: 'Stability AI service is not properly configured',
        provider: 'stability',
        retryable: false
      })
    }

    const result = await this.stability.generateImage(request)
    
    // Update usage tracking for image generation
    const cost = this.estimateCost('stability', 0, 0)
    this.updateUsage('stability', 0, cost.estimatedCost)
    
    return result
  }

  async analyzeImage(request: ImageAnalysisRequest): Promise<AIResponse<string>> {
    if (request.provider && request.provider !== 'gemini') {
      throw new AIServiceError({
        code: 'UNSUPPORTED_ANALYSIS_PROVIDER',
        message: `Image analysis is only supported by Gemini`,
        provider: request.provider as SupportedProvider,
        retryable: false
      })
    }

    if (!this.gemini) {
      throw new AIServiceError({
        code: 'GEMINI_NOT_AVAILABLE',
        message: 'Gemini service is not properly configured',
        provider: 'gemini',
        retryable: false
      })
    }

    const result = await this.gemini.analyzeImage(request)
    
    // Update usage tracking
    if (result.usage) {
      const cost = this.estimateCost('gemini', result.usage.promptTokens, result.usage.completionTokens)
      this.updateUsage('gemini', result.usage.totalTokens, cost.estimatedCost)
      result.usage.estimatedCost = cost.estimatedCost
    }
    
    return result
  }

  async editImage(request: ImageEditRequest): Promise<AIResponse<string>> {
    if (request.provider && request.provider !== 'stability') {
      throw new AIServiceError({
        code: 'UNSUPPORTED_EDIT_PROVIDER',
        message: `Image editing is only supported by Stability AI`,
        provider: request.provider,
        retryable: false
      })
    }

    if (!this.stability) {
      throw new AIServiceError({
        code: 'STABILITY_NOT_AVAILABLE',
        message: 'Stability AI service is not properly configured',
        provider: 'stability',
        retryable: false
      })
    }

    const result = await this.stability.editImage(request)
    
    // Update usage tracking for image editing
    const cost = this.estimateCost('stability', 0, 0)
    this.updateUsage('stability', 0, cost.estimatedCost)
    
    return result
  }

  async getProviderStatus(): Promise<ProviderStatus[]> {
    const providers: SupportedProvider[] = ['azure', 'gemini', 'databricks', 'stability', 'openrouter']
    const statuses: ProviderStatus[] = []

    for (const provider of providers) {
      try {
        let available = false
        
        switch (provider) {
          case 'azure':
            available = this.azure ? this.azure.validateConfig() : false
            break
          case 'gemini':
            available = this.gemini ? this.gemini.validateConfig() : false
            break
          case 'databricks':
            available = this.databricks ? this.databricks.validateConfig() : false
            break
          case 'stability':
            available = this.stability ? this.stability.validateConfig() : false
            break
          case 'openrouter':
            available = this.openrouter ? this.openrouter.validateConfig() : false
            break
        }

        statuses.push({
          provider,
          available,
          lastChecked: Date.now()
        })
      } catch (error: any) {
        statuses.push({
          provider,
          available: false,
          lastChecked: Date.now(),
          error: error.message
        })
      }
    }

    return statuses
  }

  getUsageStats(): UsageTracking {
    return { ...this.usage }
  }

  resetUsageStats(): void {
    this.usage = this.initializeUsageTracking()
  }
}

// Export singleton instance (lazy initialization)
let _aiServiceInstance: AIService | null = null
export const aiService = {
  get instance() {
    if (!_aiServiceInstance) {
      _aiServiceInstance = new AIService()
    }
    return _aiServiceInstance
  },
  // Proxy all methods to the instance
  async generateText(request: AIRequest) {
    return this.instance.generateText(request)
  },
  async streamText(request: AIRequest) {
    return this.instance.streamText(request)
  },
  async getChatCompletion(request: ChatCompletionRequest) {
    return this.instance.getChatCompletion(request)
  },
  async generateImage(request: ImageRequest) {
    return this.instance.generateImage(request)
  },
  async analyzeImage(request: ImageAnalysisRequest) {
    return this.instance.analyzeImage(request)
  },
  async editImage(request: ImageEditRequest) {
    return this.instance.editImage(request)
  },
  async getProviderStatus() {
    return this.instance.getProviderStatus()
  },
  getUsageStats() {
    return this.instance.getUsageStats()
  },
  resetUsageStats() {
    return this.instance.resetUsageStats()
  }
}

// Export individual services for direct access
export { AzureAIService, GeminiService, DatabricksService, StabilityService, AIFoundryService }

// Export types for convenience
export type { 
  AIProvider, 
  ImageProvider, 
  SupportedProvider,
  AIRequest, 
  ImageRequest,
  ImageAnalysisRequest,
  ImageEditRequest,
  ChatCompletionRequest,
  AIResponse,
  StreamResponse,
  AIServiceError,
  ProviderStatus,
  UsageTracking,
  CostEstimate
}