import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse } from './_utils'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const handler = createNetlifyHandler({

  GET: async (request: Request) => {
    
  try {
    const url = new URL(request.url)
    const projectId = url.searchParams.get('projectId')
    
    const supabase = createClient()
    
    // First, let's see what tables actually exist
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_all_tables')
      .single()
      
    // If that RPC doesn't exist, try a different approach
    let tables = []
    if (tableError) {
      // Try querying pg_tables directly
      const { data: pgTables } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
      tables = pgTables?.map(t => t.tablename) || []
    }
    
    // Check if projects table exists and what projects are there
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id, title')
      .limit(10)
    
    // Check if the specific project exists (only if projectId provided)
    let specificProject = null
    let specificError = null
    let versions = []
    let versionsError = null
    
    if (projectId) {
      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .select('id, title, user_id, created_at')
        .eq('id', projectId)
        .single()
      
      specificProject = proj
      specificError = projErr
      
      // Try to query document_versions for this project
      const { data: vers, error: versErr } = await supabase
        .from('document_versions')
        .select('*')
        .eq('project_id', projectId)
        .limit(5)
      
      versions = vers || []
      versionsError = versErr
    }
    
    // Also check if there are any documents with this ID
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, title, created_at')
      .limit(10)
    
    return new Response(JSON.stringify({ 
      success: true,
      projectId: projectId || 'not provided',
      allProjects: projects || [],
      projectsError: projectError,
      allDocuments: documents || [],
      documentsError: docError,
      specificProject: specificProject,
      specificProjectError: specificError,
      versions: versions,
      versionsError: versionsError,
      count: versions.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Debug versions error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  }
})