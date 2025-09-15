import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'


export const handler = createNetlifyHandler({

  POST: async (request: Request) => {
    export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { characterId, updates } = body
    
    if (!characterId || !updates) {
      return jsonResponse({ 
        error: 'Character ID and updates are required' 
      }, { status: 400 })
    }
    
    // Build update data for GraphRAG
    const updateData = {
      entity_id: characterId,
      updates: {
        ...updates,
        updated_at: new Date().toISOString()
      }
    }
    
    // If this is a relationship update
    if (updates.relationships) {
      updateData.updates.relationships = updates.relationships.map((rel: any) => ({
        target_entity_id: rel.targetCharacterId,
        relationship_type: rel.relationshipType,
        description: rel.description,
        strength: rel.strength,
        context: rel.context || []
      }))
    }
    
    // If this is a story element update
    if (updates.storyElements) {
      updateData.updates.story_elements = updates.storyElements.map((element: any) => ({
        type: element.type,
        name: element.name,
        description: element.description,
        association_strength: element.associationStrength,
        appearances: element.appearances || []
      }))
    }
    
    // If this is a consistency update
    if (updates.consistencyData) {
      updateData.updates.consistency_data = {
        ...updates.consistencyData,
        last_updated: new Date().toISOString()
      }
    }
    
    // Forward to backend GraphRAG service
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || 
                      (cookieToken ? `Bearer ${cookieToken}` : 
                      (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    
    const response = await fetch(`${BACKEND_ORIGIN}/api/graphrag/entities/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(updateData),
    })
    
    const payload = await response.json().catch(() => ({}))
    
    return jsonResponse({
      success: response.ok,
      characterId,
      updatedData: payload,
      message: response.ok ? 'Character knowledge graph updated' : 'Failed to update character'
    }, { status: response.status })
    
  } catch (error) {
    console.error('Character update error:', error)
    return jsonResponse({ 
      success: false,
      error: 'Character GraphRAG update failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }

  }
})