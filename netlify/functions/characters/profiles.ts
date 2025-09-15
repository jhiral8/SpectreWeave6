import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { characterLockService } from '../../../src/lib/ai/characterLock'
import { createClient } from '../../../src/lib/supabase/server'

export const handler = createNetlifyHandler({

  GET: async (request: Request) => {
    export async function GET(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const url = new URL(req.url)
    const projectId = url.searchParams.get('projectId')
    
    if (!projectId) {
      return jsonResponse({ error: 'Project ID is required' }, { status: 400 })
    }
    
    // Verify user owns the project (check both projects and books tables)
    let projectOwner = false
    
    // First try projects table
    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single()
      
      if (!projectError && project) {
        projectOwner = true
      }
    } catch (err) {
      // Continue to check books table
    }
    
    // If not found in projects, try books table
    if (!projectOwner) {
      try {
        const { data: book, error: bookError } = await supabase
          .from('books')
          .select('id')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single()
        
        if (!bookError && book) {
          projectOwner = true
        }
      } catch (err) {
        // Both checks failed
      }
    }
    
    if (!projectOwner) {
      return jsonResponse({ error: 'Project not found or unauthorized' }, { status: 404 })
    }
    
    // For now, return empty profiles array to avoid database table issues
    let profiles = []
    try {
      profiles = await characterLockService.getProjectCharacters(projectId)
    } catch (error: any) {
      // If table doesn't exist or any other database error, just return empty array
      console.warn('Character profiles service error (returning empty array):', error?.message)
      profiles = []
    }
    
    return jsonResponse({ 
      success: true, 
      profiles: profiles || []
    })
    
  } catch (error) {
    console.error('Character profiles API error:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return jsonResponse({ 
          error: 'Database table missing',
          message: 'Required database tables have not been created. Please run the database migration script.',
          details: error.message
        }, { status: 503 })
      }
    }
    
    return jsonResponse({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }

  },

  POST: async (request: Request) => {
    export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const { 
      projectId, 
      name, 
      description, 
      visualDescription,
      role, 
      personality,
      generateReferenceImages = false,
      referenceImageTypes = ['front_view', 'side_view', 'full_body']
    } = body
    
    if (!projectId || !name) {
      return jsonResponse({ 
        error: 'Project ID and character name are required' 
      }, { status: 400 })
    }
    
    if (!visualDescription) {
      return jsonResponse({ 
        error: 'Visual description is required for character lock system' 
      }, { status: 400 })
    }
    
    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()
    
    if (projectError || !project) {
      return jsonResponse({ error: 'Project not found or unauthorized' }, { status: 404 })
    }
    
    // Create character profile
    const characterData = {
      projectId,
      name,
      description: description || '',
      visualDescription,
      role: role || 'supporting',
      personality: personality || []
    }
    
    const profile = await characterLockService.createCharacterProfile(
      projectId,
      characterData
    )
    
    // Generate reference images if requested
    let referenceImages = []
    if (generateReferenceImages) {
      try {
        referenceImages = await characterLockService.generateReferenceImages(
          profile.id,
          visualDescription,
          referenceImageTypes
        )
      } catch (error) {
        console.warn('Failed to generate reference images:', error)
        // Continue without reference images - not a critical error
      }
    }
    
    return jsonResponse({ 
      success: true, 
      profile: {
        ...profile,
        referenceImages
      }
    })
    
  } catch (error) {
    console.error('Error creating character profile:', error)
    return jsonResponse({ 
      error: 'Failed to create character profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }

  }
})