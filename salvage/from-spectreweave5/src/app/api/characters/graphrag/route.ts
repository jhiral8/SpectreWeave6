/**
 * Character GraphRAG Integration API
 * 
 * Integrates character profiles with Neo4j GraphRAG system for enhanced knowledge persistence
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const { action, characterId, projectId } = body
    
    switch (action) {
      case 'ingest_character':
        return await ingestCharacterToGraphRAG(req, characterId, projectId, user.id)
      
      case 'search_character_context':
        return await searchCharacterContext(req, body.query, projectId, user.id)
      
      case 'update_character_relationships':
        return await updateCharacterRelationships(req, characterId, body.relationships, user.id)
      
      case 'get_character_knowledge':
        return await getCharacterKnowledge(req, characterId, user.id)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Character GraphRAG API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

async function ingestCharacterToGraphRAG(
  req: NextRequest, 
  characterId: string, 
  projectId: string, 
  userId: string
): Promise<NextResponse> {
  try {
    const supabase = createClient()
    
    // Get character profile with full details
    const { data: character, error: characterError } = await supabase
      .from('character_profiles')
      .select(`
        *,
        character_appearances(*),
        character_turnarounds(*),
        character_consistency_rules(*)
      `)
      .eq('id', characterId)
      .single()
    
    if (characterError || !character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }
    
    // Verify user owns the character
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, title')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Unauthorized access to project' }, { status: 403 })
    }
    
    // Build character knowledge structure for GraphRAG ingestion
    const characterKnowledge = buildCharacterKnowledgeStructure(character, project)
    
    // Send to GraphRAG backend
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || 
      (cookieToken ? `Bearer ${cookieToken}` : 
      (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    
    const response = await fetch(`${BACKEND_ORIGIN}/api/graphrag/ingest-character`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        characterId,
        projectId,
        knowledge: characterKnowledge
      })
    })
    
    const result = await response.json()
    
    if (response.ok && result.nodeId) {
      // Update character profile with Neo4j node ID
      await supabase
        .from('character_profiles')
        .update({ 
          neo4j_node_id: result.nodeId,
          knowledge_graph_data: result.graphData || {}
        })
        .eq('id', characterId)
      
      return NextResponse.json({ 
        success: true, 
        nodeId: result.nodeId,
        message: `Character "${character.name}" ingested into GraphRAG` 
      })
    }
    
    return NextResponse.json({ 
      success: false, 
      error: result.error || 'GraphRAG ingestion failed' 
    }, { status: response.status })
    
  } catch (error) {
    console.error('Error ingesting character to GraphRAG:', error)
    return NextResponse.json({ 
      error: 'Failed to ingest character to GraphRAG' 
    }, { status: 500 })
  }
}

async function searchCharacterContext(
  req: NextRequest,
  query: string,
  projectId: string,
  userId: string
): Promise<NextResponse> {
  try {
    const supabase = createClient()
    
    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Unauthorized access to project' }, { status: 403 })
    }
    
    // Search GraphRAG for character-related context
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
      body: JSON.stringify({
        query: `character context: ${query}`,
        options: {
          frameworkId: projectId,
          limit: 20,
          includeTypes: ['character', 'relationship', 'trait', 'appearance']
        }
      })
    })
    
    const result = await response.json()
    
    return NextResponse.json({ 
      success: response.ok, 
      data: result.data || [],
      context: result.context || ''
    })
    
  } catch (error) {
    console.error('Error searching character context:', error)
    return NextResponse.json({ 
      error: 'Failed to search character context' 
    }, { status: 500 })
  }
}

async function updateCharacterRelationships(
  req: NextRequest,
  characterId: string,
  relationships: any[],
  userId: string
): Promise<NextResponse> {
  try {
    const supabase = createClient()
    
    // Get character and verify ownership
    const { data: character, error: characterError } = await supabase
      .from('character_profiles')
      .select('project_id, neo4j_node_id, name')
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
      .eq('user_id', userId)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Unauthorized access to character' }, { status: 403 })
    }
    
    if (!character.neo4j_node_id) {
      return NextResponse.json({ 
        error: 'Character not ingested into GraphRAG. Please ingest first.' 
      }, { status: 400 })
    }
    
    // Update relationships in Neo4j
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || 
      (cookieToken ? `Bearer ${cookieToken}` : 
      (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    
    const response = await fetch(`${BACKEND_ORIGIN}/api/graphrag/update-relationships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        nodeId: character.neo4j_node_id,
        characterName: character.name,
        relationships
      })
    })
    
    const result = await response.json()
    
    return NextResponse.json({ 
      success: response.ok, 
      data: result,
      message: response.ok ? 'Character relationships updated' : result.error
    })
    
  } catch (error) {
    console.error('Error updating character relationships:', error)
    return NextResponse.json({ 
      error: 'Failed to update character relationships' 
    }, { status: 500 })
  }
}

async function getCharacterKnowledge(
  req: NextRequest,
  characterId: string,
  userId: string
): Promise<NextResponse> {
  try {
    const supabase = createClient()
    
    // Get character and verify ownership
    const { data: character, error: characterError } = await supabase
      .from('character_profiles')
      .select('project_id, neo4j_node_id, knowledge_graph_data, name')
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
      .eq('user_id', userId)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Unauthorized access to character' }, { status: 403 })
    }
    
    if (!character.neo4j_node_id) {
      return NextResponse.json({ 
        knowledge: character.knowledge_graph_data || {},
        inGraphRAG: false,
        message: 'Character not yet ingested into GraphRAG'
      })
    }
    
    // Get knowledge from Neo4j
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || 
      (cookieToken ? `Bearer ${cookieToken}` : 
      (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    
    const response = await fetch(`${BACKEND_ORIGIN}/api/graphrag/character-knowledge/${character.neo4j_node_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      }
    })
    
    const result = await response.json()
    
    return NextResponse.json({ 
      success: response.ok,
      knowledge: result.knowledge || character.knowledge_graph_data || {},
      relationships: result.relationships || [],
      inGraphRAG: true
    })
    
  } catch (error) {
    console.error('Error getting character knowledge:', error)
    return NextResponse.json({ 
      error: 'Failed to get character knowledge' 
    }, { status: 500 })
  }
}

function buildCharacterKnowledgeStructure(character: any, project: any) {
  const knowledge = {
    id: character.id,
    type: 'character',
    name: character.name,
    description: character.description,
    role: character.role,
    project: {
      id: project.id,
      title: project.title
    },
    physicalTraits: character.physical_traits || {},
    personalityTraits: character.personality_traits || {},
    appearances: (character.character_appearances || []).map((app: any) => ({
      id: app.id,
      imageUrl: app.image_url,
      consistencyScore: app.consistency_score,
      validated: app.validated,
      createdAt: app.created_at
    })),
    turnarounds: (character.character_turnarounds || []).map((turn: any) => ({
      id: turn.id,
      illustrationStyle: turn.illustration_style,
      views: {
        front: turn.front_view_url,
        side: turn.side_view_url,
        back: turn.back_view_url,
        threeQuarter: turn.three_quarter_view_url
      }
    })),
    consistencyRules: (character.character_consistency_rules || []).map((rule: any) => ({
      id: rule.id,
      type: rule.rule_type,
      config: rule.rule_config,
      weight: rule.weight,
      isActive: rule.is_active
    })),
    metrics: {
      consistencyScore: character.consistency_score || 0,
      totalGenerations: character.total_generations || 0,
      consistentGenerations: character.consistent_generations || 0
    },
    metadata: {
      createdAt: character.created_at,
      updatedAt: character.updated_at
    }
  }
  
  return knowledge
}