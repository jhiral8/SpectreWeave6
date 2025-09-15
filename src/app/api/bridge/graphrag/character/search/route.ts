/**
 * GraphRAG Character Search Endpoint
 * 
 * Searches character knowledge graph
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { characterId, query, searchType = 'semantic' } = body
    
    if (!characterId || !query) {
      return NextResponse.json({ 
        error: 'Character ID and search query are required' 
      }, { status: 400 })
    }
    
    // Build search parameters for character-specific knowledge
    const searchParams = {
      query,
      filters: {
        entity_type: 'CHARACTER',
        character_id: characterId
      },
      search_type: searchType,
      include_relationships: true,
      include_context: true,
      max_results: 10
    }
    
    // Forward to backend GraphRAG service
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || 
                      (cookieToken ? `Bearer ${cookieToken}` : 
                      (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    
    const response = await fetch(`${BACKEND_ORIGIN}/api/graphrag/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(searchParams),
    })
    
    const payload = await response.json().catch(() => ({}))
    
    // Process and format results for character context
    const formattedResults = {
      ...payload,
      characterId,
      searchQuery: query,
      searchType,
      results: payload.results?.map((result: any) => ({
        ...result,
        relevance_score: result.score || result.relevance_score,
        character_context: result.character_id === characterId
      })) || []
    }
    
    return NextResponse.json(formattedResults, { status: response.status })
    
  } catch (error) {
    console.error('Character search error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Character knowledge search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}