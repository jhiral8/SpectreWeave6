import { NextRequest, NextResponse } from 'next/server'
import { ragSystem } from '@/lib/ai/ragSystem'
import { createProtectedRoute } from '@/lib/middleware/auth'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export const runtime = 'nodejs'

export const POST = createProtectedRoute(async (_ctx, req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}))
    const framework = body?.framework || body
    if (!framework || !framework.id || !framework.title) {
      return NextResponse.json({ error: 'framework with id and title required' }, { status: 400 })
    }
    // Try backend first
    try {
      const cookieToken = req.cookies.get('backend_jwt')?.value
      const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
      const res = await fetch(`${BACKEND_ORIGIN}/api/rag/index-framework`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({ framework }),
      })
      if (res.ok) {
        const payload = await res.json().catch(() => ({}))
        return NextResponse.json(payload, { status: res.status })
      }
    } catch {}
    const result = await ragSystem.indexNovelFramework(framework)
    return NextResponse.json({ success: true, data: result })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to index framework' }, { status: 500 })
  }
}, { requireAuth: true, rateLimit: { maxRequests: 30, windowMs: 60_000 } })


