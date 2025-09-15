// Database query utilities and error handling patterns for SpectreWeave5
import { createClient } from '@/lib/supabase/server'
import {
  QueryFilter,
  QueryOptions,
  QueryResult,
  ApiError,
  ValidationError,
  NotFoundError
} from '@/types/database'

/**
 * Generic database query builder
 */
export class DatabaseQuery<T = any> {
  private supabase = createClient()
  private tableName: string
  private selectFields: string = '*'
  private whereConditions: QueryFilter[] = []
  private sortFields: { field: string; order: 'asc' | 'desc' }[] = []
  private limitValue?: number
  private offsetValue?: number

  constructor(tableName: string) {
    this.tableName = tableName
  }

  /**
   * Set select fields
   */
  select(fields: string): DatabaseQuery<T> {
    this.selectFields = fields
    return this
  }

  /**
   * Add where condition
   */
  where(field: string, operator: QueryFilter['operator'], value: any): DatabaseQuery<T> {
    this.whereConditions.push({ field, operator, value })
    return this
  }

  /**
   * Add equals condition (shorthand)
   */
  eq(field: string, value: any): DatabaseQuery<T> {
    return this.where(field, 'eq', value)
  }

  /**
   * Add not equals condition
   */
  neq(field: string, value: any): DatabaseQuery<T> {
    return this.where(field, 'neq', value)
  }

  /**
   * Add in condition
   */
  in(field: string, values: any[]): DatabaseQuery<T> {
    return this.where(field, 'in', values)
  }

  /**
   * Add like condition (case-sensitive)
   */
  like(field: string, pattern: string): DatabaseQuery<T> {
    return this.where(field, 'like', pattern)
  }

  /**
   * Add ilike condition (case-insensitive)
   */
  ilike(field: string, pattern: string): DatabaseQuery<T> {
    return this.where(field, 'ilike', pattern)
  }

  /**
   * Add greater than condition
   */
  gt(field: string, value: any): DatabaseQuery<T> {
    return this.where(field, 'gt', value)
  }

  /**
   * Add greater than or equal condition
   */
  gte(field: string, value: any): DatabaseQuery<T> {
    return this.where(field, 'gte', value)
  }

  /**
   * Add less than condition
   */
  lt(field: string, value: any): DatabaseQuery<T> {
    return this.where(field, 'lt', value)
  }

  /**
   * Add less than or equal condition
   */
  lte(field: string, value: any): DatabaseQuery<T> {
    return this.where(field, 'lte', value)
  }

  /**
   * Add order by
   */
  orderBy(field: string, order: 'asc' | 'desc' = 'asc'): DatabaseQuery<T> {
    this.sortFields.push({ field, order })
    return this
  }

  /**
   * Set limit
   */
  limit(count: number): DatabaseQuery<T> {
    this.limitValue = count
    return this
  }

  /**
   * Set offset
   */
  offset(count: number): DatabaseQuery<T> {
    this.offsetValue = count
    return this
  }

  /**
   * Execute the query and return results
   */
  async execute(options: { count?: boolean } = {}): Promise<QueryResult<T>> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select(this.selectFields, { count: options.count ? 'exact' : undefined })

      // Apply where conditions
      for (const condition of this.whereConditions) {
        switch (condition.operator) {
          case 'eq':
            query = query.eq(condition.field, condition.value)
            break
          case 'neq':
            query = query.neq(condition.field, condition.value)
            break
          case 'gt':
            query = query.gt(condition.field, condition.value)
            break
          case 'gte':
            query = query.gte(condition.field, condition.value)
            break
          case 'lt':
            query = query.lt(condition.field, condition.value)
            break
          case 'lte':
            query = query.lte(condition.field, condition.value)
            break
          case 'like':
            query = query.like(condition.field, condition.value)
            break
          case 'ilike':
            query = query.ilike(condition.field, condition.value)
            break
          case 'in':
            query = query.in(condition.field, condition.value)
            break
          case 'not_in':
            query = query.not(condition.field, 'in', condition.value)
            break
        }
      }

      // Apply sorting
      for (const sort of this.sortFields) {
        query = query.order(sort.field, { ascending: sort.order === 'asc' })
      }

      // Apply pagination
      if (this.limitValue !== undefined) {
        if (this.offsetValue !== undefined) {
          query = query.range(this.offsetValue, this.offsetValue + this.limitValue - 1)
        } else {
          query = query.limit(this.limitValue)
        }
      }

      const { data, error, count } = await query

      return {
        data: (data as T[]) || [],
        error,
        count: count || undefined
      }

    } catch (error) {
      return {
        data: [] as T[],
        error
      }
    }
  }

  /**
   * Execute and return first result
   */
  async single(): Promise<{ data: T | null; error: any }> {
    const result = await this.limit(1).execute()
    return {
      data: result.data[0] || null,
      error: result.error
    }
  }
}

/**
 * Create a new database query
 */
export function createQuery<T = any>(tableName: string): DatabaseQuery<T> {
  return new DatabaseQuery<T>(tableName)
}

/**
 * Database transaction helper
 */
export class DatabaseTransaction {
  private operations: (() => Promise<any>)[] = []
  private supabase = createClient()

  /**
   * Add an operation to the transaction
   */
  add(operation: () => Promise<any>): DatabaseTransaction {
    this.operations.push(operation)
    return this
  }

  /**
   * Execute all operations in sequence
   * Note: Supabase doesn't support true transactions yet, so this is a best-effort sequential execution
   */
  async execute(): Promise<{ success: boolean; results: any[]; error?: any }> {
    const results: any[] = []
    
    try {
      for (const operation of this.operations) {
        const result = await operation()
        if (result.error) {
          throw result.error
        }
        results.push(result.data)
      }

      return { success: true, results }
    } catch (error) {
      console.error('Transaction failed:', error)
      return { success: false, results, error }
    }
  }
}

/**
 * Create a new database transaction
 */
export function createTransaction(): DatabaseTransaction {
  return new DatabaseTransaction()
}

/**
 * Database error handler utility
 */
export class DatabaseErrorHandler {
  /**
   * Convert Supabase error to API error
   */
  static handleError(error: any, context?: string): ApiError {
    if (!error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred'
      }
    }

    // PostgreSQL error codes
    switch (error.code) {
      case '23505': // Unique violation
        return {
          code: 'DUPLICATE_ERROR',
          message: 'Resource already exists',
          details: { constraint: error.details }
        }

      case '23503': // Foreign key violation
        return {
          code: 'REFERENCE_ERROR',
          message: 'Referenced resource does not exist',
          details: { constraint: error.details }
        }

      case '23502': // Not null violation
        return {
          code: 'VALIDATION_ERROR',
          message: 'Required field is missing',
          details: { field: error.column }
        }

      case '23514': // Check constraint violation
        return {
          code: 'VALIDATION_ERROR',
          message: 'Value does not meet constraints',
          details: { constraint: error.details }
        }

      case 'PGRST116': // No rows returned (PostgREST)
        return {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          details: { context }
        }

      case 'PGRST301': // Request limit exceeded
        return {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Request limit exceeded'
        }

      default:
        console.error('Unhandled database error:', error)
        return {
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: { 
            original_code: error.code,
            original_message: error.message 
          }
        }
    }
  }

  /**
   * Check if error is a not found error
   */
  static isNotFound(error: any): boolean {
    return error?.code === 'PGRST116' || error?.code === 'NOT_FOUND'
  }

  /**
   * Check if error is a validation error
   */
  static isValidation(error: any): boolean {
    return ['23502', '23514', 'VALIDATION_ERROR'].includes(error?.code)
  }

  /**
   * Check if error is a duplicate error
   */
  static isDuplicate(error: any): boolean {
    return error?.code === '23505' || error?.code === 'DUPLICATE_ERROR'
  }
}

/**
 * Pagination helper
 */
export interface PaginationOptions {
  page: number
  limit: number
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export class PaginationHelper {
  /**
   * Apply pagination to a query
   */
  static applyPagination<T>(
    query: DatabaseQuery<T>,
    options: PaginationOptions
  ): DatabaseQuery<T> {
    const offset = (options.page - 1) * options.limit
    return query.offset(offset).limit(options.limit)
  }

  /**
   * Create pagination result
   */
  static createResult<T>(
    data: T[],
    total: number,
    options: PaginationOptions
  ): PaginationResult<T> {
    const pages = Math.ceil(total / options.limit)
    
    return {
      data,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages,
        hasNext: options.page < pages,
        hasPrev: options.page > 1
      }
    }
  }
}

/**
 * Common database validation utilities
 */
export class DatabaseValidator {
  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate string length
   */
  static isValidLength(value: string, min: number, max: number): boolean {
    return value.length >= min && value.length <= max
  }

  /**
   * Validate required fields
   */
  static validateRequired(data: Record<string, any>, fields: string[]): ValidationError[] {
    const errors: ValidationError[] = []

    for (const field of fields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        errors.push({
          code: 'VALIDATION_ERROR',
          message: `${field} is required`,
          field,
          details: {
            expected: 'non-empty value',
            received: data[field]
          }
        })
      }
    }

    return errors
  }
}

/**
 * Database connection health check
 */
export class DatabaseHealthCheck {
  private static supabase = createClient()

  /**
   * Check if database is accessible
   */
  static async isHealthy(): Promise<{ healthy: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('projects')
        .select('id')
        .limit(1)
        .single()

      // No error or "no rows" error means connection is healthy
      if (!error || error.code === 'PGRST116') {
        return { healthy: true }
      }

      return { healthy: false, error: error.message }
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get database metrics
   */
  static async getMetrics(): Promise<{
    tables: Record<string, number>
    error?: string
  }> {
    try {
      const tables = ['projects', 'chapters', 'characters', 'document_versions', 'user_profiles']
      const counts: Record<string, number> = {}

      for (const table of tables) {
        const { count, error } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (!error) {
          counts[table] = count || 0
        }
      }

      return { tables: counts }
    } catch (error) {
      return { 
        tables: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export commonly used utilities
export { DatabaseErrorHandler as ErrorHandler }
export { DatabaseValidator as Validator }
export { DatabaseHealthCheck as HealthCheck }