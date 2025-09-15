// Version restoration API route - POST /api/projects/[id]/versions/[versionId]/restore
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import {
  ApiError,
  NotFoundError
} from '@/types/database'

/**
 * POST /api/projects/[id]/versions/[versionId]/restore
 * Restore a specific version as the current content
 */
async function restoreVersion(
  authContext: any,
  request: NextRequest,
  permissions: string[],
  { params }: { params: { id: string; versionId: string } }
): Promise<Response> {
  try {
    const supabase = createClient()
    const projectId = params.id
    const versionId = params.versionId

    // Get the version to restore
    const { data: version, error: versionError } = await supabase
      .from('document_versions')
      .select(`
        id,
        version_number,
        content,
        word_count,
        summary,
        project_id
      `)
      .eq('id', versionId)
      .eq('project_id', projectId)
      .single()

    if (versionError || !version) {
      const notFoundError: NotFoundError = {
        code: 'NOT_FOUND',
        message: 'Version not found',
        details: {
          resource: 'document_version',
          id: versionId
        }
      }
      return new Response(JSON.stringify({ error: notFoundError }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get current project content for comparison
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

    // Create a backup version of current content before restore
    const { data: lastVersion } = await supabase
      .from('document_versions')
      .select('version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const nextVersionNumber = (lastVersion?.version_number || 0) + 1

    // Create backup version
    const { error: backupError } = await supabase
      .from('document_versions')
      .insert({
        project_id: projectId,
        version_number: nextVersionNumber,
        content: currentProject.content || '',
        summary: `Backup before restoring version ${version.version_number}`,
        word_count: currentProject.word_count,
        created_by: authContext.user.id,
        is_milestone: false,
        tags: ['backup', 'pre-restore']
      })

    if (backupError) {
      console.error('Backup version creation error:', backupError)
      // Continue with restore even if backup fails
    }

    // Update project with restored content
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        content: version.content,
        word_count: version.word_count
      })
      .eq('id', projectId)
      .select()
      .single()

    if (updateError) {
      console.error('Project update error:', updateError)
      const apiError: ApiError = {
        code: 'DATABASE_ERROR',
        message: 'Failed to restore version'
      }
      return new Response(JSON.stringify({ error: apiError }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create a new version marking the restore
    const { error: restoreVersionError } = await supabase
      .from('document_versions')
      .insert({
        project_id: projectId,
        version_number: nextVersionNumber + 1,
        content: version.content,
        summary: `Restored from version ${version.version_number}`,
        word_count: version.word_count,
        created_by: authContext.user.id,
        is_milestone: true,
        tags: ['restore', `from-v${version.version_number}`]
      })

    if (restoreVersionError) {
      console.error('Restore version creation error:', restoreVersionError)
      // Continue even if restore version creation fails
    }

    return new Response(JSON.stringify({
      data: {
        project: updatedProject,
        restored_from: {
          version_id: version.id,
          version_number: version.version_number,
          summary: version.summary
        }
      },
      message: `Successfully restored content from version ${version.version_number}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Restore version error:', error)
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
export const POST = createProtectedRoute(restoreVersion, {
  projectPermission: 'write',
  rateLimit: { maxRequests: 20, windowMs: 60000 } // Limited - restoring is a significant operation
})