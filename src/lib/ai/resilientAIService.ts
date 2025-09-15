/**
 * Resilient AI Service with advanced error handling, retry logic, and fallback strategies
 * Production-ready implementation with circuit breaker, rate limiting, and monitoring
 */

import { 
  AIProvider, 
  AIRequest, 
  ChatCompletionRequest, 
  AIResponse, 
  StreamResponse, 
  AIServiceError,
  TokenUsage,
  SupportedProvider 
} from './types'
import { aiService } from '@/lib/services/ai'

interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: string[]
}

interface CircuitBreakerConfig {
  errorThreshold: number
  timeoutThreshold: number
  resetTimeout: number
}

interface RateLimitConfig {
  requestsPerMinute: number
  burstLimit: number
  providerLimits: Record<AIProvider, number>
}

interface HealthCheckConfig {
  interval: number
  timeout: number
  maxConsecutiveFailures: number
}

interface ProviderHealth {
  provider: SupportedProvider
  isHealthy: boolean
  lastCheck: number
  consecutiveFailures: number
  averageLatency: number
  errorRate: number
}

type CircuitBreakerState = 'closed' | 'open' | 'half-open'

interface CircuitBreaker {
  state: CircuitBreakerState
  errorCount: number
  lastErrorTime: number
  nextAttemptTime: number
}

export class ResilientAIService {
  private retryConfig: RetryConfig
  private circuitBreakerConfig: CircuitBreakerConfig
  private rateLimitConfig: RateLimitConfig
  private healthCheckConfig: HealthCheckConfig
  
  private providerHealth: Record<SupportedProvider, ProviderHealth>
  private circuitBreakers: Record<SupportedProvider, CircuitBreaker>
  private requestCounts: Record<string, { count: number; resetTime: number }>
  private healthCheckInterval?: NodeJS.Timeout
  
  constructor() {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: [
        'RATE_LIMIT_EXCEEDED',
        'TIMEOUT',
        'NETWORK_ERROR',
        'SERVICE_UNAVAILABLE',
        'TEMPORARY_ERROR'
      ]
    }

    this.circuitBreakerConfig = {
      errorThreshold: 5,
      timeoutThreshold: 30000,
      resetTimeout: 60000
    }

    this.rateLimitConfig = {
      requestsPerMinute: 60,
      burstLimit: 10,
      providerLimits: {
        gemini: 60,
        azure: 120,
        databricks: 100
      }
    }

    this.healthCheckConfig = {
      interval: 30000, // 30 seconds
      timeout: 5000,
      maxConsecutiveFailures: 3
    }

    this.providerHealth = this.initializeProviderHealth()
    this.circuitBreakers = this.initializeCircuitBreakers()
    this.requestCounts = {}
    
    this.setupHealthChecks()
  }

  private initializeProviderHealth(): Record<SupportedProvider, ProviderHealth> {
    const providers: SupportedProvider[] = ['gemini', 'azure', 'databricks', 'stability']
    const health: Record<SupportedProvider, ProviderHealth> = {} as any

    providers.forEach(provider => {
      health[provider] = {
        provider,
        isHealthy: true,
        lastCheck: Date.now(),
        consecutiveFailures: 0,
        averageLatency: 0,
        errorRate: 0
      }
    })

    return health
  }

  private initializeCircuitBreakers(): Record<SupportedProvider, CircuitBreaker> {
    const providers: SupportedProvider[] = ['gemini', 'azure', 'databricks', 'stability']
    const breakers: Record<SupportedProvider, CircuitBreaker> = {} as any

    providers.forEach(provider => {
      breakers[provider] = {
        state: 'closed',
        errorCount: 0,
        lastErrorTime: 0,
        nextAttemptTime: 0
      }
    })

    return breakers
  }

  private setupHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks()
    }, this.healthCheckConfig.interval)
  }

  private async performHealthChecks(): Promise<void> {
    const providers: SupportedProvider[] = ['gemini', 'azure', 'databricks', 'stability']
    
    const healthPromises = providers.map(async (provider) => {
      try {
        const startTime = Date.now()
        
        // Simple health check request
        await this.performHealthCheck(provider)
        
        const latency = Date.now() - startTime
        const health = this.providerHealth[provider]
        
        health.isHealthy = true
        health.lastCheck = Date.now()
        health.consecutiveFailures = 0
        health.averageLatency = (health.averageLatency + latency) / 2
        
        // Reset circuit breaker if provider is healthy
        if (this.circuitBreakers[provider].state === 'half-open') {
          this.circuitBreakers[provider].state = 'closed'
          this.circuitBreakers[provider].errorCount = 0
        }
        
      } catch (error: any) {
        const health = this.providerHealth[provider]
        health.consecutiveFailures++
        health.lastCheck = Date.now()
        
        if (health.consecutiveFailures >= this.healthCheckConfig.maxConsecutiveFailures) {
          health.isHealthy = false
          this.openCircuitBreaker(provider, error)
        }
      }
    })

    await Promise.allSettled(healthPromises)
  }

  private async performHealthCheck(provider: SupportedProvider): Promise<void> {
    // Simple test request to verify provider availability
    if (provider === 'stability') {
      // Skip health check for image providers as they're expensive
      return
    }

    const testRequest: AIRequest = {
      prompt: 'Test',
      provider: provider as AIProvider,
      options: { maxTokens: 5 }
    }

    await this.executeWithTimeout(
      () => aiService.generateText(testRequest),
      this.healthCheckConfig.timeout
    )
  }

  private openCircuitBreaker(provider: SupportedProvider, error: any): void {
    const breaker = this.circuitBreakers[provider]
    breaker.state = 'open'
    breaker.errorCount++
    breaker.lastErrorTime = Date.now()
    breaker.nextAttemptTime = Date.now() + this.circuitBreakerConfig.resetTimeout
    
    console.warn(`Circuit breaker opened for ${provider}:`, error.message)
  }

  private checkCircuitBreaker(provider: SupportedProvider): boolean {
    const breaker = this.circuitBreakers[provider]
    const now = Date.now()

    switch (breaker.state) {
      case 'closed':
        return true
      
      case 'open':
        if (now >= breaker.nextAttemptTime) {
          breaker.state = 'half-open'
          return true
        }
        return false
      
      case 'half-open':
        return true
      
      default:
        return false
    }
  }

  private updateCircuitBreakerOnSuccess(provider: SupportedProvider): void {
    const breaker = this.circuitBreakers[provider]
    if (breaker.state === 'half-open') {
      breaker.state = 'closed'
      breaker.errorCount = 0
    }
  }

  private updateCircuitBreakerOnError(provider: SupportedProvider, error: any): void {
    const breaker = this.circuitBreakers[provider]
    breaker.errorCount++
    breaker.lastErrorTime = Date.now()

    if (breaker.errorCount >= this.circuitBreakerConfig.errorThreshold) {
      this.openCircuitBreaker(provider, error)
    }
  }

  private checkRateLimit(provider: AIProvider, userId?: string): boolean {
    const key = `${provider}_${userId || 'anonymous'}`
    const now = Date.now()
    const limit = this.rateLimitConfig.providerLimits[provider] || this.rateLimitConfig.requestsPerMinute
    
    const record = this.requestCounts[key]
    if (!record || now >= record.resetTime) {
      this.requestCounts[key] = {
        count: 1,
        resetTime: now + 60000 // 1 minute
      }
      return true
    }

    if (record.count >= limit) {
      return false
    }

    record.count++
    return true
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new AIServiceError({
          code: 'TIMEOUT',
          message: `Operation timed out after ${timeout}ms`,
          provider: 'unknown' as any,
          retryable: true
        }))
      }, timeout)

      operation()
        .then((result) => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch((error) => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    provider: SupportedProvider,
    attempt: number = 0
  ): Promise<T> {
    try {
      const result = await operation()
      this.updateCircuitBreakerOnSuccess(provider)
      return result
    } catch (error: any) {
      const aiError = error instanceof AIServiceError ? error : new AIServiceError({
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Unknown error occurred',
        provider,
        retryable: false
      })

      // Update circuit breaker
      this.updateCircuitBreakerOnError(provider, aiError)

      // Check if error is retryable and we haven't exceeded max retries
      if (attempt >= this.retryConfig.maxRetries || !this.isRetryableError(aiError)) {
        throw aiError
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
        this.retryConfig.maxDelay
      )

      console.warn(`Retrying ${provider} request in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxRetries})`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
      return this.retryWithBackoff(operation, provider, attempt + 1)
    }
  }

  private isRetryableError(error: AIServiceError): boolean {
    return this.retryConfig.retryableErrors.includes(error.code) || error.retryable
  }

  private selectBestProvider(preferredProvider?: AIProvider): AIProvider {
    const availableProviders = (['gemini', 'azure', 'databricks'] as AIProvider[])
      .filter(provider => {
        const health = this.providerHealth[provider]
        const circuitBreaker = this.circuitBreakers[provider]
        return health.isHealthy && this.checkCircuitBreaker(provider)
      })
      .sort((a, b) => {
        const healthA = this.providerHealth[a]
        const healthB = this.providerHealth[b]
        
        // Sort by error rate (lower is better), then by latency
        if (healthA.errorRate !== healthB.errorRate) {
          return healthA.errorRate - healthB.errorRate
        }
        return healthA.averageLatency - healthB.averageLatency
      })

    if (availableProviders.length === 0) {
      throw new AIServiceError({
        code: 'ALL_PROVIDERS_UNAVAILABLE',
        message: 'All AI providers are currently unavailable',
        provider: 'unknown' as any,
        retryable: true
      })
    }

    // Use preferred provider if available and healthy
    if (preferredProvider && availableProviders.includes(preferredProvider)) {
      return preferredProvider
    }

    // Return the best available provider
    return availableProviders[0]
  }

  /**
   * Generate text with resilient error handling and fallbacks
   */
  async generateText(request: AIRequest, userId?: string): Promise<AIResponse<string>> {
    const provider = this.selectBestProvider(request.provider)
    
    // Check rate limits
    if (!this.checkRateLimit(provider, userId)) {
      throw new AIServiceError({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded for this provider',
        provider,
        retryable: true
      })
    }

    // Check circuit breaker
    if (!this.checkCircuitBreaker(provider)) {
      throw new AIServiceError({
        code: 'CIRCUIT_BREAKER_OPEN',
        message: `Circuit breaker is open for ${provider}`,
        provider,
        retryable: true
      })
    }

    const startTime = Date.now()
    
    const operation = async () => {
      return await this.executeWithTimeout(
        () => aiService.generateText({ ...request, provider }),
        30000 // 30 second timeout
      )
    }

    try {
      const result = await this.retryWithBackoff(operation, provider)
      
      // Update health metrics
      const latency = Date.now() - startTime
      const health = this.providerHealth[provider]
      health.averageLatency = (health.averageLatency + latency) / 2
      
      return result
    } catch (error: any) {
      // Update error rate
      const health = this.providerHealth[provider]
      health.errorRate = (health.errorRate + 1) / 2
      
      throw error
    }
  }

  /**
   * Get chat completion with resilient handling
   */
  async getChatCompletion(request: ChatCompletionRequest, userId?: string): Promise<AIResponse<string>> {
    const provider = this.selectBestProvider(request.provider)
    
    if (!this.checkRateLimit(provider, userId)) {
      throw new AIServiceError({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded for this provider',
        provider,
        retryable: true
      })
    }

    if (!this.checkCircuitBreaker(provider)) {
      throw new AIServiceError({
        code: 'CIRCUIT_BREAKER_OPEN',
        message: `Circuit breaker is open for ${provider}`,
        provider,
        retryable: true
      })
    }

    const operation = async () => {
      return await this.executeWithTimeout(
        () => aiService.getChatCompletion({ ...request, provider }),
        45000 // 45 second timeout for chat
      )
    }

    return await this.retryWithBackoff(operation, provider)
  }

  /**
   * Stream text with resilient handling
   */
  async streamText(request: AIRequest, userId?: string): Promise<StreamResponse> {
    const provider = this.selectBestProvider(request.provider)
    
    if (!this.checkRateLimit(provider, userId)) {
      throw new AIServiceError({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded for this provider',
        provider,
        retryable: true
      })
    }

    if (!this.checkCircuitBreaker(provider)) {
      throw new AIServiceError({
        code: 'CIRCUIT_BREAKER_OPEN',
        message: `Circuit breaker is open for ${provider}`,
        provider,
        retryable: true
      })
    }

    // Streaming generally shouldn't be retried due to state issues
    return await aiService.streamText({ ...request, provider })
  }

  /**
   * Get provider health status
   */
  getProviderHealth(): Record<SupportedProvider, ProviderHealth> {
    return { ...this.providerHealth }
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): Record<SupportedProvider, CircuitBreaker> {
    return { ...this.circuitBreakers }
  }

  /**
   * Manually reset circuit breaker
   */
  resetCircuitBreaker(provider: SupportedProvider): void {
    this.circuitBreakers[provider] = {
      state: 'closed',
      errorCount: 0,
      lastErrorTime: 0,
      nextAttemptTime: 0
    }
    
    this.providerHealth[provider].isHealthy = true
    this.providerHealth[provider].consecutiveFailures = 0
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<{
    retry: Partial<RetryConfig>
    circuitBreaker: Partial<CircuitBreakerConfig>
    rateLimit: Partial<RateLimitConfig>
    healthCheck: Partial<HealthCheckConfig>
  }>): void {
    if (config.retry) {
      this.retryConfig = { ...this.retryConfig, ...config.retry }
    }
    
    if (config.circuitBreaker) {
      this.circuitBreakerConfig = { ...this.circuitBreakerConfig, ...config.circuitBreaker }
    }
    
    if (config.rateLimit) {
      this.rateLimitConfig = { ...this.rateLimitConfig, ...config.rateLimit }
    }
    
    if (config.healthCheck) {
      this.healthCheckConfig = { ...this.healthCheckConfig, ...config.healthCheck }
      
      // Restart health checks if interval changed
      if (config.healthCheck.interval && this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
        this.setupHealthChecks()
      }
    }
  }

  /**
   * Get service statistics
   */
  getStatistics(): {
    providerHealth: Record<SupportedProvider, ProviderHealth>
    circuitBreakers: Record<SupportedProvider, CircuitBreaker>
    requestCounts: Record<string, { count: number; resetTime: number }>
  } {
    return {
      providerHealth: this.getProviderHealth(),
      circuitBreakers: this.getCircuitBreakerStatus(),
      requestCounts: { ...this.requestCounts }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
  }
}

// Export singleton instance
export const resilientAIService = new ResilientAIService()

export default resilientAIService