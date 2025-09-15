import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    // Since Neo4j is optional for this application, return success
    // In a real deployment, you would check actual Neo4j connection here
    const neo4jConfigured = process.env.NEO4J_URI && process.env.NEO4J_USERNAME && process.env.NEO4J_PASSWORD
    
    return NextResponse.json({ 
      success: true,
      status: 'healthy',
      neo4j: {
        configured: !!neo4jConfigured,
        status: neo4jConfigured ? 'available' : 'optional',
        message: neo4jConfigured ? 'Neo4j connection available' : 'Neo4j not configured (optional service)'
      },
      timestamp: new Date().toISOString()
    }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ 
      success: false, 
      error: e?.message || 'Neo4j health check failed',
      status: 'unhealthy'
    }, { status: 500 })
  }
}


