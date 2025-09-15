import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export async function GET(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    const res = await fetch(`${BACKEND_ORIGIN}/api/neo4j/status`, {
      headers: authHeader ? { Authorization: authHeader } : {},
      cache: 'no-store',
    })
    const payload = await res.json().catch(() => ({}))
    return NextResponse.json(payload, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Neo4j status failed' }, { status: 500 })
  }
}


