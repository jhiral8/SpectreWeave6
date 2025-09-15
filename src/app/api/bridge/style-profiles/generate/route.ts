import { NextRequest, NextResponse } from 'next/server'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const styleProfileId = body.style_profile_id || body.styleProfileId || body.id
    const mapped = {
      prompt: body.prompt,
      length: body.options?.length || (body.options?.max_tokens ? (body.options.max_tokens < 500 ? 'short' : body.options.max_tokens > 1200 ? 'long' : 'medium') : 'medium'),
      temperature: body.options?.temperature ?? 0.7,
    }
    if (!styleProfileId) return NextResponse.json({ error: 'style_profile_id required' }, { status: 400 })

    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    const res = await fetch(`${BACKEND_ORIGIN}/api/style-profiles/${styleProfileId}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(mapped),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to generate with style profile' }, { status: 500 })
  }
}


