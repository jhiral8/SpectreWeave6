import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { createClient } from '../../../src/lib/supabase/server'
import { aiService } from '../../../src/lib/services/ai'

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
    const { messages, provider = 'databricks' } = body

    if (!messages || !Array.isArray(messages)) {
      return jsonResponse({ error: 'Messages array is required' }, { status: 400 })
    }

    const chatRequest = {
      messages,
      provider,
      options: {
        maxTokens: 1000,
        temperature: 0.7
      }
    }

    const result = await aiService.getChatCompletion(chatRequest)

    return jsonResponse({ result })
  } catch (error: any) {
    console.error('AI chat completion error:', error)
    return jsonResponse(
      { error: error.message || 'Failed to complete chat' },
      { status: 500 }
    )
  }

  }
})