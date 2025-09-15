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
      imageUrl,
      expectedFeatures
    } = body
    
    if (!characterId || !imageUrl) {
      return jsonResponse({ 
        error: 'Character ID and image URL are required' 
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
    
    // Validate character consistency
    const validation = await characterLockService.validateCharacterConsistency(
      characterId,
      imageUrl,
      expectedFeatures
    )
    
    return jsonResponse({ 
      success: true, 
      ...validation
    })
    
  } catch (error) {
    console.error('Error validating character consistency:', error)
    return jsonResponse({ 
      error: 'Failed to validate character consistency',
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
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
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
    
    // Get consistency history
    const { data: consistencyHistory, error: consistencyError } = await supabase
      .from('character_consistency')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (consistencyError) {
      console.error('Error fetching consistency history:', consistencyError)
      return jsonResponse({ 
        error: 'Failed to fetch consistency history' 
      }, { status: 500 })
    }
    
    return jsonResponse({ 
      success: true, 
      consistencyHistory: consistencyHistory || []
    })
    
  } catch (error) {
    console.error('Error fetching character consistency:', error)
    return jsonResponse({ 
      error: 'Failed to fetch character consistency',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }

  }
})