import { NextRequest } from 'next/server'
import { createProtectedRoute } from '@/lib/middleware/auth'

export const runtime = 'nodejs'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export const GET = createProtectedRoute(async (_ctx, req: NextRequest, _perm, { params }: { params: { id: string } }) => {
  const { id } = params
  try {
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    const res = await fetch(`${BACKEND_ORIGIN}/api/chapters/generations/${id}/stream`, {
      headers: authHeader ? { Authorization: authHeader } : {},
    })
    const headers = new Headers(res.headers)
    headers.set('Content-Type', 'text/event-stream')
    headers.set('Cache-Control', 'no-cache')
    headers.set('Connection', 'keep-alive')
    return new Response(res.body, { status: res.status, headers })
  } catch (e: any) {
    return new Response(`event: error\ndata: ${JSON.stringify({ error: e?.message || 'Failed to stream' })}\n\n`, {
      status: 500,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }
}, { requireAuth: true })


