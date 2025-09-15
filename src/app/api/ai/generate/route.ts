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
    const { prompt, provider = 'gemini', maxTokens, temperature } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const result = await aiService.generateText({
      prompt,
      provider,
      maxTokens,
      temperature,
    })

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate text' },
      { status: 500 }
    )
  }
}