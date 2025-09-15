// API response utilities and standardized error handling
import { NextResponse } from 'next/server'
import { ApiError, ApiResponse, ValidationError } from '@/types/database'

/**
 * Standard API response builder
 */
export class ApiResponseBuilder {
  /**
   * Create a successful response
   */
  static success<T>(
    data: T,
    message?: string,
    status: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      data,
      message
    }

    return new Response(JSON.stringify(response), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Create a paginated success response
   */
  static successWithPagination<T>(
    data: T[],
    meta: {
      total: number
      page: number
      limit: number
      has_more: boolean
    },
    message?: string
  ): Response {
    const response: ApiResponse<T[]> = {
      data,
      message,
      meta
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Create an error response
   */
  static error(
    error: ApiError,
    status: number = 500
  ): Response {
    const response: ApiResponse = {
      error: error.message,
      data: null
    }

    // Include error details for client debugging (remove in production)
    if (process.env.NODE_ENV === 'development' && error.details) {
      (response as any).error_details = error.details
    }

    return new Response(JSON.stringify(response), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Create a validation error response
   */
  static validationError(errors: ValidationError[]): Response {
    const response: ApiResponse = {
      error: 'Validation failed',
      data: null
    }

    // Include validation details
    if (process.env.NODE_ENV === 'development') {
      (response as any).validation_errors = errors
    }

    return new Response(JSON.stringify(response), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Create a not found response
   */
  static notFound(resource: string, id?: string): Response {
    const error: ApiError = {
      code: 'NOT_FOUND',
      message: `${resource} not found`,
      details: id ? { id } : undefined
    }

    return this.error(error, 404)
  }

  /**
   * Create an unauthorized response
   */
  static unauthorized(message: string = 'Authentication required'): Response {
    const error: ApiError = {
      code: 'AUTHENTICATION_ERROR',
      message
    }

    return this.error(error, 401)
  }

  /**
   * Create a forbidden response
   */
  static forbidden(message: string = 'Insufficient permissions'): Response {
    const error: ApiError = {
      code: 'AUTHORIZATION_ERROR',
      message
    }

    return this.error(error, 403)
  }

  /**
   * Create a conflict response
   */
  static conflict(message: string, details?: any): Response {
    const error: ApiError = {
      code: 'CONFLICT_ERROR',
      message,
      details
    }

    return this.error(error, 409)
  }

  /**
   * Create a rate limit exceeded response
   */
  static rateLimitExceeded(resetTime?: number): Response {
    const error: ApiError = {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded',
      details: resetTime ? { reset_time: resetTime } : undefined
    }

    const response = new Response(JSON.stringify({ error: error.message }), {
      status: 429,
      headers: { 
        'Content-Type': 'application/json',
        ...(resetTime && { 'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString() })
      }
    })

    return response
  }

  /**
   * Create an internal server error response
   */
  static internalError(message?: string): Response {
    const error: ApiError = {
      code: 'INTERNAL_ERROR',
      message: message || 'Internal server error'
    }

    return this.error(error, 500)
  }
}

/**
 * HTTP status code constants
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  RATE_LIMITED: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const

/**
 * Common error messages
 */
export const ErrorMessages = {
  AUTHENTICATION_REQUIRED: 'Authentication required',
  INVALID_CREDENTIALS: 'Invalid credentials',
  TOKEN_EXPIRED: 'Token expired',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  RESOURCE_NOT_FOUND: 'Resource not found',
  VALIDATION_FAILED: 'Validation failed',
  DUPLICATE_RESOURCE: 'Resource already exists',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable'
} as const

/**
 * Error logging utility
 */
export class ApiLogger {
  /**
   * Log API errors with context
   */
  static logError(error: any, context: {
    method: string
    url: string
    userId?: string
    requestId?: string
  }): void {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      method: context.method,
      url: context.url,
      userId: context.userId,
      requestId: context.requestId,
      error: {
        message: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }

    console.error('API Error:', JSON.stringify(logData, null, 2))

    // In production, you might want to send this to an external service
    // like Sentry, LogRocket, or CloudWatch
  }

  /**
   * Log successful API calls
   */
  static logSuccess(context: {
    method: string
    url: string
    userId?: string
    requestId?: string
    responseTime?: number
    status: number
  }): void {
    if (process.env.NODE_ENV === 'development') {
      const logData = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        method: context.method,
        url: context.url,
        userId: context.userId,
        requestId: context.requestId,
        responseTime: context.responseTime,
        status: context.status
      }

      console.log('API Success:', JSON.stringify(logData))
    }
  }
}

/**
 * Request validation helper
 */
export class RequestValidator {
  /**
   * Validate JSON body
   */
  static async validateJsonBody(request: Request): Promise<{
    valid: boolean
    data?: any
    error?: ValidationError
  }> {
    try {
      const data = await request.json()
      return { valid: true, data }
    } catch (error) {
      return {
        valid: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid JSON in request body',
          field: 'body',
          details: {
            expected: 'valid JSON',
            received: 'invalid JSON'
          }
        }
      }
    }
  }

  /**
   * Validate required fields
   */
  static validateRequiredFields(
    data: Record<string, any>,
    fields: Array<{ name: string; type: string }>
  ): ValidationError[] {
    const errors: ValidationError[] = []

    for (const field of fields) {
      const value = data[field.name]

      if (value === undefined || value === null) {
        errors.push({
          code: 'VALIDATION_ERROR',
          message: `${field.name} is required`,
          field: field.name,
          details: {
            expected: field.type,
            received: 'undefined'
          }
        })
        continue
      }

      // Type validation
      if (field.type === 'string' && typeof value !== 'string') {
        errors.push({
          code: 'VALIDATION_ERROR',
          message: `${field.name} must be a string`,
          field: field.name,
          details: {
            expected: 'string',
            received: typeof value
          }
        })
      } else if (field.type === 'number' && typeof value !== 'number') {
        errors.push({
          code: 'VALIDATION_ERROR',
          message: `${field.name} must be a number`,
          field: field.name,
          details: {
            expected: 'number',
            received: typeof value
          }
        })
      } else if (field.type === 'boolean' && typeof value !== 'boolean') {
        errors.push({
          code: 'VALIDATION_ERROR',
          message: `${field.name} must be a boolean`,
          field: field.name,
          details: {
            expected: 'boolean',
            received: typeof value
          }
        })
      } else if (field.type === 'array' && !Array.isArray(value)) {
        errors.push({
          code: 'VALIDATION_ERROR',
          message: `${field.name} must be an array`,
          field: field.name,
          details: {
            expected: 'array',
            received: typeof value
          }
        })
      }

      // String-specific validation
      if (field.type === 'string' && typeof value === 'string' && value.trim() === '') {
        errors.push({
          code: 'VALIDATION_ERROR',
          message: `${field.name} cannot be empty`,
          field: field.name,
          details: {
            expected: 'non-empty string',
            received: 'empty string'
          }
        })
      }
    }

    return errors
  }

  /**
   * Validate UUID parameter
   */
  static validateUUID(value: string, fieldName: string): ValidationError | null {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    
    if (!uuidRegex.test(value)) {
      return {
        code: 'VALIDATION_ERROR',
        message: `${fieldName} must be a valid UUID`,
        field: fieldName,
        details: {
          expected: 'valid UUID',
          received: value
        }
      }
    }

    return null
  }
}

/**
 * Performance monitoring utility
 */
export class ApiPerformanceMonitor {
  private startTime: number

  constructor() {
    this.startTime = Date.now()
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime
  }

  /**
   * Log performance metrics
   */
  logPerformance(context: {
    method: string
    url: string
    operation: string
  }): void {
    const elapsed = this.getElapsedTime()

    if (elapsed > 1000) { // Log slow requests (> 1 second)
      console.warn(`Slow API request detected:`, {
        method: context.method,
        url: context.url,
        operation: context.operation,
        elapsed: `${elapsed}ms`
      })
    }
  }
}

// Export commonly used utilities
export { ApiResponseBuilder as Response }
export { ApiLogger as Logger }
export { RequestValidator as Validator }
export { ApiPerformanceMonitor as PerformanceMonitor }