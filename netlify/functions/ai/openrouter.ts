import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse } from '../_utils'
import { createClient } from '../../../src/lib/supabase/server'
import { OpenRouterService } from '../../../src/lib/services/openrouter'
import { AIServiceError } from '../../../src/lib/ai/types'

export const handler = createNetlifyHandler({
  POST: async (request: Request) => {
    try {
      // Check authentication
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return jsonResponse({ error: 'Unauthorized' }, 401)
      }

      const body = await getJsonBody(request)
      const { 
        action, 
        prompt, 
        maxTokens, 
        temperature,
        stream = false 
      } = body

      // Validate request
      if (!action) {
        return jsonResponse({ error: 'Action is required' }, 400)
      }

      if (!prompt) {
        return jsonResponse({ error: 'Prompt is required' }, 400)
      }

      const openRouterService = new OpenRouterService()

      switch (action) {
        case 'generate': {
          if (stream) {
            const streamResponse = await openRouterService.streamText({
              id: Math.random().toString(36).substring(7),
              type: 'generation',
              prompt,
              timestamp: new Date(),
              options: { maxTokens, temperature }
            })

            return new Response(streamResponse.stream, {
              headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'X-Request-ID': streamResponse.requestId || '',
                'X-Provider': 'openrouter'
              },
            })
          } else {
            const result = await openRouterService.generateText({
              id: Math.random().toString(36).substring(7),
              type: 'generation',
              prompt,
              timestamp: new Date(),
              options: { maxTokens, temperature }
            })

            return jsonResponse(result)
          }
        }

        default:
          return jsonResponse({ error: `Unsupported action: ${action}` }, 400)
      }
    } catch (error) {
      console.error('OpenRouter function error:', error)
      
      if (error instanceof AIServiceError) {
        return jsonResponse({ 
          error: error.message,
          code: error.code,
          provider: error.provider
        }, 500)
      }

      return jsonResponse({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500)
    }
  }
})
