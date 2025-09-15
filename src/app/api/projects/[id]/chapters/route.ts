// Chapter management API routes - GET, POST /api/projects/[id]/chapters
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import {
  Chapter,
  CreateChapterRequest,
  ApiError,
  ValidationError,
  NotFoundError
} from '@/types/database'

/**
 * GET /api/projects/[id]/chapters
 * Get all chapters for a project
 */
async function getProjectChapters(
  authContext: any,
  request: NextRequest,
  permissions: string[],
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const projectId = params.id

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

    // Get chapters
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select(`
        id,
        project_id,
        title,
        description,
        content,
        order,
        word_count,
        status,
        created_at,
        updated_at
      `)
      .eq('project_id', projectId)
      .order('order', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      const apiError: ApiError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch chapters'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      data: {
        chapters: chapters || [],
        total: chapters?.length || 0
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Get chapters error:', error)
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
 * POST /api/projects/[id]/chapters
 * Create a new chapter
 */
async function createChapter(
  authContext: any,
  request: NextRequest,
  permissions: string[],
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const projectId = params.id
    const body: CreateChapterRequest = await request.json()

    // Validate required fields
    if (!body.title?.trim()) {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Chapter title is required',
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
    const { count: chapterCount } = await supabase
      .from('chapters')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)

    const userTier = authContext.user.profile?.subscription_tier || 'free'
    const chapterLimits = {
      free: 10,
      pro: 100,
      enterprise: 1000
    }

    if ((chapterCount || 0) >= chapterLimits[userTier]) {
      const apiError: ApiError = {
        code: 'LIMIT_EXCEEDED',
        message: `Chapter limit reached for ${userTier} tier`,
        details: {
          current_count: chapterCount,
          limit: chapterLimits[userTier],
          tier: userTier
        }
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get the next order number if not specified
    let orderNumber = body.order
    if (orderNumber === undefined) {
      const { data: lastChapter } = await supabase
        .from('chapters')
        .select('order')
        .eq('project_id', projectId)
        .order('order', { ascending: false })
        .limit(1)
        .single()

      orderNumber = (lastChapter?.order || 0) + 1
    }

    // Calculate word count for content
    const wordCount = body.content 
      ? body.content.trim().split(/\s+/).length 
      : 0

    // Create chapter
    const chapterData = {
      project_id: projectId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      content: body.content || null,
      order: orderNumber,
      word_count: wordCount,
      status: 'draft' as const
    }

    const { data: chapter, error } = await supabase
      .from('chapters')
      .insert(chapterData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)

      // Handle duplicate order within project
      if (error.code === '23505' && error.details?.includes('order')) {
        const validationError: ValidationError = {
          code: 'VALIDATION_ERROR',
          message: 'Chapter order must be unique within project',
          field: 'order',
          details: {
            expected: 'unique order number',
            received: orderNumber
          }
        }
        return new Response(JSON.stringify({ error: validationError }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const apiError: ApiError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to create chapter'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      data: chapter,
      message: 'Chapter created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Create chapter error:', error)

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
export const GET = createProtectedRoute(getProjectChapters, {
  projectPermission: 'read',
  rateLimit: { maxRequests: 200, windowMs: 60000 }
})

export const POST = createProtectedRoute(createChapter, {
  projectPermission: 'write',
  rateLimit: { maxRequests: 30, windowMs: 60000 }
})