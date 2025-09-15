import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { createClient } from '../../../src/lib/supabase/server'
import { StabilityService } from '../../../src/lib/services/stability'
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
      imageData,
      width,
      height,
      steps,
      seed,
      cfgScale,
      samples,
      strength
    } = body

    // Validate request
    if (!action) {
      return jsonResponse({ error: 'Action is required' }, { status: 400 })
    }

    if (!prompt) {
      return jsonResponse({ error: 'Prompt is required' }, { status: 400 })
    }

    const stabilityService = new StabilityService()

    switch (action) {
      case 'generate-image': {
        const result = await stabilityService.generateImage({
          prompt,
          options: { 
            width, 
            height, 
            steps, 
            seed, 
            cfgScale, 
            samples 
          }
        })

        return jsonResponse(result)
      }

      case 'edit-image': {
        if (!imageData) {
          return jsonResponse({ error: 'Image data is required for image editing' }, { status: 400 })
        }

        const result = await stabilityService.editImage({
          imageData,
          prompt,
          options: { strength, steps }
        })

        return jsonResponse(result)
      }

      case 'analyze-image': {
        // Stability AI doesn't support image analysis
        return jsonResponse({ 
          error: 'Image analysis is not supported by Stability AI. Use Gemini instead.' 
        }, { status: 400 })
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Stability AI API error:', error)

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
      { error: error.message || 'Failed to process Stability AI request' },
      { status: 500 }
    )
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

    // Health check for Stability service
    const stabilityService = new StabilityService()
    const isValid = stabilityService.validateConfig()

    return jsonResponse({
      provider: 'stability',
      status: isValid ? 'available' : 'unavailable',
      timestamp: Date.now(),
      capabilities: ['generate-image', 'edit-image']
    })

  } catch (error: any) {
    console.error('Stability health check error:', error)
    return jsonResponse(
      { 
        provider: 'stability',
        status: 'error',
        error: error.message,
        timestamp: Date.now()
      },
      { status: 500 }
    )
  }

  }
})