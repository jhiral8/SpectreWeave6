import { NextRequest, NextResponse } from 'next/server'
import { ragSystem } from '@/lib/ai/ragSystem'
import { createProtectedRoute } from '@/lib/middleware/auth'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export const runtime = 'nodejs'

export const POST = createProtectedRoute(async (_ctx, req: NextRequest) => {
  try {
    const body = await req.json()
    const frameworkId: string = body?.framework_id || body?.frameworkId
    const contextQuery: string = body?.context_query || body?.contextQuery
    const options = body?.options || {}
    if (!frameworkId || !contextQuery) {
      return NextResponse.json({ error: 'framework_id and context_query required' }, { status: 400 })
    }
    // Try backend first
    try {
      const cookieToken = req.cookies.get('backend_jwt')?.value
      const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
      const res = await fetch(`${BACKEND_ORIGIN}/api/rag/relevant-elements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({ framework_id: frameworkId, context_query: contextQuery, options }),
      })
      if (res.ok) {
        const payload = await res.json().catch(() => ({}))
        return NextResponse.json(payload, { status: res.status })
      }
    } catch {}
    const result = await ragSystem.getRelevantFrameworkElements(frameworkId, contextQuery, options)
    // Map to bridge response shape
    const mapped = {
      plot_elements: result.plotElements,
      characters: result.characters,
      world_elements: result.worldElements,
      themes: result.themes,
      total_tokens: result.totalTokens,
      relevance_scores: result.relevanceScores,
    }
    return NextResponse.json({ success: true, data: mapped })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Retrieval failed' }, { status: 500 })
  }
}, { requireAuth: true, rateLimit: { maxRequests: 60, windowMs: 60_000 } })


