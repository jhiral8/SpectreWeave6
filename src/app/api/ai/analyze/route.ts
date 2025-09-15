import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiService } from '@/lib/services/ai'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imageData, prompt } = body

    if (!imageData || !prompt) {
      return NextResponse.json({ error: 'Image data and prompt are required' }, { status: 400 })
    }

    const result = await aiService.analyzeImage(imageData, prompt)

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('AI image analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image' },
      { status: 500 }
    )
  }
}