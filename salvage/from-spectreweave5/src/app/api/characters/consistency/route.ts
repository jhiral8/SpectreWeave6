/**
 * Character Consistency API Endpoints
 * 
 * Handles character consistency validation and tracking
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
      imageUrl,
      expectedFeatures
    } = body
    
    if (!characterId || !imageUrl) {
      return NextResponse.json({ 
        error: 'Character ID and image URL are required' 
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
    
    // Validate character consistency
    const validation = await characterLockService.validateCharacterConsistency(
      characterId,
      imageUrl,
      expectedFeatures
    )
    
    return NextResponse.json({ 
      success: true, 
      ...validation
    })
    
  } catch (error) {
    console.error('Error validating character consistency:', error)
    return NextResponse.json({ 
      error: 'Failed to validate character consistency',
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
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
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
    
    // Get consistency history
    const { data: consistencyHistory, error: consistencyError } = await supabase
      .from('character_consistency')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (consistencyError) {
      console.error('Error fetching consistency history:', consistencyError)
      return NextResponse.json({ 
        error: 'Failed to fetch consistency history' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      consistencyHistory: consistencyHistory || []
    })
    
  } catch (error) {
    console.error('Error fetching character consistency:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch character consistency',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}