/**
 * Character Generation API Endpoints
 * 
 * Handles consistent character image generation using the character lock system
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { characterLockService } from '@/lib/ai/characterLock'
import type { CharacterGenerationConfig } from '@/lib/ai/characterLock'

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
      return NextResponse.json({ 
        error: 'Character ID and scene prompt are required' 
      }, { status: 400 })
    }
    
    // Get character profile to verify ownership
    const profile = await characterLockService.getCharacterProfile(characterId)
    
    if (!profile) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }
    
    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', profile.projectId)
      .eq('user_id', user.id)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Unauthorized access to character' }, { status: 403 })
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
    
    return NextResponse.json({ 
      success: true, 
      result
    })
    
  } catch (error) {
    console.error('Error generating character image:', error)
    return NextResponse.json({ 
      error: 'Failed to generate character image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for generation history
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const url = new URL(req.url)
    const characterId = url.searchParams.get('characterId')
    const projectId = url.searchParams.get('projectId')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    if (!characterId && !projectId) {
      return NextResponse.json({ 
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
        return NextResponse.json({ error: 'Unauthorized access to project' }, { status: 403 })
      }
    } else if (characterId) {
      const profile = await characterLockService.getCharacterProfile(characterId)
      
      if (!profile) {
        return NextResponse.json({ error: 'Character not found' }, { status: 404 })
      }
      
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', profile.projectId)
        .eq('user_id', user.id)
        .single()
      
      if (projectError || !project) {
        return NextResponse.json({ error: 'Unauthorized access to character' }, { status: 403 })
      }
    }
    
    const { data: sessions, error: sessionsError } = await query
    
    if (sessionsError) {
      console.error('Error fetching generation sessions:', sessionsError)
      return NextResponse.json({ 
        error: 'Failed to fetch generation sessions' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      sessions: sessions || []
    })
    
  } catch (error) {
    console.error('Error fetching generation history:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch generation history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}