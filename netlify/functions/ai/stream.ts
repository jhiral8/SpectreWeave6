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
    const { prompt, provider = 'gemini' } = body

    if (!prompt) {
      return jsonResponse({ error: 'Prompt is required' }, { status: 400 })
    }

    const stream = await aiService.streamText({ prompt, provider })

    if (!stream) {
      throw new Error('Failed to create stream')
    }

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error: any) {
    console.error('AI stream error:', error)
    return jsonResponse(
      { error: error.message || 'Failed to stream text' },
      { status: 500 }
    )
  }

  }
})