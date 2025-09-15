import { NextRequest, NextResponse } from 'next/server'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password required' }, { status: 400 })
    }

    const res = await fetch(`${BACKEND_ORIGIN}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json(data, { status: res.status })

    const token: string | undefined = data?.data?.token || data?.token
    if (!token) return NextResponse.json({ error: 'No token returned' }, { status: 502 })

    const resp = NextResponse.json({ success: true })
    resp.cookies.set('backend_jwt', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return resp
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Login failed' }, { status: 500 })
  }
}


