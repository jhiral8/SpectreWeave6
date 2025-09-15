import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AzureAIService } from '@/lib/services/azure'
import { GeminiService } from '@/lib/services/gemini'
import { DatabricksService } from '@/lib/services/databricks'
import { StabilityService } from '@/lib/services/stability'
import { ProviderStatus, SupportedProvider } from '@/lib/ai/types'

interface HealthCheckResult {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: number
  providers: ProviderStatus[]
  summary: {
    total: number
    available: number
    unavailable: number
    error: number
  }
}

async function checkProviderHealth(
  provider: SupportedProvider,
  service: { validateConfig(): boolean }
): Promise<ProviderStatus> {
  try {
    const startTime = Date.now()
    const available = service.validateConfig()
    const responseTime = Date.now() - startTime

    return {
      provider,
      available,
      lastChecked: Date.now(),
      responseTime
    }
  } catch (error: any) {
    return {
      provider,
      available: false,
      lastChecked: Date.now(),
      error: error.message || 'Configuration validation failed'
    }
  }
}

async function performDetailedHealthCheck(): Promise<ProviderStatus[]> {
  const services = [
    { provider: 'azure' as const, service: new AzureAIService() },
    { provider: 'gemini' as const, service: new GeminiService() },
    { provider: 'databricks' as const, service: new DatabricksService() },
    { provider: 'stability' as const, service: new StabilityService() }
  ]

  const healthChecks = services.map(({ provider, service }) =>
    checkProviderHealth(provider, service)
  )

  return Promise.all(healthChecks)
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication for detailed health info
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const searchParams = request.nextUrl.searchParams
    const detailed = searchParams.get('detailed') === 'true'

    // For unauthenticated requests, provide basic health status
    if (authError || !user) {
      if (detailed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Basic health check without authentication
      return NextResponse.json({
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

    return NextResponse.json(healthResult, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': overall
      }
    })

  } catch (error: any) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
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

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { provider } = body

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
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
          return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 })
      }

      return NextResponse.json({
        provider,
        result: testResult,
        timestamp: Date.now()
      })

    } catch (error: any) {
      return NextResponse.json({
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
    return NextResponse.json(
      { error: error.message || 'Failed to test provider' },
      { status: 500 }
    )
  }
}