/**
 * AI Analytics and Monitoring System for SpectreWeave5
 * 
 * Comprehensive monitoring, analytics, and observability for AI operations:
 * - Performance metrics tracking
 * - Cost monitoring and optimization
 * - Error tracking and alerting
 * - Usage analytics and insights
 * - Health monitoring and status reporting
 * - Real-time metrics dashboard
 * - Automated alerting and notifications
 */

import { 
  AIProvider, 
  AIResponse, 
  AIRequest,
  AIError,
  TokenUsage,
  AIAnalytics,
  AIEvent,
  AIEventType,
} from './types';

// Analytics and monitoring types
export interface AIMetrics {
  timestamp: Date;
  provider: AIProvider;
  model: string;
  requestType: string;
  latency: number;
  tokenUsage: TokenUsage;
  cost: number;
  success: boolean;
  errorCode?: string;
  userSession?: string;
  projectId?: string;
  documentId?: string;
}

export interface PerformanceStats {
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  successRate: number;
  errorRate: number;
  throughput: number; // requests per minute
  totalRequests: number;
  period: string;
}

export interface CostAnalytics {
  totalCost: number;
  costByProvider: Record<AIProvider, number>;
  costByModel: Record<string, number>;
  costByFeature: Record<string, number>;
  averageCostPerRequest: number;
  costTrends: Array<{
    period: string;
    cost: number;
    requests: number;
  }>;
  budgetUtilization: number;
  projectedMonthlyCost: number;
}

export interface UsageAnalytics {
  totalTokens: number;
  tokensByProvider: Record<AIProvider, number>;
  tokensByModel: Record<string, number>;
  requestsByType: Record<string, number>;
  activeUsers: number;
  topFeatures: Array<{
    feature: string;
    usage: number;
    cost: number;
  }>;
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
  };
}

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  providers: Record<AIProvider, {
    status: 'healthy' | 'degraded' | 'offline';
    latency: number;
    errorRate: number;
    lastCheck: Date;
  }>;
  services: {
    aiServiceManager: 'healthy' | 'degraded' | 'offline';
    ragSystem: 'healthy' | 'degraded' | 'offline';
    bridge: 'healthy' | 'degraded' | 'offline';
    smartSuggestions: 'healthy' | 'degraded' | 'offline';
  };
  alerts: AIAlert[];
}

export interface AIAlert {
  id: string;
  type: 'performance' | 'cost' | 'error' | 'capacity' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface MonitoringConfig {
  metricsRetentionDays: number;
  alertThresholds: {
    errorRate: number;
    latency: number;
    costPerHour: number;
    tokenUsageRate: number;
  };
  enableRealTimeAlerts: boolean;
  dashboardRefreshInterval: number;
  enableUsageTracking: boolean;
  enablePerformanceProfiler: boolean;
}

// Time series data structure for metrics
class TimeSeriesMetrics {
  private metrics: Map<string, AIMetrics[]>;
  private maxRetentionDays: number;

  constructor(maxRetentionDays: number = 30) {
    this.metrics = new Map();
    this.maxRetentionDays = maxRetentionDays;
  }

  addMetric(metric: AIMetrics): void {
    const key = this.getMetricKey(metric);
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key)!.push(metric);
    this.cleanupOldMetrics();
  }

  getMetrics(
    filters: {
      provider?: AIProvider;
      model?: string;
      requestType?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): AIMetrics[] {
    const allMetrics: AIMetrics[] = [];
    
    for (const metricList of this.metrics.values()) {
      allMetrics.push(...metricList);
    }

    return allMetrics.filter(metric => {
      if (filters.provider && metric.provider !== filters.provider) return false;
      if (filters.model && metric.model !== filters.model) return false;
      if (filters.requestType && metric.requestType !== filters.requestType) return false;
      if (filters.startDate && metric.timestamp < filters.startDate) return false;
      if (filters.endDate && metric.timestamp > filters.endDate) return false;
      return true;
    });
  }

  private getMetricKey(metric: AIMetrics): string {
    return `${metric.provider}-${metric.model}-${metric.requestType}`;
  }

  private cleanupOldMetrics(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.maxRetentionDays);

    for (const [key, metricList] of this.metrics.entries()) {
      const filteredMetrics = metricList.filter(metric => metric.timestamp >= cutoffDate);
      this.metrics.set(key, filteredMetrics);
    }
  }
}

export class AIAnalyticsAndMonitoring {
  private timeSeriesMetrics: TimeSeriesMetrics;
  private alerts: AIAlert[];
  private config: MonitoringConfig;
  private eventListeners: Map<string, Set<(alert: AIAlert) => void>>;
  private performanceProfiler: Map<string, { start: number; context: any }>;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      metricsRetentionDays: 30,
      alertThresholds: {
        errorRate: 0.05, // 5%
        latency: 5000, // 5 seconds
        costPerHour: 10.0, // $10/hour
        tokenUsageRate: 100000, // tokens per hour
      },
      enableRealTimeAlerts: true,
      dashboardRefreshInterval: 30000, // 30 seconds
      enableUsageTracking: true,
      enablePerformanceProfiler: true,
      ...config,
    };

    this.timeSeriesMetrics = new TimeSeriesMetrics(this.config.metricsRetentionDays);
    this.alerts = [];
    this.eventListeners = new Map();
    this.performanceProfiler = new Map();
  }

  /**
   * Record AI operation metrics
   */
  recordMetric(
    request: AIRequest,
    response: AIResponse | null,
    error: AIError | null,
    startTime: number
  ): void {
    const endTime = Date.now();
    const latency = endTime - startTime;

    const metric: AIMetrics = {
      timestamp: new Date(),
      provider: response?.provider || 'unknown' as AIProvider,
      model: response?.model || 'unknown',
      requestType: request.type,
      latency,
      tokenUsage: response?.usage || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost: 0,
        latency,
      },
      cost: response?.usage?.cost || 0,
      success: !error && !!response?.success,
      errorCode: error?.code,
      userSession: request.metadata?.userSession,
      projectId: request.context?.projectId,
      documentId: request.context?.documentId,
    };

    this.timeSeriesMetrics.addMetric(metric);

    // Check for alerts
    if (this.config.enableRealTimeAlerts) {
      this.checkAlertConditions(metric);
    }
  }

  /**
   * Start performance profiling for an operation
   */
  startProfiling(operationId: string, context: any = {}): void {
    if (!this.config.enablePerformanceProfiler) return;

    this.performanceProfiler.set(operationId, {
      start: Date.now(),
      context,
    });
  }

  /**
   * End performance profiling and record metrics
   */
  endProfiling(operationId: string, additionalData: any = {}): void {
    if (!this.config.enablePerformanceProfiler) return;

    const profile = this.performanceProfiler.get(operationId);
    if (!profile) return;

    const duration = Date.now() - profile.start;
    this.performanceProfiler.delete(operationId);

    // Record performance metric
    console.log(`Operation ${operationId} completed in ${duration}ms`, {
      ...profile.context,
      ...additionalData,
    });
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day',
    provider?: AIProvider
  ): PerformanceStats {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'hour':
        startDate.setHours(endDate.getHours() - 1);
        break;
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
    }

    const metrics = this.timeSeriesMetrics.getMetrics({
      provider,
      startDate,
      endDate,
    });

    if (metrics.length === 0) {
      return {
        averageLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        successRate: 0,
        errorRate: 0,
        throughput: 0,
        totalRequests: 0,
        period: timeRange,
      };
    }

    const latencies = metrics.map(m => m.latency).sort((a, b) => a - b);
    const successfulRequests = metrics.filter(m => m.success).length;
    const totalRequests = metrics.length;
    const timeRangeMs = endDate.getTime() - startDate.getTime();

    return {
      averageLatency: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
      p95Latency: latencies[Math.floor(latencies.length * 0.95)] || 0,
      p99Latency: latencies[Math.floor(latencies.length * 0.99)] || 0,
      successRate: successfulRequests / totalRequests,
      errorRate: (totalRequests - successfulRequests) / totalRequests,
      throughput: (totalRequests / timeRangeMs) * 60000, // requests per minute
      totalRequests,
      period: timeRange,
    };
  }

  /**
   * Get cost analytics
   */
  getCostAnalytics(
    timeRange: 'day' | 'week' | 'month' = 'day'
  ): CostAnalytics {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
    }

    const metrics = this.timeSeriesMetrics.getMetrics({ startDate, endDate });
    
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const costByProvider: Record<AIProvider, number> = {} as any;
    const costByModel: Record<string, number> = {};
    
    metrics.forEach(metric => {
      costByProvider[metric.provider] = (costByProvider[metric.provider] || 0) + metric.cost;
      costByModel[metric.model] = (costByModel[metric.model] || 0) + metric.cost;
    });

    // Calculate cost trends (daily breakdown)
    const costTrends: Array<{ period: string; cost: number; requests: number }> = [];
    const daysToAnalyze = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30;
    
    for (let i = 0; i < daysToAnalyze; i++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(startDate.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);
      
      const dayMetrics = metrics.filter(m => 
        m.timestamp >= dayStart && m.timestamp < dayEnd
      );
      
      costTrends.push({
        period: dayStart.toISOString().split('T')[0],
        cost: dayMetrics.reduce((sum, m) => sum + m.cost, 0),
        requests: dayMetrics.length,
      });
    }

    // Project monthly cost based on current trends
    const dailyAverageCost = totalCost / daysToAnalyze;
    const projectedMonthlyCost = dailyAverageCost * 30;

    return {
      totalCost,
      costByProvider,
      costByModel,
      costByFeature: {}, // Would need additional tracking
      averageCostPerRequest: metrics.length > 0 ? totalCost / metrics.length : 0,
      costTrends,
      budgetUtilization: 0.75, // Would need budget configuration
      projectedMonthlyCost,
    };
  }

  /**
   * Get usage analytics
   */
  getUsageAnalytics(
    timeRange: 'day' | 'week' | 'month' = 'day'
  ): UsageAnalytics {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
    }

    const metrics = this.timeSeriesMetrics.getMetrics({ startDate, endDate });
    
    const totalTokens = metrics.reduce((sum, m) => sum + m.tokenUsage.totalTokens, 0);
    const tokensByProvider: Record<AIProvider, number> = {} as any;
    const tokensByModel: Record<string, number> = {};
    const requestsByType: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    
    metrics.forEach(metric => {
      tokensByProvider[metric.provider] = (tokensByProvider[metric.provider] || 0) + metric.tokenUsage.totalTokens;
      tokensByModel[metric.model] = (tokensByModel[metric.model] || 0) + metric.tokenUsage.totalTokens;
      requestsByType[metric.requestType] = (requestsByType[metric.requestType] || 0) + 1;
      
      if (metric.userSession) {
        uniqueUsers.add(metric.userSession);
      }
    });

    // Calculate top features by usage and cost
    const topFeatures = Object.entries(requestsByType)
      .map(([feature, usage]) => ({
        feature,
        usage,
        cost: metrics
          .filter(m => m.requestType === feature)
          .reduce((sum, m) => sum + m.cost, 0),
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);

    return {
      totalTokens,
      tokensByProvider,
      tokensByModel,
      requestsByType,
      activeUsers: uniqueUsers.size,
      topFeatures,
      userEngagement: {
        dailyActiveUsers: uniqueUsers.size, // Would need more sophisticated tracking
        weeklyActiveUsers: uniqueUsers.size,
        monthlyActiveUsers: uniqueUsers.size,
        averageSessionDuration: 0, // Would need session tracking
      },
    };
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    // Get recent error rates for each provider
    const recentMetrics = this.timeSeriesMetrics.getMetrics({
      startDate: new Date(Date.now() - 3600000), // Last hour
    });

    const providerHealth: Record<AIProvider, any> = {} as any;
    
    const providers: AIProvider[] = ['azure', 'gemini', 'databricks', 'openai', 'anthropic', 'local'];
    
    providers.forEach(provider => {
      const providerMetrics = recentMetrics.filter(m => m.provider === provider);
      const errorRate = providerMetrics.length > 0 
        ? providerMetrics.filter(m => !m.success).length / providerMetrics.length 
        : 0;
      const avgLatency = providerMetrics.length > 0
        ? providerMetrics.reduce((sum, m) => sum + m.latency, 0) / providerMetrics.length
        : 0;

      let status: 'healthy' | 'degraded' | 'offline' = 'healthy';
      if (errorRate > 0.2) status = 'offline';
      else if (errorRate > 0.1 || avgLatency > 10000) status = 'degraded';

      providerHealth[provider] = {
        status,
        latency: avgLatency,
        errorRate,
        lastCheck: new Date(),
      };
    });

    // Determine overall health
    const providerStatuses = Object.values(providerHealth).map(p => p.status);
    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (providerStatuses.includes('offline')) {
      overall = 'critical';
    } else if (providerStatuses.includes('degraded')) {
      overall = 'degraded';
    }

    return {
      overall,
      providers: providerHealth,
      services: {
        aiServiceManager: 'healthy', // Would need actual health checks
        ragSystem: 'healthy',
        bridge: 'healthy',
        smartSuggestions: 'healthy',
      },
      alerts: this.alerts.filter(alert => !alert.resolved),
    };
  }

  /**
   * Create an alert
   */
  createAlert(alert: Omit<AIAlert, 'id' | 'timestamp' | 'resolved'>): AIAlert {
    const newAlert: AIAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alert,
    };

    this.alerts.push(newAlert);

    // Notify listeners
    const listeners = this.eventListeners.get('alert');
    if (listeners) {
      listeners.forEach(callback => callback(newAlert));
    }

    return newAlert;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Subscribe to alerts
   */
  subscribeToAlerts(callback: (alert: AIAlert) => void): () => void {
    if (!this.eventListeners.has('alert')) {
      this.eventListeners.set('alert', new Set());
    }
    this.eventListeners.get('alert')!.add(callback);
    
    return () => {
      const listeners = this.eventListeners.get('alert');
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Get comprehensive analytics
   */
  getComprehensiveAnalytics(timeRange: 'day' | 'week' | 'month' = 'day'): {
    performance: PerformanceStats;
    cost: CostAnalytics;
    usage: UsageAnalytics;
    health: HealthStatus;
  } {
    return {
      performance: this.getPerformanceStats(timeRange),
      cost: this.getCostAnalytics(timeRange),
      usage: this.getUsageAnalytics(timeRange),
      health: this.getHealthStatus() as HealthStatus, // Remove async for this summary
    };
  }

  /**
   * Export analytics data
   */
  exportAnalytics(
    format: 'json' | 'csv',
    timeRange: 'day' | 'week' | 'month' = 'day'
  ): string {
    const analytics = this.getComprehensiveAnalytics(timeRange);
    
    if (format === 'json') {
      return JSON.stringify(analytics, null, 2);
    } else {
      // Simple CSV export (would need more sophisticated formatting for real use)
      const csvLines = [
        'Metric,Value',
        `Total Requests,${analytics.performance.totalRequests}`,
        `Success Rate,${(analytics.performance.successRate * 100).toFixed(2)}%`,
        `Average Latency,${analytics.performance.averageLatency.toFixed(2)}ms`,
        `Total Cost,$${analytics.cost.totalCost.toFixed(4)}`,
        `Total Tokens,${analytics.usage.totalTokens}`,
        `Active Users,${analytics.usage.activeUsers}`,
      ];
      return csvLines.join('\n');
    }
  }

  /**
   * Private helper methods
   */

  private checkAlertConditions(metric: AIMetrics): void {
    // Check error rate
    if (!metric.success && metric.errorCode) {
      this.createAlert({
        type: 'error',
        severity: 'medium',
        title: 'AI Request Failed',
        message: `Request failed with error: ${metric.errorCode}`,
        metadata: { provider: metric.provider, model: metric.model },
      });
    }

    // Check latency
    if (metric.latency > this.config.alertThresholds.latency) {
      this.createAlert({
        type: 'performance',
        severity: 'medium',
        title: 'High Latency Detected',
        message: `Request took ${metric.latency}ms (threshold: ${this.config.alertThresholds.latency}ms)`,
        metadata: { provider: metric.provider, latency: metric.latency },
      });
    }

    // Check cost
    if (metric.cost > 1.0) { // $1 per request seems high
      this.createAlert({
        type: 'cost',
        severity: 'high',
        title: 'High Cost Request',
        message: `Request cost $${metric.cost.toFixed(4)}`,
        metadata: { provider: metric.provider, cost: metric.cost },
      });
    }
  }
}

// Export singleton instance
export const aiAnalyticsAndMonitoring = new AIAnalyticsAndMonitoring();