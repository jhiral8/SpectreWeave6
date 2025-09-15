import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    // Test Supabase connection
    const supabase = createClient()
    const { data, error } = await supabase.from('projects').select('count').limit(1)
    
    if (error) {
      console.error('Health check failed:', error.message)
      return NextResponse.json({ 
        status: 'unhealthy', 
        error: 'Database connection failed',
        details: error.message 
      }, { status: 503 })
    }
    
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'operational'
      }
    }, { status: 200 })
  } catch (e: any) {
    console.error('Health check error:', e)
    return NextResponse.json({ 
      status: 'unhealthy',
      error: e?.message || 'Internal server error'
    }, { status: 503 })
  }
}


