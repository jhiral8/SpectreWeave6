/**
 * Rate limiting middleware for AI endpoints
 * Prevents abuse and manages API quotas across different providers
 */

import { NextRequest, NextResponse } from 'next/server'
import { RateLimit, RateLimitStatus } from '@/lib/ai/types'

interface RateLimitRule {
  windowMs: number     // Time window in milliseconds
  maxRequests: number  // Max requests per window
  message?: string     // Custom error message
  skipSuccessfulRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
}

interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key)
      }
    }
  }

  private getKey(req: NextRequest, keyGenerator?: (req: NextRequest) => string): string {
    if (keyGenerator) {
      return keyGenerator(req)
    }

    // Default key generation: IP + User Agent + Path
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const path = req.nextUrl.pathname
    
    return `${ip}:${userAgent}:${path}`
  }

  check(req: NextRequest, rule: RateLimitRule): RateLimitStatus & { allowed: boolean } {
    const key = this.getKey(req, rule.keyGenerator)
    const now = Date.now()
    
    let entry = this.store.get(key)
    
    if (!entry || entry.resetTime <= now) {
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetTime: now + rule.windowMs,
        firstRequest: now
      }
      this.store.set(key, entry)
      
      return {
        allowed: true,
        remaining: rule.maxRequests - 1,
        reset: entry.resetTime,
        limit: rule.maxRequests
      }
    }

    // Check if limit exceeded
    if (entry.count >= rule.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        reset: entry.resetTime,
        limit: rule.maxRequests
      }
    }

    // Increment counter
    entry.count++
    
    return {
      allowed: true,
      remaining: rule.maxRequests - entry.count,
      reset: entry.resetTime,
      limit: rule.maxRequests
    }
  }

  reset(req: NextRequest, keyGenerator?: (req: NextRequest) => string): boolean {
    const key = this.getKey(req, keyGenerator)
    return this.store.delete(key)
  }

  getStats(): { totalKeys: number; memoryUsage: string } {
    const keys = this.store.size
    const memoryUsage = `${Math.round(JSON.stringify([...this.store]).length / 1024)}KB`
    
    return {
      totalKeys: keys,
      memoryUsage
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter()

// Pre-defined rate limiting rules for different AI operations
export const AI_RATE_LIMITS = {
  // Text generation limits
  textGeneration: {
    windowMs: 60 * 1000,    // 1 minute
    maxRequests: 10,        // 10 requests per minute
    message: 'Too many text generation requests. Please wait before trying again.'
  },
  
  // Image generation limits (more restrictive)
  imageGeneration: {
    windowMs: 60 * 1000,    // 1 minute
    maxRequests: 3,         // 3 requests per minute
    message: 'Too many image generation requests. Please wait before trying again.'
  },
  
  // Streaming limits
  streaming: {
    windowMs: 60 * 1000,    // 1 minute
    maxRequests: 5,         // 5 streams per minute
    message: 'Too many streaming requests. Please wait before trying again.'
  },
  
  // Chat completion limits
  chatCompletion: {
    windowMs: 60 * 1000,    // 1 minute
    maxRequests: 15,        // 15 chat requests per minute
    message: 'Too many chat requests. Please wait before trying again.'
  },
  
  // Health check limits
  healthCheck: {
    windowMs: 30 * 1000,    // 30 seconds
    maxRequests: 10,        // 10 health checks per 30 seconds
    message: 'Too many health check requests.'
  },
  
  // Per-user daily limits
  dailyLimit: {
    windowMs: 24 * 60 * 60 * 1000,  // 24 hours
    maxRequests: 100,               // 100 requests per day
    message: 'Daily request limit exceeded. Please try again tomorrow.',
    keyGenerator: (req: NextRequest) => {
      // Use user ID from auth header or IP as fallback
      const userId = req.headers.get('x-user-id') || 
                    req.headers.get('x-forwarded-for') || 
                    'anonymous'
      return `daily:${userId}`
    }
  }
} as const

/**
 * Rate limiting middleware factory
 */
export function createRateLimit(rule: RateLimitRule) {
  return async function rateLimitMiddleware(
    req: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const result = rateLimiter.check(req, rule)
    
    if (!result.allowed) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
      
      return NextResponse.json(
        {
          error: rule.message || 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': retryAfter.toString()
          }
        }
      )
    }

    // Add rate limit headers to successful responses
    const response = await next()
    
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.reset.toString())
    
    return response
  }
}

/**
 * Specific middleware functions for different AI operations
 */
export const textGenerationRateLimit = createRateLimit(AI_RATE_LIMITS.textGeneration)
export const imageGenerationRateLimit = createRateLimit(AI_RATE_LIMITS.imageGeneration)
export const streamingRateLimit = createRateLimit(AI_RATE_LIMITS.streaming)
export const chatCompletionRateLimit = createRateLimit(AI_RATE_LIMITS.chatCompletion)
export const healthCheckRateLimit = createRateLimit(AI_RATE_LIMITS.healthCheck)
export const dailyRateLimit = createRateLimit(AI_RATE_LIMITS.dailyLimit)

/**
 * Composite rate limiter that applies multiple rules
 */
export function createCompositeRateLimit(...rules: RateLimitRule[]) {
  return async function compositeRateLimitMiddleware(
    req: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Check all rules
    for (const rule of rules) {
      const result = rateLimiter.check(req, rule)
      
      if (!result.allowed) {
        const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
        
        return NextResponse.json(
          {
            error: rule.message || 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter,
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.reset.toString(),
              'Retry-After': retryAfter.toString()
            }
          }
        )
      }
    }

    return next()
  }
}

/**
 * Admin utilities for rate limit management
 */
export class RateLimitAdmin {
  static getRateLimiterStats() {
    return rateLimiter.getStats()
  }

  static resetUserLimits(req: NextRequest, keyGenerator?: (req: NextRequest) => string): boolean {
    return rateLimiter.reset(req, keyGenerator)
  }

  static destroyRateLimiter(): void {
    rateLimiter.destroy()
  }
}

/**
 * Utility function to apply rate limiting to API routes
 */
export function withRateLimit<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  rule: RateLimitRule
) {
  return async function rateLimitedHandler(req: NextRequest, ...args: any[]): Promise<NextResponse> {
    const result = rateLimiter.check(req, rule)
    
    if (!result.allowed) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
      
      return NextResponse.json(
        {
          error: rule.message || 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': retryAfter.toString()
          }
        }
      )
    }

    // Call the original handler
    const response = await handler(req, ...args)
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.reset.toString())
    
    return response
  }
}

// Export the global rate limiter for direct access if needed
export { rateLimiter }