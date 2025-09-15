import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { GeminiService } from '../../../src/lib/services/gemini'
import { AIServiceError } from '../../../src/lib/ai/types'

export const handler = createNetlifyHandler({

  POST: async (request: Request) => {
    
  try {
    const body = await request.json()
    const { action, prompt, maxTokens = 500, temperature = 0.7, stream = false } = body

    if (!prompt) {
      return jsonResponse(
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
        return jsonResponse(
          { error: 'Invalid action. Use "generate" or "chat"' },
          { status: 400 }
        )
    }

    return jsonResponse(response)

  } catch (error: any) {
    console.error('Demo AI API error:', error)

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
      { error: error.message || 'Failed to process demo AI request' },
      { status: 500 }
    )
  }
}
  },

  GET: async (request: Request) => {
    
  try {
    // Health check for demo Gemini service
    const geminiService = new GeminiService()
    const isValid = geminiService.validateConfig()

    return jsonResponse({
      provider: 'gemini-demo',
      status: isValid ? 'available' : 'unavailable',
      demo: true,
      timestamp: Date.now()
    })

  } catch (error: any) {
    console.error('Demo Gemini health check error:', error)
    return jsonResponse(
      { error: 'Demo AI service health check failed' },
      { status: 500 }
    )
  }

  }
})