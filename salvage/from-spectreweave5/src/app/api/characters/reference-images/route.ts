/**
 * Character Reference Images API Endpoints
 * 
 * Handles generation and management of character reference images
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { characterLockService } from '@/lib/ai/characterLock'

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
      visualDescription,
      imageTypes = ['front_view', 'side_view', 'full_body'],
      regenerate = false
    } = body
    
    if (!characterId) {
      return NextResponse.json({ 
        error: 'Character ID is required' 
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
    
    // Generate reference images
    const referenceImages = await characterLockService.generateReferenceImages(
      characterId,
      visualDescription || profile.visualDescription,
      imageTypes
    )
    
    return NextResponse.json({ 
      success: true, 
      referenceImages
    })
    
  } catch (error) {
    console.error('Error generating reference images:', error)
    return NextResponse.json({ 
      error: 'Failed to generate reference images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

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
      return NextResponse.json({ error: 'Character ID is required' }, { status: 400 })
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
    
    return NextResponse.json({ 
      success: true, 
      referenceImages: profile.referenceImages
    })
    
  } catch (error) {
    console.error('Error fetching reference images:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch reference images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}