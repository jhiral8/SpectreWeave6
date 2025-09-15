// Individual character API routes - GET, PATCH, DELETE /api/projects/[id]/characters/[charId]
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import {
  Character,
  UpdateCharacterRequest,
  ApiError,
  ValidationError,
  NotFoundError
} from '@/types/database'

/**
 * GET /api/projects/[id]/characters/[charId]
 * Get specific character details
 */
async function getCharacter(
  authContext: any,
  request: NextRequest,
  permissions: string[],
  { params }: { params: { id: string; charId: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const projectId = params.id
    const charId = params.charId

    const { data: character, error } = await supabase
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
      .eq('id', charId)
      .eq('project_id', projectId)
      .single()

    if (error || !character) {
      const notFoundError: NotFoundError = {
        code: 'NOT_FOUND',
        message: 'Character not found',
        details: {
          resource: 'character',
          id: charId
        }
      }
      return new Response(JSON.stringify({ error: notFoundError }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get related notes if any
    const { data: notes } = await supabase
      .from('notes')
      .select(`
        id,
        title,
        content,
        category,
        is_pinned,
        created_at,
        updated_at
      `)
      .eq('character_id', charId)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })

    return new Response(JSON.stringify({
      data: {
        ...character,
        notes: notes || []
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Get character error:', error)
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
 * PATCH /api/projects/[id]/characters/[charId]
 * Update character
 */
async function updateCharacter(
  authContext: any,
  request: NextRequest,
  permissions: string[],
  { params }: { params: { id: string; charId: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const projectId = params.id
    const charId = params.charId
    const body: UpdateCharacterRequest = await request.json()

    // Validate name if provided
    if (body.name !== undefined && !body.name?.trim()) {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Character name cannot be empty',
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

    // Validate role if provided
    if (body.role && !['protagonist', 'antagonist', 'supporting', 'minor'].includes(body.role)) {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid character role',
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

    // Build update data
    const updateData: Partial<Character> = {}

    if (body.name !== undefined) {
      updateData.name = body.name.trim()
    }
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null
    }
    if (body.role !== undefined) {
      updateData.role = body.role
    }
    if (body.appearance !== undefined) {
      updateData.appearance = body.appearance?.trim() || null
    }
    if (body.personality !== undefined) {
      updateData.personality = body.personality?.trim() || null
    }
    if (body.backstory !== undefined) {
      updateData.backstory = body.backstory?.trim() || null
    }
    if (body.relationships !== undefined) {
      updateData.relationships = body.relationships
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes?.trim() || null
    }

    // Update character
    const { data: character, error } = await supabase
      .from('characters')
      .update(updateData)
      .eq('id', charId)
      .eq('project_id', projectId)
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

      if (error.code === 'PGRST116') {
        const notFoundError: NotFoundError = {
          code: 'NOT_FOUND',
          message: 'Character not found',
          details: {
            resource: 'character',
            id: charId
          }
        }
        return new Response(JSON.stringify({ error: notFoundError }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const apiError: ApiError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to update character'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      data: character,
      message: 'Character updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Update character error:', error)

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

/**
 * DELETE /api/projects/[id]/characters/[charId]
 * Delete character
 */
async function deleteCharacter(
  authContext: any,
  request: NextRequest,
  permissions: string[],
  { params }: { params: { id: string; charId: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const projectId = params.id
    const charId = params.charId

    // Get character details before deletion for response
    const { data: character, error: getError } = await supabase
      .from('characters')
      .select('name, role')
      .eq('id', charId)
      .eq('project_id', projectId)
      .single()

    if (getError || !character) {
      const notFoundError: NotFoundError = {
        code: 'NOT_FOUND',
        message: 'Character not found',
        details: {
          resource: 'character',
          id: charId
        }
      }
      return new Response(JSON.stringify({ error: notFoundError }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Delete related notes first
    await supabase
      .from('notes')
      .delete()
      .eq('character_id', charId)

    // Delete the character
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', charId)
      .eq('project_id', projectId)

    if (error) {
      console.error('Database error:', error)
      const apiError: ApiError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to delete character'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      message: 'Character deleted successfully',
      deleted_character: {
        name: character.name,
        role: character.role
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Delete character error:', error)
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
export const GET = createProtectedRoute(getCharacter, {
  projectPermission: 'read',
  rateLimit: { maxRequests: 200, windowMs: 60000 }
})

export const PATCH = createProtectedRoute(updateCharacter, {
  projectPermission: 'write',
  rateLimit: { maxRequests: 50, windowMs: 60000 }
})

export const DELETE = createProtectedRoute(deleteCharacter, {
  projectPermission: 'write',
  rateLimit: { maxRequests: 20, windowMs: 60000 }
})