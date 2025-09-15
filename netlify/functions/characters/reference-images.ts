import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { createClient } from '../../../src/lib/supabase/server'
import { characterLockService } from '../../../src/lib/ai/characterLock'

export const handler = createNetlifyHandler({

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
      characterId, 
      visualDescription,
      imageTypes = ['front_view', 'side_view', 'full_body'],
      regenerate = false
    } = body
    
    if (!characterId) {
      return jsonResponse({ 
        error: 'Character ID is required' 
      }, { status: 400 })
    }
    
    // Get character profile to verify ownership
    const profile = await characterLockService.getCharacterProfile(characterId)
    
    if (!profile) {
      return jsonResponse({ error: 'Character not found' }, { status: 404 })
    }
    
    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', profile.projectId)
      .eq('user_id', user.id)
      .single()
    
    if (projectError || !project) {
      return jsonResponse({ error: 'Unauthorized access to character' }, { status: 403 })
    }
    
    // Generate reference images
    const referenceImages = await characterLockService.generateReferenceImages(
      characterId,
      visualDescription || profile.visualDescription,
      imageTypes
    )
    
    return jsonResponse({ 
      success: true, 
      referenceImages
    })
    
  } catch (error) {
    console.error('Error generating reference images:', error)
    return jsonResponse({ 
      error: 'Failed to generate reference images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }

  },

  GET: async (request: Request) => {
    export async function GET(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const url = new URL(req.url)
    const characterId = url.searchParams.get('characterId')
    
    if (!characterId) {
      return jsonResponse({ error: 'Character ID is required' }, { status: 400 })
    }
    
    // Get character profile to verify ownership
    const profile = await characterLockService.getCharacterProfile(characterId)
    
    if (!profile) {
      return jsonResponse({ error: 'Character not found' }, { status: 404 })
    }
    
    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', profile.projectId)
      .eq('user_id', user.id)
      .single()
    
    if (projectError || !project) {
      return jsonResponse({ error: 'Unauthorized access to character' }, { status: 403 })
    }
    
    return jsonResponse({ 
      success: true, 
      referenceImages: profile.referenceImages
    })
    
  } catch (error) {
    console.error('Error fetching reference images:', error)
    return jsonResponse({ 
      error: 'Failed to fetch reference images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }

  }
})