// Individual project API routes - GET, PATCH, DELETE /api/projects/[id]
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import {
  Project,
  UpdateProjectRequest,
  ProjectDetailResponse,
  ApiError,
  ValidationError,
  NotFoundError
} from '@/types/database'

/**
 * GET /api/projects/[id]
 * Get specific project with full details
 */
async function getProject(
  authContext: any, 
  request: NextRequest, 
  permissions?: string[],
  routeContext?: { params: { id: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const projectId = routeContext?.params?.id || ''

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        description,
        genre,
        brief,
        content,
        word_count,
        status,
        order,
        archived,
        created_at,
        updated_at,
        user_id
      `)
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      // Handle database table not found
      if (projectError?.code === '42P01') {
        const error: ApiError = {
          code: 'DATABASE_ERROR',
          message: 'Database tables not initialized. Please run migrations.'
        }
        return new Response(JSON.stringify({ error }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      const error: NotFoundError = {
        code: 'NOT_FOUND',
        message: 'Project not found',
        details: {
          resource: 'project',
          id: projectId
        }
      }
      return new Response(JSON.stringify({ error }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get chapters
    const { data: chapters } = await supabase
      .from('chapters')
      .select(`
        id,
        title,
        description,
        order,
        word_count,
        status,
        created_at,
        updated_at
      `)
      .eq('project_id', projectId)
      .order('order', { ascending: true })

    // Get characters
    const { data: characters } = await supabase
      .from('characters')
      .select(`
        id,
        name,
        description,
        role,
        appearance,
        personality,
        backstory,
        notes,
        avatar_url,
        created_at,
        updated_at
      `)
      .eq('project_id', projectId)
      .order('name', { ascending: true })

    // Get recent versions (last 10)
    const { data: recentVersions } = await supabase
      .from('document_versions')
      .select(`
        id,
        version_number,
        summary,
        word_count,
        created_at,
        created_by,
        is_milestone
      `)
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(10)

    // Get project members if user has admin permissions
    let members = undefined
    if (permissions?.includes('admin')) {
      const { data: projectMembers } = await supabase
        .from('project_members')
        .select(`
          id,
          user_id,
          role,
          permissions,
          invited_at,
          joined_at,
          status,
          user_profiles!inner(
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .eq('status', 'active')

      members = projectMembers
    }

    const response: ProjectDetailResponse = {
      ...project,
      chapters: chapters || [],
      characters: characters || [],
      recent_versions: recentVersions || [],
      members,
      chapter_count: chapters?.length || 0,
      character_count: characters?.length || 0,
      last_edited: project.updated_at
    }

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Get project error:', error)
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
 * PATCH /api/projects/[id]
 * Update project metadata
 */
async function updateProject(
  authContext: any,
  request: NextRequest,
  permissions?: string[],
  routeContext?: { params: { id: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const projectId = routeContext?.params?.id || ''
    const body: UpdateProjectRequest = await request.json()

    // Validate title if provided
    if (body.title !== undefined && !body.title?.trim()) {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Project title cannot be empty',
        field: 'title',
        details: {
          expected: 'non-empty string',
          received: body.title
        }
      }
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate status if provided
    if (body.status && !['draft', 'in_progress', 'review', 'completed', 'archived'].includes(body.status)) {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid project status',
        field: 'status',
        details: {
          expected: 'draft, in_progress, review, completed, or archived',
          received: body.status
        }
      }
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Build update data
    const updateData: Partial<Project> = {}
    
    if (body.title !== undefined) {
      updateData.title = body.title.trim()
    }
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null
    }
    if (body.genre !== undefined) {
      updateData.genre = body.genre?.trim() || null
    }
    if (body.brief !== undefined) {
      updateData.brief = body.brief?.trim() || null
    }
    if (body.status !== undefined) {
      updateData.status = body.status
    }
    if (body.archived !== undefined) {
      updateData.archived = body.archived
    }

    // Update project
    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)

      // Handle database table not found
      if (error.code === '42P01') {
        const apiError: ApiError = {
          code: 'DATABASE_ERROR',
          message: 'Database tables not initialized. Please run migrations.'
        }
        return new Response(JSON.stringify({ error: apiError }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Handle duplicate title error
      if (error.code === '23505' && error.details?.includes('title')) {
        const validationError: ValidationError = {
          code: 'VALIDATION_ERROR',
          message: 'A project with this title already exists',
          field: 'title',
          details: {
            expected: 'unique title',
            received: body.title
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

      const apiError: ApiError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to update project'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ 
      data: project,
      message: 'Project updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Update project error:', error)
    
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
 * DELETE /api/projects/[id]
 * Delete/archive project
 */
async function deleteProject(
  authContext: any,
  request: NextRequest,
  permissions?: string[],
  routeContext?: { params: { id: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const projectId = routeContext?.params?.id || ''
    const url = new URL(request.url)
    const permanent = url.searchParams.get('permanent') === 'true'

    if (permanent) {
      // Permanent deletion - requires admin permission
      if (!permissions?.includes('admin')) {
        const authError: ApiError = {
          code: 'AUTHORIZATION_ERROR',
          message: 'Admin permission required for permanent deletion'
        }
        return new Response(JSON.stringify({ error: authError }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Delete related records first (cascade should handle this, but being explicit)
      await Promise.all([
        supabase.from('document_versions').delete().eq('project_id', projectId),
        supabase.from('chapters').delete().eq('project_id', projectId),
        supabase.from('characters').delete().eq('project_id', projectId),
        supabase.from('research').delete().eq('project_id', projectId),
        supabase.from('notes').delete().eq('project_id', projectId),
        supabase.from('project_members').delete().eq('project_id', projectId)
      ])

      // Delete project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) {
        console.error('Database error:', error)
        
        // Handle database table not found
        if (error.code === '42P01') {
          const apiError: ApiError = {
            code: 'DATABASE_ERROR',
            message: 'Database tables not initialized. Please run migrations.'
          }
          return new Response(JSON.stringify({ error: apiError }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          })
        }
        
        const apiError: ApiError = {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete project'
        }
        return new Response(JSON.stringify({ error: apiError }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ 
        message: 'Project permanently deleted'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
      
    } else {
      // Soft delete - archive the project
      const { data: project, error } = await supabase
        .from('projects')
        .update({ 
          archived: true,
          status: 'archived'
        })
        .eq('id', projectId)
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        
        if (error.code === 'PGRST116') {
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

        const apiError: ApiError = {
          code: 'DATABASE_ERROR',
          message: 'Failed to archive project'
        }
        return new Response(JSON.stringify({ error: apiError }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ 
        data: project,
        message: 'Project archived successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Delete project error:', error)
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

// Export route handlers with proper permissions
export const GET = createProtectedRoute(getProject, {
  projectPermission: 'read',
  rateLimit: { maxRequests: 200, windowMs: 60000 }
})

export const PATCH = createProtectedRoute(updateProject, {
  projectPermission: 'write',
  rateLimit: { maxRequests: 30, windowMs: 60000 }
})

export const DELETE = createProtectedRoute(deleteProject, {
  projectPermission: ['write', 'admin'], // Either permission works
  rateLimit: { maxRequests: 10, windowMs: 60000 }
})