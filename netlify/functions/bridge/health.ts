import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { createClient } from '../../../src/lib/supabase/server'

export const handler = createNetlifyHandler({

  GET: async (request: Request) => {
    export async function GET(_req: Request) {
  try {
    // Test Supabase connection
    const supabase = createClient()
    const { data, error } = await supabase.from('projects').select('count').limit(1)
    
    if (error) {
      console.error('Health check failed:', error.message)
      return jsonResponse({ 
        status: 'unhealthy', 
        error: 'Database connection failed',
        details: error.message 
      }, { status: 503 })
    }
    
    return jsonResponse({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'operational'
      }
    }, { status: 200 })
  } catch (e: any) {
    console.error('Health check error:', e)
    return jsonResponse({ 
      status: 'unhealthy',
      error: e?.message || 'Internal server error'
    }, { status: 503 })
  }
}
  }
})