/**
 * Cost tracking and usage monitoring utilities for AI services
 */

import { 
  SupportedProvider, 
  UsageTracking, 
  CostEstimate,
  TokenUsage 
} from '@/lib/ai/types'

// Updated pricing as of 2024 (prices per 1K tokens)
export const AI_PRICING = {
  azure: {
    input: 0.0015,   // GPT-4 Turbo input
    output: 0.002,   // GPT-4 Turbo output
    name: 'GPT-4 Turbo'
  },
  gemini: {
    input: 0.00125,  // Gemini Pro input
    output: 0.005,   // Gemini Pro output
    name: 'Gemini 2.0 Flash'
  },
  databricks: {
    input: 0.0005,   // Meta Llama 3.3 70B input
    output: 0.0015,  // Meta Llama 3.3 70B output
    name: 'Meta Llama 3.3 70B'
  },
  stability: {
    perImage: 0.02,  // Stable Diffusion XL per image
    name: 'Stable Diffusion XL'
  }
} as const

export interface CostBreakdown {
  provider: SupportedProvider
  modelName: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  inputCost: number
  outputCost: number
  totalCost: number
  currency: string
}

export interface UsageSession {
  sessionId: string
  startTime: number
  endTime?: number
  totalCost: number
  requestCount: number
  providers: Record<SupportedProvider, {
    requests: number
    cost: number
    tokens: number
  }>
}

export class CostTracker {
  private sessions: Map<string, UsageSession> = new Map()
  private currentSession: string | null = null

  /**
   * Start a new usage tracking session
   */
  startSession(sessionId?: string): string {
    const id = sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const session: UsageSession = {
      sessionId: id,
      startTime: Date.now(),
      totalCost: 0,
      requestCount: 0,
      providers: {
        azure: { requests: 0, cost: 0, tokens: 0 },
        gemini: { requests: 0, cost: 0, tokens: 0 },
        databricks: { requests: 0, cost: 0, tokens: 0 },
        stability: { requests: 0, cost: 0, tokens: 0 }
      }
    }

    this.sessions.set(id, session)
    this.currentSession = id
    return id
  }

  /**
   * End the current session
   */
  endSession(sessionId?: string): UsageSession | null {
    const id = sessionId || this.currentSession
    if (!id) return null

    const session = this.sessions.get(id)
    if (session) {
      session.endTime = Date.now()
      if (id === this.currentSession) {
        this.currentSession = null
      }
    }

    return session || null
  }

  /**
   * Calculate cost for a given usage
   */
  calculateCost(
    provider: SupportedProvider, 
    usage: TokenUsage | { images: number }
  ): CostBreakdown {
    const pricing = AI_PRICING[provider]

    if (provider === 'stability') {
      const imageCount = 'images' in usage ? usage.images : 1
      const totalCost = imageCount * pricing.perImage
      
      return {
        provider,
        modelName: pricing.name,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        inputCost: 0,
        outputCost: totalCost,
        totalCost,
        currency: 'USD'
      }
    }

    const inputCost = (usage.promptTokens / 1000) * pricing.input
    const outputCost = (usage.completionTokens / 1000) * pricing.output
    const totalCost = inputCost + outputCost

    return {
      provider,
      modelName: pricing.name,
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      inputCost,
      outputCost,
      totalCost,
      currency: 'USD'
    }
  }

  /**
   * Track usage for the current session
   */
  trackUsage(
    provider: SupportedProvider, 
    usage: TokenUsage | { images: number }
  ): CostBreakdown {
    const cost = this.calculateCost(provider, usage)
    
    if (this.currentSession) {
      const session = this.sessions.get(this.currentSession)
      if (session) {
        session.requestCount++
        session.totalCost += cost.totalCost
        session.providers[provider].requests++
        session.providers[provider].cost += cost.totalCost
        session.providers[provider].tokens += cost.totalTokens
      }
    }

    return cost
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId?: string): UsageSession | null {
    const id = sessionId || this.currentSession
    if (!id) return null
    return this.sessions.get(id) || null
  }

  /**
   * Get all sessions
   */
  getAllSessions(): UsageSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.startTime - a.startTime)
  }

  /**
   * Clear all sessions
   */
  clearSessions(): void {
    this.sessions.clear()
    this.currentSession = null
  }

  /**
   * Export session data for analysis
   */
  exportSessionData(sessionId?: string): string {
    const session = this.getSessionStats(sessionId)
    if (!session) return ''

    return JSON.stringify(session, null, 2)
  }

  /**
   * Get cost projections based on current usage
   */
  getProjections(sessionId?: string): {
    hourly: number
    daily: number
    monthly: number
  } {
    const session = this.getSessionStats(sessionId)
    if (!session || !session.endTime) {
      return { hourly: 0, daily: 0, monthly: 0 }
    }

    const duration = session.endTime - session.startTime
    const durationHours = duration / (1000 * 60 * 60)
    
    if (durationHours === 0) {
      return { hourly: 0, daily: 0, monthly: 0 }
    }

    const costPerHour = session.totalCost / durationHours

    return {
      hourly: costPerHour,
      daily: costPerHour * 24,
      monthly: costPerHour * 24 * 30
    }
  }
}

/**
 * Utility functions for cost estimation
 */
export class CostEstimator {
  /**
   * Estimate cost before making an AI request
   */
  static estimateTextCost(
    provider: Exclude<SupportedProvider, 'stability'>,
    promptText: string,
    expectedOutputTokens: number = 500
  ): CostEstimate {
    // Rough estimation: 4 characters per token
    const promptTokens = Math.ceil(promptText.length / 4)
    const pricing = AI_PRICING[provider]

    const inputCost = (promptTokens / 1000) * pricing.input
    const outputCost = (expectedOutputTokens / 1000) * pricing.output

    return {
      provider,
      estimatedCost: inputCost + outputCost,
      currency: 'USD',
      breakdown: {
        inputTokens: promptTokens,
        outputTokens: expectedOutputTokens,
        inputCost,
        outputCost
      }
    }
  }

  /**
   * Estimate image generation cost
   */
  static estimateImageCost(imageCount: number = 1): CostEstimate {
    const pricing = AI_PRICING.stability
    const totalCost = imageCount * pricing.perImage

    return {
      provider: 'stability',
      estimatedCost: totalCost,
      currency: 'USD',
      breakdown: {
        inputTokens: 0,
        outputTokens: 0,
        inputCost: 0,
        outputCost: totalCost
      }
    }
  }

  /**
   * Compare costs across providers for the same prompt
   */
  static compareCosts(
    promptText: string,
    expectedOutputTokens: number = 500
  ): Record<Exclude<SupportedProvider, 'stability'>, CostEstimate> {
    const providers: Exclude<SupportedProvider, 'stability'>[] = ['azure', 'gemini', 'databricks']
    const comparisons: any = {}

    providers.forEach(provider => {
      comparisons[provider] = this.estimateTextCost(provider, promptText, expectedOutputTokens)
    })

    return comparisons
  }
}

/**
 * Budget management utilities
 */
export class BudgetManager {
  private budgets: Map<string, {
    limit: number
    spent: number
    period: 'hourly' | 'daily' | 'monthly'
    startTime: number
  }> = new Map()

  /**
   * Set a budget limit
   */
  setBudget(
    name: string, 
    limit: number, 
    period: 'hourly' | 'daily' | 'monthly' = 'daily'
  ): void {
    this.budgets.set(name, {
      limit,
      spent: 0,
      period,
      startTime: Date.now()
    })
  }

  /**
   * Track spending against budget
   */
  trackSpending(budgetName: string, amount: number): {
    spent: number
    remaining: number
    limit: number
    percentUsed: number
    exceeded: boolean
  } {
    const budget = this.budgets.get(budgetName)
    if (!budget) {
      throw new Error(`Budget '${budgetName}' not found`)
    }

    budget.spent += amount
    const remaining = Math.max(0, budget.limit - budget.spent)
    const percentUsed = (budget.spent / budget.limit) * 100
    const exceeded = budget.spent > budget.limit

    return {
      spent: budget.spent,
      remaining,
      limit: budget.limit,
      percentUsed,
      exceeded
    }
  }

  /**
   * Check if budget allows for a transaction
   */
  canAfford(budgetName: string, amount: number): boolean {
    const budget = this.budgets.get(budgetName)
    if (!budget) return true // No budget means unlimited

    return (budget.spent + amount) <= budget.limit
  }

  /**
   * Reset budget for new period
   */
  resetBudget(budgetName: string): void {
    const budget = this.budgets.get(budgetName)
    if (budget) {
      budget.spent = 0
      budget.startTime = Date.now()
    }
  }

  /**
   * Get all budget statuses
   */
  getAllBudgets(): Record<string, any> {
    const result: Record<string, any> = {}
    
    this.budgets.forEach((budget, name) => {
      const remaining = Math.max(0, budget.limit - budget.spent)
      const percentUsed = (budget.spent / budget.limit) * 100
      
      result[name] = {
        ...budget,
        remaining,
        percentUsed,
        exceeded: budget.spent > budget.limit
      }
    })

    return result
  }
}

// Export singleton instances
export const costTracker = new CostTracker()
export const budgetManager = new BudgetManager()