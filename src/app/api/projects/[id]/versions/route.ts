// Version history API routes - GET /api/projects/[id]/versions
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import {
  VersionHistoryResponse,
  VersionsQueryParams,
  ApiError,
  NotFoundError
} from '@/types/database'

/**
 * GET /api/projects/[id]/versions
 * Get version history for a project
 */
async function getVersionHistory(
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
    const queryParams: VersionsQueryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
      milestone_only: searchParams.get('milestone_only') === 'true',
      from_date: searchParams.get('from_date') || undefined,
      to_date: searchParams.get('to_date') || undefined
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

    // Build query (simplified without user_profiles join to avoid foreign key issues)
    let query = supabase
      .from('document_versions')
      .select(`
        id,
        version_number,
        content,
        summary,
        word_count,
        created_at,
        created_by,
        is_milestone,
        tags,
        change_summary
      `, { count: 'exact' })
      .eq('project_id', projectId)

    // Apply filters
    if (queryParams.milestone_only) {
      query = query.eq('is_milestone', true)
    }

    if (queryParams.from_date) {
      query = query.gte('created_at', queryParams.from_date)
    }

    if (queryParams.to_date) {
      query = query.lte('created_at', queryParams.to_date)
    }

    // Apply sorting (newest first)
    query = query.order('version_number', { ascending: false })

    // Apply pagination
    const from = ((queryParams.page || 1) - 1) * (queryParams.limit || 20)
    const to = from + (queryParams.limit || 20) - 1
    query = query.range(from, to)

    const { data: versions, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      
      // Handle case where document_versions table doesn't exist yet
      if (error.message?.includes('relation "document_versions" does not exist') || 
          error.code === '42P01') {
        // Return empty versions array for now
        const response: VersionHistoryResponse = {
          versions: [],
          total: 0,
          page: queryParams.page || 1,
          limit: queryParams.limit || 20
        }
        return new Response(JSON.stringify({ data: response }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      const apiError: ApiError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch version history',
        details: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Transform versions data to match component expectations
    const transformedVersions = (versions || []).map(version => ({
      id: version.id,
      version_number: version.version_number,
      summary: version.summary || version.change_summary || `Version v${Math.floor(version.version_number / 100)}.${Math.floor((version.version_number % 100) / 10)}.${version.version_number % 10}`,
      created_at: version.created_at,
      created_by: version.created_by,
      word_count: version.word_count,
      is_milestone: version.is_milestone,
      tags: version.tags || []
    }))
    
    const response: VersionHistoryResponse = {
      versions: transformedVersions,
      total: count || 0,
      page: queryParams.page || 1,
      limit: queryParams.limit || 20
    }

    return new Response(JSON.stringify({ data: response }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Get version history error:', error)
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
export const GET = createProtectedRoute(getVersionHistory, {
  projectPermission: 'read',
  rateLimit: { maxRequests: 200, windowMs: 60000 }
})