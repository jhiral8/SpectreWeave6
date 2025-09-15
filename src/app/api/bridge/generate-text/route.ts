import { NextRequest, NextResponse } from 'next/server'
import { resilientAIService } from '@/lib/ai/resilientAIService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Basic validation
    if (!body.prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Use resilientAIService for the actual generation
    const result = await resilientAIService.generateText({
      prompt: body.prompt,
      provider: body.provider || 'gemini',
      model: body.model || 'gemini-1.5-flash', // Use cheaper model for ghost completion
      options: {
        maxTokens: body.options?.maxTokens || 120,
        temperature: body.options?.temperature || 0.6,
        ...body.options
      }
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI generation failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      usage: result.usage,
      provider: result.provider
    })

  } catch (error: any) {
    console.error('Generate text error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}