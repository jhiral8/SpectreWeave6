import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
  }

  try {
    const supabase = createClient()
    
    // Get the user (this should work since we know user is authenticated in the client)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        details: userError?.message 
      }, { status: 401 })
    }

    // Try the exact same query that's failing in the client
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        description,
        user_id,
        project_type,
        author_style,
        book_theme,
        illustration_style,
        target_age,
        total_pages,
        book_metadata,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (projectError) {
      return NextResponse.json({
        error: 'Database error',
        details: projectError.message,
        code: projectError.code,
        hint: projectError.hint
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      project: projectData
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Server error',
      details: error.message
    }, { status: 500 })
  }
}