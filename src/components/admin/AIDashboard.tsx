'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Surface } from '@/components/ui/Surface'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { aiMonitoring, aiTester } from '@/lib/ai/aiMonitoring'
import { resilientAIService } from '@/lib/ai/resilientAIService'
import { AIProvider } from '@/lib/ai/types'
import { cn } from '@/lib/utils'

interface AIDashboardProps {
  className?: string
}

interface TestResult {
  test: string
  provider: AIProvider
  status: 'passed' | 'failed'
  duration: number
  error?: string
}

export const AIDashboard: React.FC<AIDashboardProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'alerts' | 'tests'>('overview')
  const [metrics, setMetrics] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Refresh data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const [summary, allMetrics, activeAlerts] = await Promise.all([
        aiMonitoring.getPerformanceSummary(),
        aiMonitoring.getAllProviderMetrics(),
        aiMonitoring.getActiveAlerts()
      ])

      setMetrics({ summary, providers: allMetrics })
      setAlerts(activeAlerts)
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Run integration tests
  const runTests = useCallback(async () => {
    setIsRunningTests(true)
    try {
      const results = await aiTester.runIntegrationTests()
      setTestResults(results.results)
    } catch (error) {
      console.error('Failed to run tests:', error)
    } finally {
      setIsRunningTests(false)
    }
  }, [])

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    aiMonitoring.acknowledgeAlert(alertId)
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }, [])

  // Reset circuit breaker
  const resetCircuitBreaker = useCallback((provider: AIProvider) => {
    resilientAIService.resetCircuitBreaker(provider)
    refreshData()
  }, [refreshData])

  // Auto-refresh data
  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [refreshData])

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  // Format cost
  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`
  }

  // Get status color
  const getStatusColor = (status: string, value?: number, threshold?: number) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        if (value !== undefined && threshold !== undefined) {
          return value > threshold ? 'text-red-600' : 'text-green-600'
        }
        return 'text-neutral-600'
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'BarChart3' },
    { id: 'providers', name: 'Providers', icon: 'Server' },
    { id: 'alerts', name: 'Alerts', icon: 'AlertTriangle' },
    { id: 'tests', name: 'Tests', icon: 'CheckCircle' }
  ]

  return (
    <div className={cn('w-full max-w-6xl mx-auto space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Integration Dashboard</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Monitor AI provider performance, costs, and system health
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            buttonSize="medium"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <Icon name={isRefreshing ? 'Loader2' : 'RefreshCw'} 
                  className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="primary"
            buttonSize="medium"
            onClick={runTests}
            disabled={isRunningTests}
          >
            <Icon name={isRunningTests ? 'Loader2' : 'Play'} 
                  className={cn('w-4 h-4 mr-2', isRunningTests && 'animate-spin')} />
            Run Tests
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-700">
        {tabs.map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'ghost'}
            buttonSize="medium"
            onClick={() => setActiveTab(tab.id as any)}
            className="rounded-none border-b-2 border-transparent data-[active=true]:border-blue-500"
          >
            <Icon name={tab.icon as any} className="w-4 h-4 mr-2" />
            {tab.name}
            {tab.id === 'alerts' && alerts.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {alerts.length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Summary Cards */}
            <Surface className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Total Requests
                </h3>
                <Icon name="Activity" className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{metrics.summary.totalRequests.toLocaleString()}</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Last hour
              </div>
            </Surface>

            <Surface className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Success Rate
                </h3>
                <Icon name="CheckCircle" className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold">
                {(metrics.summary.successRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {metrics.summary.totalRequests > 0 ? 'Healthy' : 'No data'}
              </div>
            </Surface>

            <Surface className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Avg Latency
                </h3>
                <Icon name="Clock" className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold">
                {formatDuration(metrics.summary.averageLatency)}
              </div>
              <div className={cn(
                'text-sm',
                getStatusColor('', metrics.summary.averageLatency, 3000)
              )}>
                {metrics.summary.averageLatency > 3000 ? 'Slow' : 'Good'}
              </div>
            </Surface>

            <Surface className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Total Cost
                </h3>
                <Icon name="DollarSign" className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold">
                {formatCost(metrics.summary.totalCost)}
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Last hour
              </div>
            </Surface>

            {/* Provider Breakdown Chart */}
            <Surface className="p-6 col-span-full">
              <h3 className="text-lg font-semibold mb-4">Provider Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(metrics.summary.providerBreakdown).map(([provider, data]: [string, any]) => (
                  <div key={provider} className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium capitalize">{provider}</h4>
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        data.successRate > 0.95 ? 'bg-green-500' :
                        data.successRate > 0.9 ? 'bg-yellow-500' : 'bg-red-500'
                      )} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Requests:</span>
                        <span className="font-medium">{data.requests}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Success Rate:</span>
                        <span className="font-medium">{(data.successRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Avg Latency:</span>
                        <span className="font-medium">{formatDuration(data.averageLatency)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Cost:</span>
                        <span className="font-medium">{formatCost(data.cost)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Surface>
          </div>
        )}

        {/* Providers Tab */}
        {activeTab === 'providers' && metrics && (
          <div className="space-y-6">
            {Object.entries(metrics.providers).map(([provider, data]: [string, any]) => (
              <Surface key={provider} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold capitalize">{provider}</h3>
                    <div className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      data.uptime > 0.99 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                      data.uptime > 0.95 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                    )}>
                      {data.uptime > 0.99 ? 'Healthy' :
                       data.uptime > 0.95 ? 'Degraded' : 'Unhealthy'}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    buttonSize="small"
                    onClick={() => resetCircuitBreaker(provider as AIProvider)}
                  >
                    <Icon name="RotateCcw" className="w-4 h-4 mr-2" />
                    Reset Circuit
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-2xl font-bold">{data.totalRequests.toLocaleString()}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Requests</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{(data.uptime * 100).toFixed(2)}%</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Uptime</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatDuration(data.averageLatency)}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Avg Latency</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatCost(data.totalCost)}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Cost</div>
                  </div>
                </div>

                {data.lastError && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="AlertCircle" className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">Last Error</span>
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-400">
                      {data.lastError.message}
                    </div>
                    <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                      {new Date(data.lastError.timestamp).toLocaleString()}
                    </div>
                  </div>
                )}
              </Surface>
            ))}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <Surface className="p-12 text-center">
                <Icon name="CheckCircle" className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  All AI providers are operating normally
                </p>
              </Surface>
            ) : (
              alerts.map(alert => (
                <Surface key={alert.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Icon 
                        name="AlertTriangle" 
                        className={cn(
                          'w-5 h-5 mt-0.5',
                          alert.severity === 'critical' ? 'text-red-600' :
                          alert.severity === 'error' ? 'text-red-500' :
                          alert.severity === 'warning' ? 'text-yellow-500' :
                          'text-blue-500'
                        )} 
                      />
                      <div>
                        <div className="font-medium capitalize">
                          {alert.provider} - {alert.type}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          {alert.message}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      buttonSize="small"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  </div>
                </Surface>
              ))
            )}
          </div>
        )}

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <Surface className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Integration Tests</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Run comprehensive tests across all AI providers
                  </p>
                </div>
                <Button
                  variant="primary"
                  buttonSize="medium"
                  onClick={runTests}
                  disabled={isRunningTests}
                >
                  <Icon name={isRunningTests ? 'Loader2' : 'Play'} 
                        className={cn('w-4 h-4 mr-2', isRunningTests && 'animate-spin')} />
                  {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
                </Button>
              </div>

              {testResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Passed: {testResults.filter(r => r.status === 'passed').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Failed: {testResults.filter(r => r.status === 'failed').length}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {testResults.map((result, index) => (
                      <div 
                        key={index}
                        className={cn(
                          'flex items-center justify-between p-3 rounded',
                          result.status === 'passed' 
                            ? 'bg-green-50 dark:bg-green-900/20' 
                            : 'bg-red-50 dark:bg-red-900/20'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon 
                            name={result.status === 'passed' ? 'CheckCircle' : 'XCircle'} 
                            className={cn(
                              'w-4 h-4',
                              result.status === 'passed' ? 'text-green-600' : 'text-red-600'
                            )} 
                          />
                          <div>
                            <div className="font-medium">
                              {result.test} ({result.provider})
                            </div>
                            {result.error && (
                              <div className="text-sm text-red-600 dark:text-red-400">
                                {result.error}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          {formatDuration(result.duration)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Surface>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIDashboard