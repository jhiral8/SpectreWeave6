import { NextRequest, NextResponse } from 'next/server'
import { createProtectedRoute } from '@/lib/middleware/auth'

export const runtime = 'nodejs'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export const GET = createProtectedRoute(async (_ctx, req: NextRequest) => {
  try {
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    const res = await fetch(`${BACKEND_ORIGIN}/api/style-profiles`, {
      headers: authHeader ? { Authorization: authHeader } : {},
      cache: 'no-store',
    })
    const payload = await res.json().catch(() => ({}))
    return NextResponse.json(payload, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to list style profiles' }, { status: 500 })
  }
}, { requireAuth: true })

export const POST = createProtectedRoute(async (_ctx, req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}))
    const hasSamples = Array.isArray(body?.text_samples) && body.text_samples.length > 0
    const nameOk = typeof body?.name === 'string' && body.name.trim().length > 0
    if (!nameOk || !hasSamples) {
      return NextResponse.json({ error: 'name and text_samples[] are required' }, { status: 400 })
    }
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    const res = await fetch(`${BACKEND_ORIGIN}/api/style-profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        name: body.name,
        description: body.description,
        text_samples: body.text_samples,
      }),
    })
    const payload = await res.json().catch(() => ({}))
    return NextResponse.json(payload, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create style profile' }, { status: 500 })
  }
}, { requireAuth: true, rateLimit: { maxRequests: 30, windowMs: 60_000 } })


