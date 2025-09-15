import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { createClient } from '../../../src/lib/supabase/server'
import { AzureAIService } from '../../../src/lib/services/azure'
import { GeminiService } from '../../../src/lib/services/gemini'
import { DatabricksService } from '../../../src/lib/services/databricks'
import { StabilityService } from '../../../src/lib/services/stability'
import { ProviderStatus, SupportedProvider } from '../../../src/lib/ai/types'

export const handler = createNetlifyHandler({

  GET: async (request: Request) => {
    
  try {
    // Check authentication for detailed health info
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const searchParams = request.nextUrl.searchParams
    const detailed = searchParams.get('detailed') === 'true'

    // For unauthenticated requests, provide basic health status
    if (authError || !user) {
      if (detailed) {
        return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
      }

      // Basic health check without authentication
      return jsonResponse({
        status: 'ok',
        timestamp: Date.now(),
        message: 'AI services are operational'
      })
    }

    // Perform detailed health check
    const providerStatuses = await performDetailedHealthCheck()
    
    // Calculate summary statistics
    const summary = {
      total: providerStatuses.length,
      available: providerStatuses.filter(p => p.available).length,
      unavailable: providerStatuses.filter(p => !p.available && !p.error).length,
      error: providerStatuses.filter(p => p.error).length
    }

    // Determine overall health status
    let overall: 'healthy' | 'degraded' | 'unhealthy'
    if (summary.available === summary.total) {
      overall = 'healthy'
    } else if (summary.available > 0) {
      overall = 'degraded'
    } else {
      overall = 'unhealthy'
    }

    const healthResult: HealthCheckResult = {
      overall,
      timestamp: Date.now(),
      providers: providerStatuses,
      summary
    }

    // Set appropriate status code based on health
    const statusCode = overall === 'healthy' ? 200 : overall === 'degraded' ? 206 : 503

    return jsonResponse(healthResult, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': overall
      }
    })

  } catch (error: any) {
    console.error('Health check error:', error)
    
    return jsonResponse({
      overall: 'unhealthy',
      timestamp: Date.now(),
      error: 'Failed to perform health check',
      details: error.message
    }, { 
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy'
      }
    })
  }
}
  },

  POST: async (request: Request) => {
    
  try {
    // Check authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { provider } = body

    if (!provider) {
      return jsonResponse({ error: 'Provider is required' }, { status: 400 })
    }

    // Test specific provider with a lightweight request
    let testResult: ProviderStatus

    try {
      switch (provider) {
        case 'azure': {
          const service = new AzureAIService()
          testResult = await checkProviderHealth('azure', service)
          break
        }
        case 'gemini': {
          const service = new GeminiService()
          testResult = await checkProviderHealth('gemini', service)
          break
        }
        case 'databricks': {
          const service = new DatabricksService()
          testResult = await checkProviderHealth('databricks', service)
          break
        }
        case 'stability': {
          const service = new StabilityService()
          testResult = await checkProviderHealth('stability', service)
          break
        }
        default:
          return jsonResponse({ error: `Unsupported provider: ${provider}` }, { status: 400 })
      }

      return jsonResponse({
        provider,
        result: testResult,
        timestamp: Date.now()
      })

    } catch (error: any) {
      return jsonResponse({
        provider,
        result: {
          provider,
          available: false,
          lastChecked: Date.now(),
          error: error.message
        },
        timestamp: Date.now()
      }, { status: 503 })
    }

  } catch (error: any) {
    console.error('Provider test error:', error)
    return jsonResponse(
      { error: error.message || 'Failed to test provider' },
      { status: 500 }
    )
  }

  }
})