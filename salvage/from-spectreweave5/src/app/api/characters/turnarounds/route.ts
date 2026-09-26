/**
 * Character Turnarounds API
 * 
 * Handles creation and management of 360-degree character reference images
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { characterLockService } from '@/lib/ai/characterLock'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const url = new URL(req.url)
    const characterId = url.searchParams.get('characterId')
    
    if (!characterId) {
      return NextResponse.json({ 
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
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }
    
    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', character.project_id)
      .eq('user_id', user.id)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Unauthorized access to character' }, { status: 403 })
    }
    
    // Get turnarounds for the character
    const { data: turnarounds, error: turnaroundsError } = await supabase
      .from('character_turnarounds')
      .select('*')
      .eq('character_profile_id', characterId)
      .order('created_at', { ascending: false })
    
    if (turnaroundsError) {
      console.error('Error fetching character turnarounds:', turnaroundsError)
      return NextResponse.json({ 
        error: 'Failed to fetch character turnarounds' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      turnarounds: turnarounds || [],
      character: {
        id: characterId,
        name: character.name
      }
    })
    
  } catch (error) {
    console.error('Character turnarounds GET error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const { 
      characterId, 
      illustrationStyle, 
      generateMissing = false,
      views 
    } = body
    
    if (!characterId || !illustrationStyle) {
      return NextResponse.json({ 
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
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }
    
    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', character.project_id)
      .eq('user_id', user.id)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Unauthorized access to character' }, { status: 403 })
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
        return NextResponse.json({ 
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
      return NextResponse.json({ 
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
    
    return NextResponse.json({ 
      success: true, 
      turnaround: savedTurnaround 
    })
    
  } catch (error) {
    console.error('Character turnarounds POST error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Helper function to generate character turnarounds using AI
async function generateCharacterTurnarounds(
  character: any, 
  illustrationStyle: string, 
  artStyleNotes?: string
): Promise<{
  views: Record<string, string>
  prompt: string
  additionalAngles: Array<{ angle: string; url: string }>
}> {
  // Build character description for turnaround generation
  const characterDescription = buildCharacterDescription(character)
  
  // Generate turnaround prompt
  const basePrompt = `Character turnaround sheet for: ${characterDescription}
  
Style: ${illustrationStyle} children's book illustration
${artStyleNotes ? `Art direction: ${artStyleNotes}` : ''}

Requirements:
- Clean white background
- Consistent lighting and proportions
- Same character, different angles
- High quality, professional turnaround sheet
- Suitable for character reference`
  
  const angles = [
    { view: 'front_view_url', description: 'front view, facing forward' },
    { view: 'side_view_url', description: 'side profile view, 90 degrees' },
    { view: 'back_view_url', description: 'back view, facing away' },
    { view: 'three_quarter_view_url', description: 'three-quarter view, 45 degrees' }
  ]
  
  const views: Record<string, string> = {}
  
  // Generate each view
  for (const angle of angles) {
    const specificPrompt = `${basePrompt}, ${angle.description}`
    
    try {
      // This would integrate with your image generation service
      // For now, we'll throw an error to indicate this needs implementation
      throw new Error(`Image generation integration needed for ${angle.view}`)
      
      // Example integration:
      // const result = await generateImage(specificPrompt, { style: illustrationStyle })
      // views[angle.view] = result.imageUrl
    } catch (error) {
      console.error(`Failed to generate ${angle.view}:`, error)
      // Continue with other views
    }
  }
  
  return {
    views,
    prompt: basePrompt,
    additionalAngles: []
  }
}

// Helper function to generate embeddings for turnaround images
async function generateTurnaroundEmbeddings(turnaround: any): Promise<void> {
  try {
    const imageUrls = [
      turnaround.front_view_url,
      turnaround.side_view_url,
      turnaround.back_view_url,
      turnaround.three_quarter_view_url
    ].filter(Boolean)
    
    if (imageUrls.length === 0) return
    
    const embeddings: Record<string, number[]> = {}
    
    // This would use the characterLockService to generate embeddings
    // For now, we'll skip this step
    console.log('Turnaround embedding generation would happen here')
    
    // Update the turnaround with embeddings
    // await supabase
    //   .from('character_turnarounds')
    //   .update({
    //     view_embeddings: embeddings,
    //     master_embedding: masterEmbedding
    //   })
    //   .eq('id', turnaround.id)
    
  } catch (error) {
    console.error('Error generating turnaround embeddings:', error)
    throw error
  }
}

// Helper function to build character description
function buildCharacterDescription(character: any): string {
  const parts: string[] = [character.name]
  
  if (character.description) {
    parts.push(character.description)
  }
  
  const traits = character.physical_traits || {}
  if (traits.height) parts.push(`${traits.height} height`)
  if (traits.build) parts.push(`${traits.build} build`)
  if (traits.hair_color && traits.hair_style) {
    parts.push(`${traits.hair_color} ${traits.hair_style} hair`)
  }
  if (traits.eye_color) parts.push(`${traits.eye_color} eyes`)
  if (traits.clothing?.primary_outfit) {
    parts.push(`wearing ${traits.clothing.primary_outfit}`)
  }
  
  return parts.join(', ')
}