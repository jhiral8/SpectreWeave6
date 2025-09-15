import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const framework = body?.framework || body
    if (!framework || !framework.id || !framework.title) {
      return NextResponse.json({ success: false, error: 'framework with id and title required' }, { status: 400 })
    }
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    const res = await fetch(`${BACKEND_ORIGIN}/api/graphrag/ingest-framework`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({ framework }),
    })
    const payload = await res.json().catch(() => ({}))
    return NextResponse.json(payload, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Ingestion failed' }, { status: 500 })
  }
}


