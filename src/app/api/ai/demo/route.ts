import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/lib/services/gemini'
import { AIServiceError } from '@/lib/ai/types'

// Demo endpoint that doesn't require authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, prompt, maxTokens = 500, temperature = 0.7, stream = false } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const geminiService = new GeminiService()
    
    let response
    switch (action) {
      case 'generate':
        response = await geminiService.generateText({
          id: `demo-${Date.now()}`,
          prompt,
          options: {
            provider: 'gemini',
            maxTokens,
            temperature,
            stream
          }
        })
        break
      
      case 'chat':
        // For demo, treat chat as generate
        response = await geminiService.generateText({
          id: `demo-chat-${Date.now()}`,
          prompt,
          options: {
            provider: 'gemini',
            maxTokens,
            temperature,
            stream
          }
        })
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "generate" or "chat"' },
          { status: 400 }
        )
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Demo AI API error:', error)

    if (error instanceof AIServiceError) {
      const statusCode = error.retryable ? 503 : 500
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          provider: error.provider,
          retryable: error.retryable
        },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process demo AI request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check for demo Gemini service
    const geminiService = new GeminiService()
    const isValid = geminiService.validateConfig()

    return NextResponse.json({
      provider: 'gemini-demo',
      status: isValid ? 'available' : 'unavailable',
      demo: true,
      timestamp: Date.now()
    })

  } catch (error: any) {
    console.error('Demo Gemini health check error:', error)
    return NextResponse.json(
      { error: 'Demo AI service health check failed' },
      { status: 500 }
    )
  }
}