import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { createClient } from '../../../src/lib/supabase/server'
import { characterLockService } from '../../../src/lib/ai/characterLock'

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
    const characterId = url.searchParams.get('characterId')
    
    if (!characterId) {
      return jsonResponse({ 
        error: 'Character ID is required' 
      }, { status: 400 })
    }
    
    // Verify user owns the character
    const { data: character, error: characterError } = await supabase
      .from('character_profiles')
      .select('project_id, name')
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
    
    // Get turnarounds for the character
    const { data: turnarounds, error: turnaroundsError } = await supabase
      .from('character_turnarounds')
      .select('*')
      .eq('character_profile_id', characterId)
      .order('created_at', { ascending: false })
    
    if (turnaroundsError) {
      console.error('Error fetching character turnarounds:', turnaroundsError)
      return jsonResponse({ 
        error: 'Failed to fetch character turnarounds' 
      }, { status: 500 })
    }
    
    return jsonResponse({ 
      success: true, 
      turnarounds: turnarounds || [],
      character: {
        id: characterId,
        name: character.name
      }
    })
    
  } catch (error) {
    console.error('Character turnarounds GET error:', error)
    return jsonResponse({ 
      error: 'Internal server error' 
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
      characterId, 
      illustrationStyle, 
      generateMissing = false,
      views 
    } = body
    
    if (!characterId || !illustrationStyle) {
      return jsonResponse({ 
        error: 'Character ID and illustration style are required' 
      }, { status: 400 })
    }
    
    // Verify user owns the character
    const { data: character, error: characterError } = await supabase
      .from('character_profiles')
      .select('project_id, name, description, physical_traits')
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
    
    // If generateMissing is true, generate turnaround images automatically
    let turnaroundData: any = {
      character_profile_id: characterId,
      illustration_style: illustrationStyle,
      art_style_notes: body.artStyleNotes || '',
      generated_as_batch: generateMissing,
      consistency_validated: false
    }
    
    if (views) {
      // Manual upload of turnaround views
      turnaroundData = {
        ...turnaroundData,
        front_view_url: views.front,
        side_view_url: views.side,
        back_view_url: views.back,
        three_quarter_view_url: views.threeQuarter,
        additional_angles: views.additional || []
      }
    } else if (generateMissing) {
      // Generate turnaround images using AI
      try {
        const generatedTurnarounds = await generateCharacterTurnarounds(
          character,
          illustrationStyle,
          body.artStyleNotes
        )
        
        turnaroundData = {
          ...turnaroundData,
          ...generatedTurnarounds.views,
          generation_prompt: generatedTurnarounds.prompt,
          additional_angles: generatedTurnarounds.additionalAngles || []
        }
      } catch (generateError) {
        console.error('Error generating turnarounds:', generateError)
        return jsonResponse({ 
          error: 'Failed to generate turnaround images',
          details: generateError instanceof Error ? generateError.message : 'Unknown error'
        }, { status: 500 })
      }
    }
    
    // Save turnaround to database
    const { data: savedTurnaround, error: saveError } = await supabase
      .from('character_turnarounds')
      .insert(turnaroundData)
      .select()
      .single()
    
    if (saveError) {
      console.error('Error saving character turnaround:', saveError)
      return jsonResponse({ 
        error: 'Failed to save character turnaround' 
      }, { status: 500 })
    }
    
    // If we have images, generate embeddings
    if (savedTurnaround.front_view_url || savedTurnaround.side_view_url) {
      try {
        await generateTurnaroundEmbeddings(savedTurnaround)
      } catch (embeddingError) {
        console.warn('Failed to generate turnaround embeddings:', embeddingError)
        // Continue without failing the request
      }
    }
    
    return jsonResponse({ 
      success: true, 
      turnaround: savedTurnaround 
    })
    
  } catch (error) {
    console.error('Character turnarounds POST error:', error)
    return jsonResponse({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }

  }
})