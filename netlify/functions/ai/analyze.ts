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
    const { imageData, prompt } = body

    if (!imageData || !prompt) {
      return jsonResponse({ error: 'Image data and prompt are required' }, { status: 400 })
    }

    const result = await aiService.analyzeImage(imageData, prompt)

    return jsonResponse({ result })
  } catch (error: any) {
    console.error('AI image analysis error:', error)
    return jsonResponse(
      { error: error.message || 'Failed to analyze image' },
      { status: 500 }
    )
  }

  }
})