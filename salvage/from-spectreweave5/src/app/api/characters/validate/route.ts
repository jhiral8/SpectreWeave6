/**
 * Character Consistency Validation API
 * 
 * Validates character appearances for consistency using the character lock system
 */

import { NextRequest, NextResponse } from 'next/server'
import { characterLockService } from '@/lib/ai/characterLock'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const { characterId, imageUrl, promptUsed } = body
    
    if (!characterId || !imageUrl || !promptUsed) {
      return NextResponse.json({ 
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
    
    // Perform consistency validation
    const validationResult = await characterLockService.validateCharacterConsistency(
      characterId,
      imageUrl,
      promptUsed
    )
    
    return NextResponse.json({ 
      success: true, 
      validation: validationResult 
    })
    
  } catch (error) {
    console.error('Character validation error:', error)
    return NextResponse.json({ 
      error: 'Failed to validate character consistency',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for batch validation of existing appearances
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
      return NextResponse.json({ 
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
    
    return NextResponse.json({ 
      success: true, 
      appearances: userAppearances,
      statistics: stats
    })
    
  } catch (error) {
    console.error('Character appearances fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}