import { NextRequest, NextResponse } from 'next/server'
import { createProtectedRoute } from '@/lib/middleware/auth'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export const GET = createProtectedRoute(async (_ctx, req: NextRequest, _perm, { params }: { params: { id: string } }) => {
  const { id } = params
  try {
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    const res = await fetch(`${BACKEND_ORIGIN}/api/chapters/generations/${id}/status`, { 
      cache: 'no-store',
      headers: authHeader ? { Authorization: authHeader } : {},
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data?.data || data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch status' }, { status: 500 })
  }
}, { requireAuth: true })


