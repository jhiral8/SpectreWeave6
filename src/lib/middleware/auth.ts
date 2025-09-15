// Authentication and authorization middleware for API routes
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  AuthContext, 
  AuthenticatedUser, 
  AuthenticationError, 
  AuthorizationError,
  ApiError,
  ProjectMember,
  UserProfile
} from '@/types/database'

/**
 * Extract user from request using Supabase auth
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Fetch user profile if available (handle table not existing gracefully)
    let profile = undefined
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      // Ignore relation not found errors (table doesn't exist)
      if (!profileError || profileError.code !== '42P01') {
        profile = profileData || undefined
      }
    } catch (error) {
      // Ignore profile fetch errors - user can still be authenticated without profile
      console.log('Profile fetch failed (table may not exist):', error)
    }

    return {
      ...user,
      profile
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

/**
 * Get user permissions for a specific project
 */
export async function getUserProjectPermissions(
  userId: string, 
  projectId: string
): Promise<string[]> {
  try {
    const supabase = createClient()
    
    // Check if user owns the project
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single()

    if (project?.user_id === userId) {
      return ['read', 'write', 'delete', 'admin']
    }

    // Check project membership
    const { data: membership } = await supabase
      .from('project_members')
      .select('role, permissions, status')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return []
    }

    // Map role to permissions
    const rolePermissions: Record<string, string[]> = {
      owner: ['read', 'write', 'delete', 'admin'],
      editor: ['read', 'write'],
      viewer: ['read'],
      commenter: ['read', 'comment']
    }

    const basePermissions = rolePermissions[membership.role] || []
    const customPermissions = Array.isArray(membership.permissions) 
      ? membership.permissions 
      : []

    return [...new Set([...basePermissions, ...customPermissions])]
  } catch (error) {
    console.error('Permission check error:', error)
    return []
  }
}

/**
 * Create auth context for request
 */
export async function createAuthContext(request?: NextRequest): Promise<AuthContext> {
  const user = await getAuthenticatedUser(request)
  
  if (!user) {
    return {
      user: {} as AuthenticatedUser,
      permissions: [],
      isAuthenticated: false
    }
  }

  return {
    user,
    permissions: [], // Global permissions, project-specific ones checked separately
    isAuthenticated: true
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  handler: (context: AuthContext, request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const authContext = await createAuthContext(request)
      
      if (!authContext.isAuthenticated) {
        const error: AuthenticationError = {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required'
        }
        return new Response(JSON.stringify({ error }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return handler(authContext, request)
    } catch (error) {
      console.error('Auth middleware error:', error)
      const apiError: ApiError = {
        code: 'INTERNAL_ERROR',
        message: 'Authentication service unavailable'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

/**
 * Middleware to check project access permissions
 */
export async function requireProjectAccess(
  requiredPermission: string | string[],
  handler: (context: AuthContext, request: NextRequest, permissions: string[], context?: any) => Promise<Response>
) {
  return async (request: NextRequest, context?: { params: { id: string } }): Promise<Response> => {
    try {
      const authContext = await createAuthContext(request)
      
      if (!authContext.isAuthenticated) {
        const error: AuthenticationError = {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required'
        }
        return new Response(JSON.stringify({ error }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const projectId = context?.params?.id || ''
      const permissions = await getUserProjectPermissions(authContext.user.id, projectId)
      
      const requiredPermissions = Array.isArray(requiredPermission) 
        ? requiredPermission 
        : [requiredPermission]

      const hasRequiredPermission = requiredPermissions.some(perm => 
        permissions.includes(perm)
      )

      if (!hasRequiredPermission) {
        const error: AuthorizationError = {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions',
          details: {
            required_permission: requiredPermissions.join(' or '),
            user_permissions: permissions
          }
        }
        return new Response(JSON.stringify({ error }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return handler(authContext, request, permissions, context)
    } catch (error) {
      console.error('Project access middleware error:', error)
      const apiError: ApiError = {
        code: 'INTERNAL_ERROR',
        message: 'Authorization service unavailable'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

/**
 * Middleware for subscription tier checks
 */
export async function requireSubscriptionTier(
  minTier: 'free' | 'pro' | 'enterprise',
  handler: (context: AuthContext, request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const authContext = await createAuthContext(request)
      
      if (!authContext.isAuthenticated) {
        const error: AuthenticationError = {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required'
        }
        return new Response(JSON.stringify({ error }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const userTier = authContext.user.profile?.subscription_tier || 'free'
      const tierLevels = { free: 0, pro: 1, enterprise: 2 }
      
      if (tierLevels[userTier] < tierLevels[minTier]) {
        const error: AuthorizationError = {
          code: 'AUTHORIZATION_ERROR',
          message: 'Upgrade required',
          details: {
            required_permission: `${minTier} subscription or higher`,
            user_permissions: [`${userTier} subscription`]
          }
        }
        return new Response(JSON.stringify({ error }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return handler(authContext, request)
    } catch (error) {
      console.error('Subscription middleware error:', error)
      const apiError: ApiError = {
        code: 'INTERNAL_ERROR',
        message: 'Subscription service unavailable'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

/**
 * Rate limiting middleware (basic implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export async function rateLimit(
  maxRequests: number,
  windowMs: number,
  handler: (context: AuthContext, request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const authContext = await createAuthContext(request)
      const identifier = authContext.isAuthenticated ? authContext.user.id : 'anonymous'
      const now = Date.now()
      
      const userLimit = rateLimitMap.get(identifier)
      
      if (!userLimit || now > userLimit.resetTime) {
        rateLimitMap.set(identifier, {
          count: 1,
          resetTime: now + windowMs
        })
        return handler(authContext, request)
      }
      
      if (userLimit.count >= maxRequests) {
        const error: ApiError = {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          details: {
            limit: maxRequests,
            window_ms: windowMs,
            reset_time: new Date(userLimit.resetTime).toISOString()
          }
        }
        return new Response(JSON.stringify({ error }), {
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, maxRequests - userLimit.count - 1).toString(),
            'X-RateLimit-Reset': Math.ceil(userLimit.resetTime / 1000).toString()
          }
        })
      }
      
      userLimit.count++
      return handler(authContext, request)
    } catch (error) {
      console.error('Rate limit middleware error:', error)
      const apiError: ApiError = {
        code: 'INTERNAL_ERROR',
        message: 'Rate limiting service unavailable'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware(
  ...middlewares: Array<(handler: any) => any>
) {
  return (handler: any) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

/**
 * Utility to create protected route with common middleware
 */
export function createProtectedRoute(
  handler: (context: AuthContext, request: NextRequest, permissions?: string[], routeContext?: any) => Promise<Response>,
  options: {
    requireAuth?: boolean
    projectPermission?: string | string[]
    subscriptionTier?: 'free' | 'pro' | 'enterprise'
    rateLimit?: { maxRequests: number; windowMs: number }
  } = {}
) {
  // Return a Next.js 14 compatible route handler
  return async (request: NextRequest, routeContext?: { params: { id: string } }): Promise<Response> => {
    try {
      const authContext = await createAuthContext(request)
      
      // Check authentication if required (default: true)
      if (options.requireAuth !== false && !authContext.isAuthenticated) {
        const error: AuthenticationError = {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required'
        }
        return new Response(JSON.stringify({ error }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      let permissions: string[] = []
      
      // Check project permissions if specified
      if (options.projectPermission && routeContext?.params?.id) {
        const projectId = routeContext.params.id
        permissions = await getUserProjectPermissions(authContext.user.id, projectId)
        
        const requiredPermissions = Array.isArray(options.projectPermission) 
          ? options.projectPermission 
          : [options.projectPermission]

        const hasRequiredPermission = requiredPermissions.some(perm => 
          permissions.includes(perm)
        )

        if (!hasRequiredPermission) {
          const error: AuthorizationError = {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions',
            details: {
              required_permission: requiredPermissions.join(' or '),
              user_permissions: permissions
            }
          }
          return new Response(JSON.stringify({ error }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }

      // Check subscription tier if specified
      if (options.subscriptionTier) {
        const userTier = authContext.user.profile?.subscription_tier || 'free'
        const tierLevels = { free: 0, pro: 1, enterprise: 2 }
        
        if (tierLevels[userTier] < tierLevels[options.subscriptionTier]) {
          const error: AuthorizationError = {
            code: 'AUTHORIZATION_ERROR',
            message: 'Upgrade required',
            details: {
              required_permission: `${options.subscriptionTier} subscription or higher`,
              user_permissions: [`${userTier} subscription`]
            }
          }
          return new Response(JSON.stringify({ error }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }

      // Rate limiting check
      if (options.rateLimit) {
        const identifier = authContext.isAuthenticated ? authContext.user.id : 'anonymous'
        const now = Date.now()
        
        const userLimit = rateLimitMap.get(identifier)
        
        if (!userLimit || now > userLimit.resetTime) {
          rateLimitMap.set(identifier, {
            count: 1,
            resetTime: now + options.rateLimit.windowMs
          })
        } else if (userLimit.count >= options.rateLimit.maxRequests) {
          const error: ApiError = {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
            details: {
              limit: options.rateLimit.maxRequests,
              window_ms: options.rateLimit.windowMs,
              reset_time: new Date(userLimit.resetTime).toISOString()
            }
          }
          return new Response(JSON.stringify({ error }), {
            status: 429,
            headers: { 
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': options.rateLimit.maxRequests.toString(),
              'X-RateLimit-Remaining': Math.max(0, options.rateLimit.maxRequests - userLimit.count - 1).toString(),
              'X-RateLimit-Reset': Math.ceil(userLimit.resetTime / 1000).toString()
            }
          })
        } else {
          userLimit.count++
        }
      }
      
      return handler(authContext, request, permissions, routeContext)
    } catch (error) {
      console.error('Middleware error:', error)
      const apiError: ApiError = {
        code: 'INTERNAL_ERROR',
        message: 'Middleware service unavailable'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}