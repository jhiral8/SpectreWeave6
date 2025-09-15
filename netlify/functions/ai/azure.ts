import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { createClient } from '../../../src/lib/supabase/server'
import { AzureAIService } from '../../../src/lib/services/azure'
import { AIServiceError } from '../../../src/lib/ai/types'

export const handler = createNetlifyHandler({

  POST: async (request: Request) => {
    
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
      messages, 
      maxTokens, 
      temperature,
      stream = false 
    } = body

    // Validate request
    if (!action) {
      return jsonResponse({ error: 'Action is required' }, { status: 400 })
    }

    if (!prompt && !messages) {
      return jsonResponse({ error: 'Either prompt or messages is required' }, { status: 400 })
    }

    const azureService = new AzureAIService()

    switch (action) {
      case 'generate': {
        if (!prompt) {
          return jsonResponse({ error: 'Prompt is required for generation' }, { status: 400 })
        }

        if (stream) {
          const streamResponse = await azureService.streamText({
            prompt,
            options: { maxTokens, temperature }
          })

          return new NextResponse(streamResponse.stream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Transfer-Encoding': 'chunked',
              'X-Request-ID': streamResponse.requestId || '',
              'X-Provider': 'azure'
            },
          })
        } else {
          const result = await azureService.generateText({
            prompt,
            options: { maxTokens, temperature }
          })

          return jsonResponse(result)
        }
      }

      case 'chat': {
        if (!messages || !Array.isArray(messages)) {
          return jsonResponse({ error: 'Messages array is required for chat completion' }, { status: 400 })
        }

        const result = await azureService.getChatCompletion({
          messages,
          options: { maxTokens, temperature }
        })

        return jsonResponse(result)
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Azure AI API error:', error)

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
      { error: error.message || 'Failed to process Azure AI request' },
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

    // Health check for Azure AI service
    const azureService = new AzureAIService()
    const isValid = azureService.validateConfig()

    return jsonResponse({
      provider: 'azure',
      status: isValid ? 'available' : 'unavailable',
      timestamp: Date.now()
    })

  } catch (error: any) {
    console.error('Azure AI health check error:', error)
    return jsonResponse(
      { 
        provider: 'azure',
        status: 'error',
        error: error.message,
        timestamp: Date.now()
      },
      { status: 500 }
    )
  }

  }
})