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
    const { prompt, provider = 'stability', width, height, steps } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const result = await aiService.generateImage({
      prompt,
      provider,
      width,
      height,
      steps,
    })

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('AI image generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    )
  }
}