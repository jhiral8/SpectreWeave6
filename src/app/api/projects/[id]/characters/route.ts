// Character management API routes - GET, POST /api/projects/[id]/characters
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import {
  Character,
  CreateCharacterRequest,
  ApiError,
  ValidationError,
  NotFoundError
} from '@/types/database'

/**
 * GET /api/projects/[id]/characters
 * Get all characters for a project
 */
async function getProjectCharacters(
  authContext: any,
  request: NextRequest,
  permissions: string[],
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const projectId = params.id
    const url = new URL(request.url)
    const searchParams = url.searchParams

    // Parse query parameters
    const role = searchParams.get('role') as Character['role'] | null
    const search = searchParams.get('search')

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      const notFoundError: NotFoundError = {
        code: 'NOT_FOUND',
        message: 'Project not found',
        details: {
          resource: 'project',
          id: projectId
        }
      }
      return new Response(JSON.stringify({ error: notFoundError }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Build query
    let query = supabase
      .from('characters')
      .select(`
        id,
        project_id,
        name,
        description,
        role,
        appearance,
        personality,
        backstory,
        relationships,
        notes,
        avatar_url,
        created_at,
        updated_at
      `)
      .eq('project_id', projectId)

    // Apply filters
    if (role && ['protagonist', 'antagonist', 'supporting', 'minor'].includes(role)) {
      query = query.eq('role', role)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Order by role importance, then by name
    query = query.order('role', { ascending: true }).order('name', { ascending: true })

    const { data: characters, error } = await query

    if (error) {
      console.error('Database error:', error)
      const apiError: ApiError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch characters'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Group by role for better organization
    const charactersByRole = {
      protagonist: characters?.filter(c => c.role === 'protagonist') || [],
      antagonist: characters?.filter(c => c.role === 'antagonist') || [],
      supporting: characters?.filter(c => c.role === 'supporting') || [],
      minor: characters?.filter(c => c.role === 'minor') || []
    }

    return new Response(JSON.stringify({
      data: {
        characters: characters || [],
        characters_by_role: charactersByRole,
        total: characters?.length || 0
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Get characters error:', error)
    const apiError: ApiError = {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
    return new Response(JSON.stringify({ error: apiError }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * POST /api/projects/[id]/characters
 * Create a new character
 */
async function createCharacter(
  authContext: any,
  request: NextRequest,
  permissions: string[],
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const projectId = params.id
    const body: CreateCharacterRequest = await request.json()

    // Validate required fields
    if (!body.name?.trim()) {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Character name is required',
        field: 'name',
        details: {
          expected: 'non-empty string',
          received: body.name
        }
      }
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate role
    if (!body.role || !['protagonist', 'antagonist', 'supporting', 'minor'].includes(body.role)) {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Valid character role is required',
        field: 'role',
        details: {
          expected: 'protagonist, antagonist, supporting, or minor',
          received: body.role
        }
      }
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      const notFoundError: NotFoundError = {
        code: 'NOT_FOUND',
        message: 'Project not found',
        details: {
          resource: 'project',
          id: projectId
        }
      }
      return new Response(JSON.stringify({ error: notFoundError }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check subscription limits
    const { count: characterCount } = await supabase
      .from('characters')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)

    const userTier = authContext.user.profile?.subscription_tier || 'free'
    const characterLimits = {
      free: 20,
      pro: 200,
      enterprise: 2000
    }

    if ((characterCount || 0) >= characterLimits[userTier]) {
      const apiError: ApiError = {
        code: 'LIMIT_EXCEEDED',
        message: `Character limit reached for ${userTier} tier`,
        details: {
          current_count: characterCount,
          limit: characterLimits[userTier],
          tier: userTier
        }
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create character
    const characterData = {
      project_id: projectId,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      role: body.role,
      appearance: body.appearance?.trim() || null,
      personality: body.personality?.trim() || null,
      backstory: body.backstory?.trim() || null,
      relationships: body.relationships || null,
      notes: body.notes?.trim() || null
    }

    const { data: character, error } = await supabase
      .from('characters')
      .insert(characterData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)

      // Handle duplicate name within project
      if (error.code === '23505' && error.details?.includes('name')) {
        const validationError: ValidationError = {
          code: 'VALIDATION_ERROR',
          message: 'A character with this name already exists in the project',
          field: 'name',
          details: {
            expected: 'unique character name',
            received: body.name
          }
        }
        return new Response(JSON.stringify({ error: validationError }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const apiError: ApiError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to create character'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      data: character,
      message: 'Character created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Create character error:', error)

    if (error instanceof SyntaxError) {
      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid JSON in request body',
        field: 'body',
        details: {
          expected: 'valid JSON',
          received: 'invalid JSON'
        }
      }
      return new Response(JSON.stringify({ error: validationError }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const apiError: ApiError = {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
    return new Response(JSON.stringify({ error: apiError }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Export route handlers
export const GET = createProtectedRoute(getProjectCharacters, {
  projectPermission: 'read',
  rateLimit: { maxRequests: 200, windowMs: 60000 }
})

export const POST = createProtectedRoute(createCharacter, {
  projectPermission: 'write',
  rateLimit: { maxRequests: 30, windowMs: 60000 }
})