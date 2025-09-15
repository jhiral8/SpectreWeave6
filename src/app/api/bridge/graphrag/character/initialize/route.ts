/**
 * GraphRAG Character Initialization Endpoint
 * 
 * Initializes a character in the knowledge graph
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { characterId, profile } = body
    
    if (!characterId || !profile) {
      return NextResponse.json({ 
        error: 'Character ID and profile are required' 
      }, { status: 400 })
    }
    
    // Build character data for GraphRAG
    const characterData = {
      id: characterId,
      name: profile.name,
      description: profile.description,
      visualDescription: profile.visualDescription,
      role: profile.role,
      personality: profile.personality,
      projectId: profile.projectId,
      entity_type: 'CHARACTER',
      attributes: {
        role: profile.role,
        personality_traits: profile.personality || [],
        visual_description: profile.visualDescription,
        character_type: 'children_book_character'
      }
    }
    
    // Forward to backend GraphRAG service
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || 
                      (cookieToken ? `Bearer ${cookieToken}` : 
                      (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    
    const response = await fetch(`${BACKEND_ORIGIN}/api/graphrag/entities/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        entity: characterData,
        entity_type: 'CHARACTER'
      }),
    })
    
    const payload = await response.json().catch(() => ({}))
    
    return NextResponse.json({
      success: response.ok,
      characterId,
      graphData: payload,
      message: response.ok ? 'Character initialized in knowledge graph' : 'Failed to initialize character'
    }, { status: response.status })
    
  } catch (error) {
    console.error('Character initialization error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Character GraphRAG initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}