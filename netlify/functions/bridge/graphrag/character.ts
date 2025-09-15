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
    const { action, characterId, profile, updates, query } = body
    
    if (!action || !characterId) {
      return jsonResponse({ 
        error: 'Action and character ID are required' 
      }, { status: 400 })
    }
    
    // Get character profile to verify ownership
    const character = await characterLockService.getCharacterProfile(characterId)
    
    if (!character) {
      return jsonResponse({ error: 'Character not found' }, { status: 404 })
    }
    
    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', character.projectId)
      .eq('user_id', user.id)
      .single()
    
    if (projectError || !project) {
      return jsonResponse({ error: 'Unauthorized access to character' }, { status: 403 })
    }
    
    // Build backend request
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || 
                      (cookieToken ? `Bearer ${cookieToken}` : 
                      (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    
    let endpoint = ''
    let requestBody: any = {}
    
    switch (action) {
      case 'initialize':
        endpoint = '/api/graphrag/character/initialize'
        requestBody = { characterId, profile: profile || character }
        break
        
      case 'update':
        endpoint = '/api/graphrag/character/update'
        requestBody = { characterId, updates }
        break
        
      case 'search':
        endpoint = '/api/graphrag/character/search'
        requestBody = { characterId, query }
        break
        
      case 'relationships':
        endpoint = '/api/graphrag/character/relationships'
        requestBody = { characterId }
        break
        
      case 'story-elements':
        endpoint = '/api/graphrag/character/story-elements'
        requestBody = { characterId }
        break
        
      default:
        return jsonResponse({ error: 'Invalid action' }, { status: 400 })
    }
    
    // Forward to backend GraphRAG service
    const response = await fetch(`${BACKEND_ORIGIN}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(requestBody),
    })
    
    const payload = await response.json().catch(() => ({}))
    
    // Update character knowledge graph if successful
    if (response.ok && (action === 'initialize' || action === 'update')) {
      try {
        await characterLockService.updateCharacterKnowledgeGraph(characterId, payload)
      } catch (error) {
        console.warn('Failed to update local character knowledge graph:', error)
      }
    }
    
    return jsonResponse(payload, { status: response.status })
    
  } catch (error) {
    console.error('Character GraphRAG API error:', error)
    return jsonResponse({ 
      error: 'Character GraphRAG operation failed',
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
    const character = await characterLockService.getCharacterProfile(characterId)
    
    if (!character) {
      return jsonResponse({ error: 'Character not found' }, { status: 404 })
    }
    
    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', character.projectId)
      .eq('user_id', user.id)
      .single()
    
    if (projectError || !project) {
      return jsonResponse({ error: 'Unauthorized access to character' }, { status: 403 })
    }
    
    // Get character relationships and story elements from database
    const [relationshipsResult, elementsResult] = await Promise.allSettled([
      supabase
        .from('character_relationships')
        .select(`
          *,
          target_character:character_profiles!target_character_id(id, name)
        `)
        .eq('character_id', characterId),
      supabase
        .from('character_story_elements')
        .select('*')
        .eq('character_id', characterId)
    ])
    
    const relationships = relationshipsResult.status === 'fulfilled' 
      ? relationshipsResult.value.data || []
      : []
    
    const storyElements = elementsResult.status === 'fulfilled'
      ? elementsResult.value.data || []
      : []
    
    return jsonResponse({
      success: true,
      character,
      relationships,
      storyElements,
      knowledgeGraph: {
        characterId,
        relationshipCount: relationships.length,
        storyElementCount: storyElements.length,
        lastUpdated: character.updatedAt
      }
    })
    
  } catch (error) {
    console.error('Error fetching character knowledge graph:', error)
    return jsonResponse({ 
      error: 'Failed to fetch character knowledge graph',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }

  }
})