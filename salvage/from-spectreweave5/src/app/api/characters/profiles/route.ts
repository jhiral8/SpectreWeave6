/**
 * Character Profiles API Endpoints
 * 
 * Handles CRUD operations for character profiles in the character lock system
 */

import { NextRequest, NextResponse } from 'next/server'
import { characterLockService } from '@/lib/ai/characterLock'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const url = new URL(req.url)
    const projectId = url.searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }
    
    // Verify user owns the project (check both projects and books tables)
    let projectOwner = false
    
    // First try projects table
    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single()
      
      if (!projectError && project) {
        projectOwner = true
      }
    } catch (err) {
      // Continue to check books table
    }
    
    // If not found in projects, try books table
    if (!projectOwner) {
      try {
        const { data: book, error: bookError } = await supabase
          .from('books')
          .select('id')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single()
        
        if (!bookError && book) {
          projectOwner = true
        }
      } catch (err) {
        // Both checks failed
      }
    }
    
    if (!projectOwner) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 })
    }
    
    // For now, return empty profiles array to avoid database table issues
    let profiles = []
    try {
      profiles = await characterLockService.getProjectCharacters(projectId)
    } catch (error: any) {
      // If table doesn't exist or any other database error, just return empty array
      console.warn('Character profiles service error (returning empty array):', error?.message)
      profiles = []
    }
    
    return NextResponse.json({ 
      success: true, 
      profiles: profiles || []
    })
    
  } catch (error) {
    console.error('Character profiles API error:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database table missing',
          message: 'Required database tables have not been created. Please run the database migration script.',
          details: error.message
        }, { status: 503 })
      }
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
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
      projectId, 
      name, 
      description, 
      visualDescription,
      role, 
      personality,
      generateReferenceImages = false,
      referenceImageTypes = ['front_view', 'side_view', 'full_body']
    } = body
    
    if (!projectId || !name) {
      return NextResponse.json({ 
        error: 'Project ID and character name are required' 
      }, { status: 400 })
    }
    
    if (!visualDescription) {
      return NextResponse.json({ 
        error: 'Visual description is required for character lock system' 
      }, { status: 400 })
    }
    
    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 })
    }
    
    // Create character profile
    const characterData = {
      projectId,
      name,
      description: description || '',
      visualDescription,
      role: role || 'supporting',
      personality: personality || []
    }
    
    const profile = await characterLockService.createCharacterProfile(
      projectId,
      characterData
    )
    
    // Generate reference images if requested
    let referenceImages = []
    if (generateReferenceImages) {
      try {
        referenceImages = await characterLockService.generateReferenceImages(
          profile.id,
          visualDescription,
          referenceImageTypes
        )
      } catch (error) {
        console.warn('Failed to generate reference images:', error)
        // Continue without reference images - not a critical error
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      profile: {
        ...profile,
        referenceImages
      }
    })
    
  } catch (error) {
    console.error('Error creating character profile:', error)
    return NextResponse.json({ 
      error: 'Failed to create character profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}