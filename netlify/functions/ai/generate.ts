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
    const { prompt, provider = 'gemini', maxTokens, temperature } = body

    if (!prompt) {
      return jsonResponse({ error: 'Prompt is required' }, { status: 400 })
    }

    const result = await aiService.generateText({
      prompt,
      provider,
      maxTokens,
      temperature,
    })

    return jsonResponse({ result })
  } catch (error: any) {
    console.error('AI generation error:', error)
    return jsonResponse(
      { error: error.message || 'Failed to generate text' },
      { status: 500 }
    )
  }

  }
})