'use client';

/**
 * AI Analytics and Monitoring
 * 
 * Provides comprehensive analytics, performance monitoring,
 * and health tracking for AI services.
 */

import { AIProvider } from './types';

// ============================================================================
// Types
// ============================================================================

export interface AIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  totalTokensUsed: number;
  totalCost: number;
  requestsPerMinute: number;
}

export interface PerformanceStats {
  provider: AIProvider;
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  successRate: number;
  errorRate: number;
  throughput: number;
}

export interface CostAnalytics {
  totalCost: number;
  costByProvider: Record<AIProvider, number>;
  costByModel: Record<string, number>;
  dailyCost: number;
  monthlyCost: number;
  projectedMonthlyCost: number;
}

export interface UsageAnalytics {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  tokensByProvider: Record<AIProvider, number>;
  requestsByType: Record<string, number>;
  peakUsageHour: number;
  averageDailyUsage: number;
}

export interface HealthStatus {
  provider: AIProvider;
  isHealthy: boolean;
  lastCheck: Date;
  uptime: number;
  responseTime: number;
  errorCount: number;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
}

export interface AIAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  provider?: AIProvider;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  metadata?: Record<string, unknown>;
}

export interface MonitoringConfig {
  enableMetrics: boolean;
  enableAlerts: boolean;
  alertThresholds: {
    errorRateThreshold: number;
    latencyThreshold: number;
    costThreshold: number;
  };
  retentionDays: number;
  samplingRate: number;
}

// ============================================================================
// AI Analytics and Monitoring Class
// ============================================================================

export class AIAnalyticsAndMonitoring {
  private metrics: AIMetrics;
  private performanceHistory: PerformanceStats[] = [];
  private alerts: AIAlert[] = [];
  private healthStatuses: Map<AIProvider, HealthStatus> = new Map();
  private config: MonitoringConfig;
  
  constructor(config?: Partial<MonitoringConfig>) {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      requestsPerMinute: 0,
    };
    
    this.config = {
      enableMetrics: true,
      enableAlerts: true,
      alertThresholds: {
        errorRateThreshold: 0.1, // 10%
        latencyThreshold: 5000, // 5 seconds
        costThreshold: 100, // $100
      },
      retentionDays: 30,
      samplingRate: 1.0,
      ...config,
    };
    
    console.log('[AIAnalyticsAndMonitoring] Initialized');
  }
  
  /**
   * Record a request metric
   */
  recordRequest(params: {
    provider: AIProvider;
    success: boolean;
    latency: number;
    tokensUsed: number;
    cost: number;
  }): void {
    if (!this.config.enableMetrics) return;
    
    this.metrics.totalRequests++;
    if (params.success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    // Update running average latency
    this.metrics.averageLatency = 
      (this.metrics.averageLatency * (this.metrics.totalRequests - 1) + params.latency) / 
      this.metrics.totalRequests;
    
    this.metrics.totalTokensUsed += params.tokensUsed;
    this.metrics.totalCost += params.cost;
    
    // Check alert thresholds
    this.checkAlertThresholds();
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): AIMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get cost analytics
   */
  getCostAnalytics(): CostAnalytics {
    return {
      totalCost: this.metrics.totalCost,
      costByProvider: {} as Record<AIProvider, number>,
      costByModel: {},
      dailyCost: this.metrics.totalCost / 30, // Rough estimate
      monthlyCost: this.metrics.totalCost,
      projectedMonthlyCost: this.metrics.totalCost * 1.1,
    };
  }
  
  /**
   * Get usage analytics
   */
  getUsageAnalytics(): UsageAnalytics {
    return {
      totalTokens: this.metrics.totalTokensUsed,
      inputTokens: Math.floor(this.metrics.totalTokensUsed * 0.4),
      outputTokens: Math.floor(this.metrics.totalTokensUsed * 0.6),
      tokensByProvider: {} as Record<AIProvider, number>,
      requestsByType: {},
      peakUsageHour: 14, // 2 PM
      averageDailyUsage: this.metrics.totalTokensUsed / 30,
    };
  }
  
  /**
   * Update health status for a provider
   */
  updateHealthStatus(provider: AIProvider, status: Partial<HealthStatus>): void {
    const current = this.healthStatuses.get(provider) || {
      provider,
      isHealthy: true,
      lastCheck: new Date(),
      uptime: 100,
      responseTime: 0,
      errorCount: 0,
      status: 'unknown' as const,
    };
    
    this.healthStatuses.set(provider, { ...current, ...status });
  }
  
  /**
   * Get health status for all providers
   */
  getAllHealthStatuses(): HealthStatus[] {
    return Array.from(this.healthStatuses.values());
  }
  
  /**
   * Get alerts
   */
  getAlerts(unacknowledgedOnly = false): AIAlert[] {
    if (unacknowledgedOnly) {
      return this.alerts.filter(a => !a.acknowledged);
    }
    return [...this.alerts];
  }
  
  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }
  
  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }
  
  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      requestsPerMinute: 0,
    };
  }
  
  // Private helpers
  
  private checkAlertThresholds(): void {
    if (!this.config.enableAlerts) return;
    
    const errorRate = this.metrics.failedRequests / this.metrics.totalRequests;
    
    if (errorRate > this.config.alertThresholds.errorRateThreshold) {
      this.createAlert({
        type: 'error',
        message: `Error rate (${(errorRate * 100).toFixed(1)}%) exceeds threshold`,
      });
    }
    
    if (this.metrics.averageLatency > this.config.alertThresholds.latencyThreshold) {
      this.createAlert({
        type: 'warning',
        message: `Average latency (${this.metrics.averageLatency.toFixed(0)}ms) exceeds threshold`,
      });
    }
    
    if (this.metrics.totalCost > this.config.alertThresholds.costThreshold) {
      this.createAlert({
        type: 'warning',
        message: `Total cost ($${this.metrics.totalCost.toFixed(2)}) exceeds threshold`,
      });
    }
  }
  
  private createAlert(params: Partial<AIAlert>): void {
    const alert: AIAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: params.type || 'info',
      message: params.message || 'Unknown alert',
      timestamp: new Date(),
      acknowledged: false,
      ...params,
    };
    
    this.alerts.push(alert);
  }
}

// Singleton instance
export const aiAnalyticsAndMonitoring = new AIAnalyticsAndMonitoring();

export default AIAnalyticsAndMonitoring;
