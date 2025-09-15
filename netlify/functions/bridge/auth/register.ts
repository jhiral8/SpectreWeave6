import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'


export const handler = createNetlifyHandler({

  POST: async (request: Request) => {
    export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()
    if (!name || !email || !password) {
      return jsonResponse({ error: 'name, email and password required' }, { status: 400 })
    }

    const res = await fetch(`${BACKEND_ORIGIN}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()
    if (!res.ok) return jsonResponse(data, { status: res.status })

    const token: string | undefined = data?.data?.token || data?.token
    if (!token) return jsonResponse({ error: 'No token returned' }, { status: 502 })

    const resp = jsonResponse({ success: true })
    resp.cookies.set('backend_jwt', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return resp
  } catch (e: any) {
    return jsonResponse({ error: e?.message || 'Registration failed' }, { status: 500 })
  }
}
  }
})