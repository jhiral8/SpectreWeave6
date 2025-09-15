import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { createClient } from '../../../src/lib/supabase/server'
import { characterLockService } from '../../../src/lib/ai/characterLock'
import type { CharacterGenerationConfig } from '../../../src/lib/ai/characterLock'

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
      scenePrompt,
      referenceMode = 'hybrid',
      consistencyThreshold = 0.8,
      maxRetries = 2,
      styleConsistency = true,
      useReferenceImages = true,
      applyLora = false,
      strengthSettings
    } = body
    
    if (!characterId || !scenePrompt) {
      return jsonResponse({ 
        error: 'Character ID and scene prompt are required' 
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
    
    // Build generation config
    const config: CharacterGenerationConfig = {
      characterId,
      referenceMode: referenceMode as 'embedding' | 'controlnet' | 'hybrid',
      consistencyThreshold,
      maxRetries,
      styleConsistency,
      useReferenceImages,
      applyLora,
      strengthSettings
    }
    
    // Generate character image
    const result = await characterLockService.generateCharacterImage(
      characterId,
      scenePrompt,
      config
    )
    
    return jsonResponse({ 
      success: true, 
      result
    })
    
  } catch (error) {
    console.error('Error generating character image:', error)
    return jsonResponse({ 
      error: 'Failed to generate character image',
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
    const projectId = url.searchParams.get('projectId')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    if (!characterId && !projectId) {
      return jsonResponse({ 
        error: 'Either Character ID or Project ID is required' 
      }, { status: 400 })
    }
    
    let query = supabase
      .from('character_generation_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (characterId) {
      query = query.eq('character_id', characterId)
    } else if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    // Verify user owns the project
    if (projectId) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single()
      
      if (projectError || !project) {
        return jsonResponse({ error: 'Unauthorized access to project' }, { status: 403 })
      }
    } else if (characterId) {
      const profile = await characterLockService.getCharacterProfile(characterId)
      
      if (!profile) {
        return jsonResponse({ error: 'Character not found' }, { status: 404 })
      }
      
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', profile.projectId)
        .eq('user_id', user.id)
        .single()
      
      if (projectError || !project) {
        return jsonResponse({ error: 'Unauthorized access to character' }, { status: 403 })
      }
    }
    
    const { data: sessions, error: sessionsError } = await query
    
    if (sessionsError) {
      console.error('Error fetching generation sessions:', sessionsError)
      return jsonResponse({ 
        error: 'Failed to fetch generation sessions' 
      }, { status: 500 })
    }
    
    return jsonResponse({ 
      success: true, 
      sessions: sessions || []
    })
    
  } catch (error) {
    console.error('Error fetching generation history:', error)
    return jsonResponse({ 
      error: 'Failed to fetch generation history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }

  }
})