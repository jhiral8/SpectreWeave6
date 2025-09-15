// Project duplication API route - POST /api/projects/[id]/duplicate
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import {
  Project,
  ApiError,
  ValidationError
} from '@/types/database'

/**
 * POST /api/projects/[id]/duplicate
 * Duplicate an existing project with all its chapters and characters
 */
async function duplicateProject(
  authContext: any,
  request: NextRequest,
  permissions: string[],
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const sourceProjectId = params.id
    const body = await request.json()
    const newTitle = body.title?.trim()

    // Validate new title
    if (!newTitle) {
      const error: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'New project title is required',
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

    // Check subscription limits
    const { count: projectCount } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', authContext.user.id)
      .eq('archived', false)

    const userTier = authContext.user.profile?.subscription_tier || 'free'
    const projectLimits = {
      free: 3,
      pro: 50,
      enterprise: 1000
    }

    if ((projectCount || 0) >= projectLimits[userTier]) {
      const apiError: ApiError = {
        code: 'LIMIT_EXCEEDED',
        message: `Project limit reached for ${userTier} tier`,
        details: {
          current_count: projectCount,
          limit: projectLimits[userTier],
          tier: userTier
        }
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get source project
    const { data: sourceProject, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', sourceProjectId)
      .single()

    if (projectError || !sourceProject) {
      const apiError: ApiError = {
        code: 'NOT_FOUND',
        message: 'Source project not found'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get next order number for new project
    const { data: lastProject } = await supabase
      .from('projects')
      .select('order')
      .eq('user_id', authContext.user.id)
      .order('order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (lastProject?.order || 0) + 1

    // Create duplicate project
    const newProjectData = {
      title: newTitle,
      description: sourceProject.description ? `Copy of ${sourceProject.description}` : `Copy of ${sourceProject.title}`,
      genre: sourceProject.genre,
      brief: sourceProject.brief,
      content: sourceProject.content,
      word_count: sourceProject.word_count,
      status: 'draft' as const,
      order: nextOrder,
      archived: false,
      user_id: authContext.user.id
    }

    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert(newProjectData)
      .select()
      .single()

    if (createError) {
      console.error('Database error:', createError)
      
      if (createError.code === '23505' && createError.details?.includes('title')) {
        const validationError: ValidationError = {
          code: 'VALIDATION_ERROR',
          message: 'A project with this title already exists',
          field: 'title',
          details: {
            expected: 'unique title',
            received: newTitle
          }
        }
        return new Response(JSON.stringify({ error: validationError }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const apiError: ApiError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to create duplicate project'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Duplicate chapters
    const { data: chapters } = await supabase
      .from('chapters')
      .select('*')
      .eq('project_id', sourceProjectId)
      .order('order', { ascending: true })

    if (chapters && chapters.length > 0) {
      const chapterDuplicates = chapters.map(chapter => ({
        project_id: newProject.id,
        title: chapter.title,
        description: chapter.description,
        content: chapter.content,
        order: chapter.order,
        word_count: chapter.word_count,
        status: 'draft' as const
      }))

      await supabase
        .from('chapters')
        .insert(chapterDuplicates)
    }

    // Duplicate characters
    const { data: characters } = await supabase
      .from('characters')
      .select('*')
      .eq('project_id', sourceProjectId)

    if (characters && characters.length > 0) {
      const characterDuplicates = characters.map(character => ({
        project_id: newProject.id,
        name: character.name,
        description: character.description,
        role: character.role,
        appearance: character.appearance,
        personality: character.personality,
        backstory: character.backstory,
        relationships: character.relationships,
        notes: character.notes,
        avatar_url: character.avatar_url
      }))

      await supabase
        .from('characters')
        .insert(characterDuplicates)
    }

    // Duplicate research items
    const { data: research } = await supabase
      .from('research')
      .select('*')
      .eq('project_id', sourceProjectId)

    if (research && research.length > 0) {
      const researchDuplicates = research.map(item => ({
        project_id: newProject.id,
        title: item.title,
        content: item.content,
        category: item.category,
        tags: item.tags,
        source_url: item.source_url,
        attachments: item.attachments
      }))

      await supabase
        .from('research')
        .insert(researchDuplicates)
    }

    // Create initial version for duplicate
    if (sourceProject.content) {
      await supabase
        .from('document_versions')
        .insert({
          project_id: newProject.id,
          version_number: 1,
          content: sourceProject.content,
          summary: 'Initial version (duplicated)',
          word_count: sourceProject.word_count,
          created_by: authContext.user.id,
          is_milestone: true
        })
    }

    // Get final counts for response
    const { count: chapterCount } = await supabase
      .from('chapters')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', newProject.id)

    const { count: characterCount } = await supabase
      .from('characters')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', newProject.id)

    return new Response(JSON.stringify({ 
      data: {
        ...newProject,
        chapter_count: chapterCount || 0,
        character_count: characterCount || 0,
        last_edited: newProject.updated_at
      },
      message: 'Project duplicated successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Duplicate project error:', error)
    
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

// Export route handler
export const POST = createProtectedRoute(duplicateProject, {
  projectPermission: 'read', // Only need read access to source project
  rateLimit: { maxRequests: 5, windowMs: 60000 } // Very limited - duplicating is expensive
})