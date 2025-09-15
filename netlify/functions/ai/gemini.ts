import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { createClient } from '../../../src/lib/supabase/server'
import { GeminiService } from '../../../src/lib/services/gemini'
import { AIServiceError } from '../../../src/lib/ai/types'
import { 

export const handler = createNetlifyHandler({

  POST: async (request: Request) => {
    
  // Apply rate limiting
  const rateLimitResponse = await textGenerationRateLimit(request, async () => {
    return await dailyRateLimit(request, async () => {
      return NextResponse.next()
    })
  })

  // If rate limit exceeded, return the rate limit response
  if (rateLimitResponse.status === 429) {
    return rateLimitResponse
  }
  try {
    // Check authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      action, 
      prompt, 
      imageData,
      maxTokens, 
      temperature,
      stream = false 
    } = body

    // Validate request
    if (!action) {
      return jsonResponse({ error: 'Action is required' }, { status: 400 })
    }

    if (!prompt) {
      return jsonResponse({ error: 'Prompt is required' }, { status: 400 })
    }

    const geminiService = new GeminiService()

    switch (action) {
      case 'generate': {
        if (stream) {
          // Apply additional streaming rate limit
          const streamRateLimitResponse = await streamingRateLimit(request, async () => {
            return NextResponse.next()
          })
          
          if (streamRateLimitResponse.status === 429) {
            return streamRateLimitResponse
          }

          const streamResponse = await geminiService.streamText({
            prompt,
            options: { maxTokens, temperature }
          })

          return new NextResponse(streamResponse.stream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Transfer-Encoding': 'chunked',
              'X-Request-ID': streamResponse.requestId || '',
              'X-Provider': 'gemini'
            },
          })
        } else {
          const result = await geminiService.generateText({
            prompt,
            options: { maxTokens, temperature }
          })

          return jsonResponse(result)
        }
      }

      case 'analyze-image': {
        if (!imageData) {
          return jsonResponse({ error: 'Image data is required for image analysis' }, { status: 400 })
        }

        const result = await geminiService.analyzeImage({
          imageData,
          prompt
        })

        return jsonResponse(result)
      }

      case 'chat': {
        // For chat, we'll convert to a simple prompt for Gemini
        const result = await geminiService.generateText({
          prompt,
          options: { maxTokens, temperature }
        })

        return jsonResponse(result)
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Gemini AI API error:', error)

    if (error instanceof AIServiceError) {
      const statusCode = error.retryable ? 503 : 500
      return jsonResponse(
        { 
          error: error.message,
          code: error.code,
          provider: error.provider,
          retryable: error.retryable
        },
        { status: statusCode }
      )
    }

    return jsonResponse(
      { error: error.message || 'Failed to process Gemini AI request' },
      { status: 500 }
    )
  }
}
  },

  GET: async (request: Request) => {
    
  try {
    // Check authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    // Health check for Gemini service
    const geminiService = new GeminiService()
    const isValid = geminiService.validateConfig()

    return jsonResponse({
      provider: 'gemini',
      status: isValid ? 'available' : 'unavailable',
      timestamp: Date.now()
    })

  } catch (error: any) {
    console.error('Gemini health check error:', error)
    return jsonResponse(
      { 
        provider: 'gemini',
        status: 'error',
        error: error.message,
        timestamp: Date.now()
      },
      { status: 500 }
    )
  }

  }
})