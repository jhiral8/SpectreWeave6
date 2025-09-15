// Individual chapter API routes - GET, PATCH, DELETE /api/projects/[id]/chapters/[chapterId]
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import {
  Chapter,
  UpdateChapterRequest,
  ApiError,
  ValidationError,
  NotFoundError
} from '@/types/database'

/**
 * GET /api/projects/[id]/chapters/[chapterId]
 * Get specific chapter details
 */
async function getChapter(
  authContext: any,
  request: NextRequest,
  permissions: string[],
  { params }: { params: { id: string; chapterId: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const projectId = params.id
    const chapterId = params.chapterId

    const { data: chapter, error } = await supabase
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
      .eq('id', chapterId)
      .eq('project_id', projectId)
      .single()

    if (error || !chapter) {
      const notFoundError: NotFoundError = {
        code: 'NOT_FOUND',
        message: 'Chapter not found',
        details: {
          resource: 'chapter',
          id: chapterId
        }
      }
      return new Response(JSON.stringify({ error: notFoundError }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      data: chapter
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Get chapter error:', error)
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
 * PATCH /api/projects/[id]/chapters/[chapterId]
 * Update chapter
 */
async function updateChapter(
  authContext: any,
  request: NextRequest,
  permissions: string[],
  { params }: { params: { id: string; chapterId: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const projectId = params.id
    const chapterId = params.chapterId
    const body: UpdateChapterRequest = await request.json()

    // Validate title if provided
    if (body.title !== undefined && !body.title?.trim()) {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Chapter title cannot be empty',
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
    if (body.status && !['draft', 'in_progress', 'completed'].includes(body.status)) {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid chapter status',
        field: 'status',
        details: {
          expected: 'draft, in_progress, or completed',
          received: body.status
        }
      }
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Build update data
    const updateData: Partial<Chapter> = {}

    if (body.title !== undefined) {
      updateData.title = body.title.trim()
    }
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null
    }
    if (body.content !== undefined) {
      updateData.content = body.content || null
      // Recalculate word count if content is updated
      updateData.word_count = body.content 
        ? body.content.trim().split(/\s+/).length 
        : 0
    }
    if (body.order !== undefined) {
      updateData.order = body.order
    }
    if (body.status !== undefined) {
      updateData.status = body.status
    }

    // Update chapter
    const { data: chapter, error } = await supabase
      .from('chapters')
      .update(updateData)
      .eq('id', chapterId)
      .eq('project_id', projectId)
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
            received: body.order
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
          message: 'Chapter not found',
          details: {
            resource: 'chapter',
            id: chapterId
          }
        }
        return new Response(JSON.stringify({ error: notFoundError }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const apiError: ApiError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to update chapter'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      data: chapter,
      message: 'Chapter updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Update chapter error:', error)

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
 * DELETE /api/projects/[id]/chapters/[chapterId]
 * Delete chapter
 */
async function deleteChapter(
  authContext: any,
  request: NextRequest,
  permissions: string[],
  { params }: { params: { id: string; chapterId: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const projectId = params.id
    const chapterId = params.chapterId

    // Get chapter details before deletion for response
    const { data: chapter, error: getError } = await supabase
      .from('chapters')
      .select('title, order')
      .eq('id', chapterId)
      .eq('project_id', projectId)
      .single()

    if (getError || !chapter) {
      const notFoundError: NotFoundError = {
        code: 'NOT_FOUND',
        message: 'Chapter not found',
        details: {
          resource: 'chapter',
          id: chapterId
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
      .eq('chapter_id', chapterId)

    // Delete the chapter
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapterId)
      .eq('project_id', projectId)

    if (error) {
      console.error('Database error:', error)
      const apiError: ApiError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to delete chapter'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Reorder remaining chapters to fill the gap
    const { data: remainingChapters } = await supabase
      .from('chapters')
      .select('id, order')
      .eq('project_id', projectId)
      .gt('order', chapter.order)
      .order('order', { ascending: true })

    if (remainingChapters && remainingChapters.length > 0) {
      const updates = remainingChapters.map((ch, index) => ({
        id: ch.id,
        order: chapter.order + index
      }))

      for (const update of updates) {
        await supabase
          .from('chapters')
          .update({ order: update.order })
          .eq('id', update.id)
      }
    }

    return new Response(JSON.stringify({
      message: 'Chapter deleted successfully',
      deleted_chapter: {
        title: chapter.title,
        order: chapter.order
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Delete chapter error:', error)
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
export const GET = createProtectedRoute(getChapter, {
  projectPermission: 'read',
  rateLimit: { maxRequests: 200, windowMs: 60000 }
})

export const PATCH = createProtectedRoute(updateChapter, {
  projectPermission: 'write',
  rateLimit: { maxRequests: 50, windowMs: 60000 }
})

export const DELETE = createProtectedRoute(deleteChapter, {
  projectPermission: 'write',
  rateLimit: { maxRequests: 20, windowMs: 60000 }
})