import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OpenRouterService } from '@/lib/services/openrouter'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prompt, provider = 'openrouter', maxTokens, temperature, model } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Use OpenRouter service directly for reliability
    // Pass model if specified, otherwise use default
    const openrouter = new OpenRouterService(model ? { model } : undefined)
    const result = await openrouter.generateText({
      id: Math.random().toString(36).substring(7),
      type: 'generation',
      prompt,
      timestamp: new Date(),
      options: { maxTokens, temperature }
    })

    return NextResponse.json({ 
      data: result.content,
      content: result.content,
      model: result.model,
      usage: result.usage,
      success: true
    })
  } catch (error: any) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate text' },
      { status: 500 }
    )
  }
}