import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

function authHeaderFrom(req: NextRequest): Record<string, string> | {} {
  const cookieToken = req.cookies.get('backend_jwt')?.value
  const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
  return authHeader ? { Authorization: authHeader } : {}
}

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${BACKEND_ORIGIN}/api/novel-frameworks`, {
      headers: { ...authHeaderFrom(req) },
      cache: 'no-store',
    })
    const payload = await res.json().catch(() => ({}))
    return NextResponse.json(payload, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to list frameworks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${BACKEND_ORIGIN}/api/novel-frameworks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaderFrom(req) },
      body: JSON.stringify(body),
    })
    const payload = await res.json().catch(() => ({}))
    return NextResponse.json(payload, { status: res.status })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to create framework' }, { status: 500 })
  }
}


