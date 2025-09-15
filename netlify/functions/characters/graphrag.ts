import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
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
    const { action, characterId, projectId } = body
    
    switch (action) {
      case 'ingest_character':
        return await ingestCharacterToGraphRAG(req, characterId, projectId, user.id)
      
      case 'search_character_context':
        return await searchCharacterContext(req, body.query, projectId, user.id)
      
      case 'update_character_relationships':
        return await updateCharacterRelationships(req, characterId, body.relationships, user.id)
      
      case 'get_character_knowledge':
        return await getCharacterKnowledge(req, characterId, user.id)
      
      default:
        return jsonResponse({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Character GraphRAG API error:', error)
    return jsonResponse({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }

  }
})