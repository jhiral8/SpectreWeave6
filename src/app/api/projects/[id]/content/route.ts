// Content management API routes - GET, PUT /api/projects/[id]/content
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import {
  ProjectContentRequest,
  ApiError,
  ValidationError,
  NotFoundError
} from '@/types/database'

/**
 * GET /api/projects/[id]/content
 * Get current document content
 */
async function getProjectContent(
  authContext: any,
  request: NextRequest,
  permissions?: string[],
  routeContext?: { params: { id: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const projectId = routeContext?.params?.id || ''

    const { data: project, error } = await supabase
      .from('projects')
      .select('content, word_count, updated_at')
      .eq('id', projectId)
      .single()

    if (error || !project) {
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

    return new Response(JSON.stringify({
      data: {
        content: project.content || '',
        word_count: project.word_count,
        last_modified: project.updated_at
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Get project content error:', error)
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
 * PUT /api/projects/[id]/content
 * Save document content with optional versioning
 */
async function saveProjectContent(
  authContext: any,
  request: NextRequest,
  permissions?: string[],
  routeContext?: { params: { id: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const projectId = routeContext?.params?.id || ''
    const body: ProjectContentRequest = await request.json()

    // Validate content
    if (typeof body.content !== 'string') {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Content must be a string',
        field: 'content',
        details: {
          expected: 'string',
          received: typeof body.content
        }
      }
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Calculate word count
    const wordCount = body.content.trim() 
      ? body.content.trim().split(/\s+/).length 
      : 0

    // Get current project to check if it exists
    const { data: currentProject, error: projectError } = await supabase
      .from('projects')
      .select('content, word_count')
      .eq('id', projectId)
      .single()

    if (projectError || !currentProject) {
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

    // Create version if requested or if content significantly changed
    let versionCreated = false
    let nextVersionNumber = 10 // Default v0.1.0
    
    if (body.create_version || shouldCreateVersion(currentProject.content, body.content)) {
      try {
        // Get next version number
        const { data: lastVersion, error: versionQueryError } = await supabase
          .from('document_versions')
          .select('version_number')
          .eq('project_id', projectId)
          .order('version_number', { ascending: false })
          .limit(1)
          .single()

        // Handle case where document_versions table doesn't exist
        if (versionQueryError && 
            (versionQueryError.message?.includes('relation "document_versions" does not exist') || 
             versionQueryError.code === '42P01')) {
          console.log('Document versions table does not exist yet - skipping version creation')
          // Continue with content save without versioning
        } else {
          nextVersionNumber = (lastVersion?.version_number || 10) + 1

          // Create version record
          const { error: versionError } = await supabase
            .from('document_versions')
            .insert({
              project_id: projectId,
              version_number: nextVersionNumber,
              content: body.content,
              summary: body.version_summary || `Version ${Math.floor(nextVersionNumber/100)}.${Math.floor((nextVersionNumber%100)/10)}.${nextVersionNumber%10}`,
              word_count: wordCount,
              created_by: authContext.user?.id,
              is_milestone: body.is_milestone || false,
              tags: body.version_summary ? [body.version_summary] : []
            })

          if (versionError) {
            console.error('Version creation error:', versionError)
            // Continue with content save even if version creation fails
          } else {
            versionCreated = true
          }
        }
      } catch (error) {
        console.error('Version handling error:', error)
        // Continue with content save
      }
    }

    // Update project content
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        content: body.content,
        word_count: wordCount
      })
      .eq('id', projectId)
      .select()
      .single()

    if (updateError) {
      console.error('Content update error:', updateError)
      const apiError: ApiError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to save content'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      data: {
        content: updatedProject.content,
        word_count: updatedProject.word_count,
        last_modified: updatedProject.updated_at,
        version_created: versionCreated,
        version_number: versionCreated ? nextVersionNumber : null
      },
      message: versionCreated ? 'Content saved with new version' : 'Content saved',
      version_created: versionCreated,
      version_number: versionCreated ? nextVersionNumber : null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Save project content error:', error)
    
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
 * Determine if a new version should be created based on content changes
 */
function shouldCreateVersion(oldContent: string | null, newContent: string): boolean {
  if (!oldContent && newContent) return true // First content
  if (!oldContent || !newContent) return false
  
  const oldWords = oldContent.trim().split(/\s+/)
  const newWords = newContent.trim().split(/\s+/)
  
  // Create version if word count changed by more than 10% or 100 words
  const wordDiff = Math.abs(newWords.length - oldWords.length)
  const percentChange = wordDiff / Math.max(oldWords.length, 1)
  
  return wordDiff >= 100 || percentChange >= 0.1
}

// Export route handlers
export const GET = createProtectedRoute(getProjectContent, {
  projectPermission: 'read',
  rateLimit: { maxRequests: 300, windowMs: 60000 } // High limit for content viewing
})

export const PUT = createProtectedRoute(saveProjectContent, {
  projectPermission: 'write',
  rateLimit: { maxRequests: 60, windowMs: 60000 } // Moderate limit for content saving
})