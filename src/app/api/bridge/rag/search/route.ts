import { NextRequest, NextResponse } from 'next/server'
import { ragSystem } from '@/lib/ai/ragSystem'
import { createProtectedRoute } from '@/lib/middleware/auth'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export const runtime = 'nodejs'

export const POST = createProtectedRoute(async (_ctx, req: NextRequest) => {
  try {
    const body = await req.json()
    const query: string = body?.query
    const options = body?.options || {}
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }
    // Try backend first with simple in-memory cache
    const g: any = global as any
    g.__ragCache = g.__ragCache || new Map<string, { t: number; v: any }>()
    const cacheKey = `vr:${JSON.stringify({ query, options })}`
    const ttlMs = 10_000
    const now = Date.now()
    const cached = g.__ragCache.get(cacheKey)
    if (cached && now - cached.t < ttlMs) {
      return NextResponse.json(cached.v)
    }
    // Try backend first
    try {
      const cookieToken = req.cookies.get('backend_jwt')?.value
      const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
      const res = await fetch(`${BACKEND_ORIGIN}/api/rag/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({ query, options }),
      })
      if (res.ok) {
        const payload = await res.json().catch(() => ({}))
        g.__ragCache.set(cacheKey, { t: now, v: payload })
        return NextResponse.json(payload, { status: res.status })
      }
    } catch {}
    const results = await ragSystem.searchRelevantContext(query, options)
    // Map to bridge response shape
    const mapped = results.map(r => ({
      id: r.id,
      similarity: r.similarity,
      category: r.category,
      type: r.type,
      content: r.content,
      token_count: r.tokenCount,
      relevance_score: r.relevanceScore,
      metadata: r.metadata,
      excerpt: r.excerpt,
    }))
    return NextResponse.json({ success: true, data: mapped })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Search failed' }, { status: 500 })
  }
}, { requireAuth: true, rateLimit: { maxRequests: 60, windowMs: 60_000 } })


