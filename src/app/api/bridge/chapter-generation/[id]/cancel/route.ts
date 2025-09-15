import { NextRequest, NextResponse } from 'next/server'
import { createProtectedRoute } from '@/lib/middleware/auth'

export const runtime = 'nodejs'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export const POST = createProtectedRoute(async (_ctx, req: NextRequest, _perm, { params }: { params: { id: string } }) => {
  const { id } = params
  try {
    const body = await req.json().catch(() => ({}))
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    const res = await fetch(`${BACKEND_ORIGIN}/api/chapters/generations/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(authHeader ? { Authorization: authHeader } : {}) },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to cancel' }, { status: 500 })
  }
}, { requireAuth: true })


