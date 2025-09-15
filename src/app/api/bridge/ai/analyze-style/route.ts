import { NextResponse } from 'next/server'
import { createProtectedRoute } from '@/lib/middleware/auth'

export const runtime = 'nodejs'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export const POST = createProtectedRoute(async (_ctx, req) => {
  try {
    const body = await req.json().catch(() => ({}))
    const text: string = body?.text || ''
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))

    const res = await fetch(`${BACKEND_ORIGIN}/api/ai/analyze-style`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({ text }),
    })

    const payload = await res.json().catch(() => ({}))
    return new NextResponse(JSON.stringify(payload), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to analyze style' }, { status: 500 })
  }
}, { requireAuth: true, rateLimit: { maxRequests: 60, windowMs: 60_000 } })


