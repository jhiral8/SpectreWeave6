/**
 * AI Integration Performance Monitoring and Testing System
 * Production-ready monitoring with metrics collection and alerts
 */

import { AIProvider, AIResponse, TokenUsage } from './types'

interface PerformanceMetrics {
  requestId: string
  provider: AIProvider
  operation: 'generateText' | 'getChatCompletion' | 'streamText'
  startTime: number
  endTime: number
  duration: number
  success: boolean
  error?: string
  tokenUsage?: TokenUsage
  promptLength: number
  responseLength: number
  cost?: number
}

interface ProviderMetrics {
  provider: AIProvider
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageLatency: number
  averageTokensPerRequest: number
  totalCost: number
  uptime: number
  errorRate: number
  lastError?: {
    timestamp: number
    message: string
    code: string
  }
}

interface Alert {
  id: string
  type: 'performance' | 'error' | 'cost' | 'quota'
  severity: 'info' | 'warning' | 'error' | 'critical'
  provider: AIProvider
  message: string
  timestamp: number
  acknowledged: boolean
  metadata?: Record<string, any>
}

interface MonitoringConfig {
  enableMetrics: boolean
  enableAlerts: boolean
  alertThresholds: {
    errorRate: number
    averageLatency: number
    costPerHour: number
    failureStreak: number
  }
  retentionDays: number
  samplingRate: number
}

export class AIMonitoringService {
  private metrics: PerformanceMetrics[] = []
  private providerMetrics: Map<AIProvider, ProviderMetrics> = new Map()
  private alerts: Alert[] = []
  private config: MonitoringConfig
  private cleanupInterval?: NodeJS.Timeout

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      enableMetrics: true,
      enableAlerts: true,
      alertThresholds: {
        errorRate: 0.1, // 10%
        averageLatency: 5000, // 5 seconds
        costPerHour: 10, // $10 per hour
        failureStreak: 5 // 5 consecutive failures
      },
      retentionDays: 7,
      samplingRate: 1.0, // 100% sampling
      ...config
    }

    this.initializeProviderMetrics()
    this.setupCleanup()
  }

  private initializeProviderMetrics(): void {
    const providers: AIProvider[] = ['gemini', 'azure', 'databricks']
    providers.forEach(provider => {
      this.providerMetrics.set(provider, {
        provider,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        averageTokensPerRequest: 0,
        totalCost: 0,
        uptime: 1.0,
        errorRate: 0
      })
    })
  }

  private setupCleanup(): void {
    // Clean old metrics every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMetrics()
    }, 3600000) // 1 hour
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000)
    this.metrics = this.metrics.filter(metric => metric.startTime > cutoffTime)
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime)
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.samplingRate
  }

  /**
   * Record performance metrics for an AI operation
   */
  recordMetrics(
    provider: AIProvider,
    operation: 'generateText' | 'getChatCompletion' | 'streamText',
    startTime: number,
    endTime: number,
    success: boolean,
    promptLength: number,
    responseLength: number,
    tokenUsage?: TokenUsage,
    error?: string,
    cost?: number
  ): void {
    if (!this.config.enableMetrics || !this.shouldSample()) return

    const metric: PerformanceMetrics = {
      requestId: `${provider}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      provider,
      operation,
      startTime,
      endTime,
      duration: endTime - startTime,
      success,
      error,
      tokenUsage,
      promptLength,
      responseLength,
      cost
    }

    this.metrics.push(metric)
    this.updateProviderMetrics(provider, metric)
    
    if (this.config.enableAlerts) {
      this.checkAlertConditions(provider, metric)
    }
  }

  private updateProviderMetrics(provider: AIProvider, metric: PerformanceMetrics): void {
    const providerMetric = this.providerMetrics.get(provider)
    if (!providerMetric) return

    providerMetric.totalRequests++
    
    if (metric.success) {
      providerMetric.successfulRequests++
    } else {
      providerMetric.failedRequests++
      providerMetric.lastError = {
        timestamp: metric.endTime,
        message: metric.error || 'Unknown error',
        code: 'UNKNOWN'
      }
    }

    // Update average latency
    providerMetric.averageLatency = 
      (providerMetric.averageLatency * (providerMetric.totalRequests - 1) + metric.duration) / 
      providerMetric.totalRequests

    // Update average tokens per request
    if (metric.tokenUsage) {
      providerMetric.averageTokensPerRequest = 
        (providerMetric.averageTokensPerRequest * (providerMetric.totalRequests - 1) + metric.tokenUsage.totalTokens) / 
        providerMetric.totalRequests
    }

    // Update total cost
    if (metric.cost) {
      providerMetric.totalCost += metric.cost
    }

    // Update error rate
    providerMetric.errorRate = providerMetric.failedRequests / providerMetric.totalRequests

    // Update uptime (simplified calculation)
    providerMetric.uptime = providerMetric.successfulRequests / providerMetric.totalRequests
  }

  private checkAlertConditions(provider: AIProvider, metric: PerformanceMetrics): void {
    const providerMetric = this.providerMetrics.get(provider)
    if (!providerMetric) return

    // Check error rate threshold
    if (providerMetric.errorRate > this.config.alertThresholds.errorRate && 
        providerMetric.totalRequests > 10) {
      this.createAlert({
        type: 'error',
        severity: 'warning',
        provider,
        message: `High error rate detected: ${(providerMetric.errorRate * 100).toFixed(1)}%`,
        metadata: { errorRate: providerMetric.errorRate, threshold: this.config.alertThresholds.errorRate }
      })
    }

    // Check latency threshold
    if (metric.duration > this.config.alertThresholds.averageLatency) {
      this.createAlert({
        type: 'performance',
        severity: 'warning',
        provider,
        message: `High latency detected: ${metric.duration}ms`,
        metadata: { latency: metric.duration, threshold: this.config.alertThresholds.averageLatency }
      })
    }

    // Check for consecutive failures
    const recentMetrics = this.metrics
      .filter(m => m.provider === provider)
      .slice(-this.config.alertThresholds.failureStreak)
    
    if (recentMetrics.length === this.config.alertThresholds.failureStreak &&
        recentMetrics.every(m => !m.success)) {
      this.createAlert({
        type: 'error',
        severity: 'critical',
        provider,
        message: `${this.config.alertThresholds.failureStreak} consecutive failures detected`,
        metadata: { consecutiveFailures: this.config.alertThresholds.failureStreak }
      })
    }

    // Check hourly cost threshold
    const hourAgo = Date.now() - 3600000
    const hourlyCost = this.metrics
      .filter(m => m.provider === provider && m.startTime > hourAgo && m.cost)
      .reduce((sum, m) => sum + (m.cost || 0), 0)
    
    if (hourlyCost > this.config.alertThresholds.costPerHour) {
      this.createAlert({
        type: 'cost',
        severity: 'warning',
        provider,
        message: `High hourly cost: $${hourlyCost.toFixed(2)}`,
        metadata: { cost: hourlyCost, threshold: this.config.alertThresholds.costPerHour }
      })
    }
  }

  private createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>): void {
    // Check if similar alert already exists recently
    const recentSimilarAlert = this.alerts.find(alert =>
      alert.type === alertData.type &&
      alert.provider === alertData.provider &&
      (Date.now() - alert.timestamp) < 300000 && // 5 minutes
      !alert.acknowledged
    )

    if (recentSimilarAlert) return

    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      acknowledged: false,
      ...alertData
    }

    this.alerts.push(alert)
    
    // Log critical alerts immediately
    if (alert.severity === 'critical') {
      console.error('CRITICAL AI ALERT:', alert)
    } else if (alert.severity === 'error') {
      console.warn('AI ERROR ALERT:', alert)
    }
  }

  /**
   * Get performance metrics for a provider
   */
  getProviderMetrics(provider: AIProvider): ProviderMetrics | undefined {
    return this.providerMetrics.get(provider)
  }

  /**
   * Get all provider metrics
   */
  getAllProviderMetrics(): Record<AIProvider, ProviderMetrics> {
    const result: Record<AIProvider, ProviderMetrics> = {} as any
    this.providerMetrics.forEach((metrics, provider) => {
      result[provider] = { ...metrics }
    })
    return result
  }

  /**
   * Get recent performance metrics
   */
  getRecentMetrics(provider?: AIProvider, limit = 100): PerformanceMetrics[] {
    return this.metrics
      .filter(metric => !provider || metric.provider === provider)
      .slice(-limit)
      .reverse()
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(provider?: AIProvider): Alert[] {
    return this.alerts
      .filter(alert => !alert.acknowledged)
      .filter(alert => !provider || alert.provider === provider)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      return true
    }
    return false
  }

  /**
   * Get performance summary for dashboard
   */
  getPerformanceSummary(timeRange = 3600000): {
    totalRequests: number
    successRate: number
    averageLatency: number
    totalCost: number
    providerBreakdown: Record<AIProvider, {
      requests: number
      successRate: number
      averageLatency: number
      cost: number
    }>
  } {
    const cutoffTime = Date.now() - timeRange
    const recentMetrics = this.metrics.filter(m => m.startTime > cutoffTime)

    const summary = {
      totalRequests: recentMetrics.length,
      successRate: recentMetrics.filter(m => m.success).length / recentMetrics.length || 0,
      averageLatency: recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length || 0,
      totalCost: recentMetrics.reduce((sum, m) => sum + (m.cost || 0), 0),
      providerBreakdown: {} as any
    }

    // Calculate provider breakdown
    const providers: AIProvider[] = ['gemini', 'azure', 'databricks']
    providers.forEach(provider => {
      const providerMetrics = recentMetrics.filter(m => m.provider === provider)
      summary.providerBreakdown[provider] = {
        requests: providerMetrics.length,
        successRate: providerMetrics.filter(m => m.success).length / providerMetrics.length || 0,
        averageLatency: providerMetrics.reduce((sum, m) => sum + m.duration, 0) / providerMetrics.length || 0,
        cost: providerMetrics.reduce((sum, m) => sum + (m.cost || 0), 0)
      }
    })

    return summary
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'requestId', 'provider', 'operation', 'startTime', 'duration', 
        'success', 'promptLength', 'responseLength', 'totalTokens', 'cost', 'error'
      ]
      
      const rows = this.metrics.map(metric => [
        metric.requestId,
        metric.provider,
        metric.operation,
        new Date(metric.startTime).toISOString(),
        metric.duration,
        metric.success,
        metric.promptLength,
        metric.responseLength,
        metric.tokenUsage?.totalTokens || 0,
        metric.cost || 0,
        metric.error || ''
      ])

      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    }

    return JSON.stringify({
      metrics: this.metrics,
      providerMetrics: Object.fromEntries(this.providerMetrics),
      alerts: this.alerts,
      generatedAt: new Date().toISOString()
    }, null, 2)
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}

// Export singleton instance
export const aiMonitoring = new AIMonitoringService()

// Test suite for AI integration
export class AIIntegrationTester {
  private monitoring: AIMonitoringService

  constructor(monitoring: AIMonitoringService) {
    this.monitoring = monitoring
  }

  /**
   * Run comprehensive AI integration tests
   */
  async runIntegrationTests(): Promise<{
    passed: number
    failed: number
    results: Array<{
      test: string
      provider: AIProvider
      status: 'passed' | 'failed'
      duration: number
      error?: string
    }>
  }> {
    const tests = [
      { name: 'Basic Text Generation', provider: 'gemini' as AIProvider },
      { name: 'Basic Text Generation', provider: 'azure' as AIProvider },
      { name: 'Basic Text Generation', provider: 'databricks' as AIProvider },
      { name: 'Chat Completion', provider: 'gemini' as AIProvider },
      { name: 'Chat Completion', provider: 'databricks' as AIProvider },
      { name: 'Long Text Processing', provider: 'gemini' as AIProvider },
      { name: 'Error Handling', provider: 'gemini' as AIProvider }
    ]

    const results = []
    let passed = 0
    let failed = 0

    for (const test of tests) {
      const startTime = Date.now()
      
      try {
        await this.runSingleTest(test.name, test.provider)
        const duration = Date.now() - startTime
        
        results.push({
          test: test.name,
          provider: test.provider,
          status: 'passed' as const,
          duration
        })
        passed++
        
      } catch (error: any) {
        const duration = Date.now() - startTime
        
        results.push({
          test: test.name,
          provider: test.provider,
          status: 'failed' as const,
          duration,
          error: error.message
        })
        failed++
      }

      // Add delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return { passed, failed, results }
  }

  private async runSingleTest(testName: string, provider: AIProvider): Promise<void> {
    const { resilientAIService } = await import('./resilientAIService')
    
    switch (testName) {
      case 'Basic Text Generation':
        await resilientAIService.generateText({
          prompt: 'Write a brief hello message.',
          provider,
          options: { maxTokens: 50 }
        })
        break

      case 'Chat Completion':
        await resilientAIService.getChatCompletion({
          messages: [{ role: 'user', content: 'Say hello!' }],
          provider,
          options: { maxTokens: 50 }
        })
        break

      case 'Long Text Processing':
        const longPrompt = 'Write a detailed explanation about artificial intelligence. '.repeat(10)
        await resilientAIService.generateText({
          prompt: longPrompt,
          provider,
          options: { maxTokens: 200 }
        })
        break

      case 'Error Handling':
        try {
          await resilientAIService.generateText({
            prompt: '',
            provider,
            options: { maxTokens: -1 } // Invalid parameter
          })
          throw new Error('Expected error was not thrown')
        } catch (error: any) {
          if (error.message === 'Expected error was not thrown') {
            throw error
          }
          // Expected error, test passes
        }
        break

      default:
        throw new Error(`Unknown test: ${testName}`)
    }
  }
}

export const aiTester = new AIIntegrationTester(aiMonitoring)

export default aiMonitoring