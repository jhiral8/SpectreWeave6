import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StabilityService } from '@/lib/services/stability'
import { AIServiceError } from '@/lib/ai/types'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
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

        return NextResponse.json(result)
      }

      case 'edit-image': {
        if (!imageData) {
          return NextResponse.json({ error: 'Image data is required for image editing' }, { status: 400 })
        }

        const result = await stabilityService.editImage({
          imageData,
          prompt,
          options: { strength, steps }
        })

        return NextResponse.json(result)
      }

      case 'analyze-image': {
        // Stability AI doesn't support image analysis
        return NextResponse.json({ 
          error: 'Image analysis is not supported by Stability AI. Use Gemini instead.' 
        }, { status: 400 })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Stability AI API error:', error)

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
      { error: error.message || 'Failed to process Stability AI request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Health check for Stability service
    const stabilityService = new StabilityService()
    const isValid = stabilityService.validateConfig()

    return NextResponse.json({
      provider: 'stability',
      status: isValid ? 'available' : 'unavailable',
      timestamp: Date.now(),
      capabilities: ['generate-image', 'edit-image']
    })

  } catch (error: any) {
    console.error('Stability health check error:', error)
    return NextResponse.json(
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