import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { createClient } from '../../../src/lib/supabase/server'

export const handler = createNetlifyHandler({

  GET: async (request: Request) => {
    
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const searchParams = url.searchParams

    // Parse query parameters  
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const genre = searchParams.get('genre')
    const archived = searchParams.get('archived') === 'true'

    // Build query
    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', archived)

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (genre) {
      query = query.eq('genre', genre)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order('updated_at', { ascending: false })

    const { data: projects, error } = await query

    if (error) {
      console.error('Database error:', error)
      // Handle specific database errors more gracefully
      if (error.code === '42P01') {
        return jsonResponse({ error: 'Database tables not initialized. Please run migrations.' }, { status: 503 })
      }
      return jsonResponse({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    return jsonResponse({ projects: projects || [], total: projects?.length || 0 })

  } catch (error) {
    console.error('Projects GET error:', error)
    return jsonResponse({ error: 'Internal server error' }, { status: 500 })
  }
}
  },

  POST: async (request: Request) => {
    
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, genre, brief } = body

    if (!title) {
      return jsonResponse({ error: 'Title is required' }, { status: 400 })
    }

    // Create project with proper defaults
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title,
        description,
        genre,
        brief,
        user_id: user.id,
        status: 'draft',
        // Let database handle defaults for word_count, archived, order
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      // Handle specific database errors more gracefully
      if (error.code === '42P01') {
        return jsonResponse({ error: 'Database tables not initialized. Please run migrations.' }, { status: 503 })
      }
      if (error.code === '23505') {
        return jsonResponse({ error: 'Project with this title already exists' }, { status: 409 })
      }
      return jsonResponse({ error: 'Failed to create project' }, { status: 500 })
    }

    return jsonResponse({ project }, { status: 201 })

  } catch (error) {
    console.error('Projects POST error:', error)
    return jsonResponse({ error: 'Internal server error' }, { status: 500 })
  }

  }
})