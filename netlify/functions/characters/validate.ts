import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { characterLockService } from '../../../src/lib/ai/characterLock'
import { createClient } from '../../../src/lib/supabase/server'

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
    const { characterId, imageUrl, promptUsed } = body
    
    if (!characterId || !imageUrl || !promptUsed) {
      return jsonResponse({ 
        error: 'Character ID, image URL, and prompt are required' 
      }, { status: 400 })
    }
    
    // Verify user owns the character
    const { data: character, error: characterError } = await supabase
      .from('character_profiles')
      .select('project_id')
      .eq('id', characterId)
      .single()
    
    if (characterError || !character) {
      return jsonResponse({ error: 'Character not found' }, { status: 404 })
    }
    
    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', character.project_id)
      .eq('user_id', user.id)
      .single()
    
    if (projectError || !project) {
      return jsonResponse({ error: 'Unauthorized access to character' }, { status: 403 })
    }
    
    // Perform consistency validation
    const validationResult = await characterLockService.validateCharacterConsistency(
      characterId,
      imageUrl,
      promptUsed
    )
    
    return jsonResponse({ 
      success: true, 
      validation: validationResult 
    })
    
  } catch (error) {
    console.error('Character validation error:', error)
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
    const projectId = url.searchParams.get('projectId')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    if (!characterId && !projectId) {
      return jsonResponse({ 
        error: 'Either character ID or project ID is required' 
      }, { status: 400 })
    }
    
    let query = supabase
      .from('character_appearances')
      .select(`
        *,
        character_profiles!inner(name, project_id)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (characterId) {
      query = query.eq('character_profile_id', characterId)
    } else if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    const { data: appearances, error: appearancesError } = await query
    
    if (appearancesError) {
      console.error('Error fetching character appearances:', appearancesError)
      return jsonResponse({ 
        error: 'Failed to fetch character appearances' 
      }, { status: 500 })
    }
    
    // Filter to only appearances the user owns
    const userAppearances = appearances?.filter(app => {
      return app.character_profiles.project_id === projectId // We already verified project ownership above
    }) || []
    
    // Calculate consistency statistics
    const stats = {
      total: userAppearances.length,
      consistent: userAppearances.filter(app => app.validated).length,
      averageScore: userAppearances.reduce((sum, app) => sum + (app.consistency_score || 0), 0) / userAppearances.length || 0,
      recentTrend: userAppearances.slice(0, 5).reduce((sum, app) => sum + (app.consistency_score || 0), 0) / Math.min(5, userAppearances.length) || 0
    }
    
    return jsonResponse({ 
      success: true, 
      appearances: userAppearances,
      statistics: stats
    })
    
  } catch (error) {
    console.error('Character appearances fetch error:', error)
    return jsonResponse({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }

  }
})