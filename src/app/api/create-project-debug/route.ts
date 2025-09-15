// Debug route to manually create the project
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json()
    
    if (!projectId) {
      return new Response(JSON.stringify({ error: 'projectId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Authentication failed',
        details: authError
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Try to create the project
    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        id: projectId,
        title: 'Untitled Document',
        user_id: user.id,
        status: 'draft',
        archived: false,
      })
      .select()
      .single()
    
    if (insertError) {
      return new Response(JSON.stringify({ 
        error: 'Failed to create project',
        details: insertError,
        userId: user.id
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      project,
      user: { id: user.id, email: user.email }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Internal error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}