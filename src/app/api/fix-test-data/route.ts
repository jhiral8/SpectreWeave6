import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const testProjectId = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'
    const testUserId = 'ec2f2655-9302-47e3-b447-1b7576bfaed7'
    
    // Insert test project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .upsert({
        id: testProjectId,
        title: 'Test Magical Forest Book',
        description: 'A test children\'s book for debugging the Complete Book functionality',
        user_id: testUserId,
        project_type: 'childrens-book',
        author_style: 'dr-seuss',
        book_theme: 'magical-forest',
        illustration_style: 'watercolor',
        target_age: '3-5',
        total_pages: 6,
        book_metadata: {
          main_character: 'Luna the Little Fox',
          setting: 'Enchanted Forest',
          conflict: 'Finding her way home',
          moral_lesson: 'Believing in yourself',
          created_via: 'book-creator',
          ai_generated: true,
          include_video: false,
          include_audio: false
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    // Insert test book for compatibility
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .upsert({
        id: testProjectId,
        title: 'Test Magical Forest Book',
        author: 'Test Author',
        target_age: '3-5',
        theme: 'magical-forest',
        style: 'watercolor',
        author_style: 'dr-seuss',
        total_pages: 6,
        is_public: false,
        user_id: testUserId,
        project_id: testProjectId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (projectError || bookError) {
      return NextResponse.json({
        success: false,
        projectError: projectError?.message,
        bookError: bookError?.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      projectData,
      bookData
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}