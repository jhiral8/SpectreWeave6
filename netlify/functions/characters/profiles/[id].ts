import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { createClient } from '../../../src/lib/supabase/server'
import { characterLockService } from '../../../src/lib/ai/characterLock'

export const handler = createNetlifyHandler({

  GET: async (request: Request) => {
    export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const characterId = params.id
    
    // Get character profile using the service
    const profile = await characterLockService.getCharacterProfile(characterId)
    
    if (!profile) {
      return jsonResponse({ error: 'Character profile not found' }, { status: 404 })
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
      profile 
    })
    
  } catch (error) {
    console.error('Character profile GET error:', error)
    return jsonResponse({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }

  },

  PUT: async (request: Request) => {
    export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const characterId = params.id
    const body = await req.json()
    
    // Get existing profile to verify ownership
    const { data: existingProfile, error: profileError } = await supabase
      .from('character_profiles')
      .select('project_id')
      .eq('id', characterId)
      .single()
    
    if (profileError || !existingProfile) {
      return jsonResponse({ error: 'Character profile not found' }, { status: 404 })
    }
    
    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', existingProfile.project_id)
      .eq('user_id', user.id)
      .single()
    
    if (projectError || !project) {
      return jsonResponse({ error: 'Unauthorized access to character' }, { status: 403 })
    }
    
    // Update the profile
    const updateData: any = {}
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.role !== undefined) updateData.role = body.role
    if (body.physicalTraits !== undefined) updateData.physical_traits = body.physicalTraits
    if (body.personalityTraits !== undefined) updateData.personality_traits = body.personalityTraits
    if (body.referenceImages !== undefined) updateData.reference_images = body.referenceImages
    if (body.styleTokens !== undefined) updateData.style_tokens = body.styleTokens
    if (body.knowledgeGraphData !== undefined) updateData.knowledge_graph_data = body.knowledgeGraphData
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('character_profiles')
      .update(updateData)
      .eq('id', characterId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating character profile:', updateError)
      return jsonResponse({ 
        error: 'Failed to update character profile' 
      }, { status: 500 })
    }
    
    return jsonResponse({ 
      success: true, 
      profile: updatedProfile 
    })
    
  } catch (error) {
    console.error('Character profile PUT error:', error)
    return jsonResponse({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }

  },

  DELETE: async (request: Request) => {
    export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const characterId = params.id
    
    // Get existing profile to verify ownership
    const { data: existingProfile, error: profileError } = await supabase
      .from('character_profiles')
      .select('project_id, name')
      .eq('id', characterId)
      .single()
    
    if (profileError || !existingProfile) {
      return jsonResponse({ error: 'Character profile not found' }, { status: 404 })
    }
    
    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', existingProfile.project_id)
      .eq('user_id', user.id)
      .single()
    
    if (projectError || !project) {
      return jsonResponse({ error: 'Unauthorized access to character' }, { status: 403 })
    }
    
    // Delete the profile (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('character_profiles')
      .delete()
      .eq('id', characterId)
    
    if (deleteError) {
      console.error('Error deleting character profile:', deleteError)
      return jsonResponse({ 
        error: 'Failed to delete character profile' 
      }, { status: 500 })
    }
    
    return jsonResponse({ 
      success: true, 
      message: `Character profile "${existingProfile.name}" deleted successfully` 
    })
    
  } catch (error) {
    console.error('Character profile DELETE error:', error)
    return jsonResponse({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }

  }
})