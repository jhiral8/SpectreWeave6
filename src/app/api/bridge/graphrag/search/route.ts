import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const cacheKey = `gr:${JSON.stringify(body || {})}`
    // Basic in-memory cache per runtime instance (replace with Redis if available)
    const g: any = global as any
    g.__grCache = g.__grCache || new Map<string, { t: number; v: any }>()
    const now = Date.now()
    const ttlMs = 15_000
    const cached = g.__grCache.get(cacheKey)
    if (cached && now - cached.t < ttlMs) {
      return NextResponse.json(cached.v)
    }
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    const res = await fetch(`${BACKEND_ORIGIN}/api/graphrag/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    })
    const payload = await res.json().catch(() => ({}))
    if (res.ok) {
      g.__grCache.set(cacheKey, { t: now, v: payload })
    }
    return NextResponse.json(payload, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'GraphRAG search failed' }, { status: 500 })
  }
}


