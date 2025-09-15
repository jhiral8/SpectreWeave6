import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'


export const handler = createNetlifyHandler({

  POST: async (request: Request) => {
    export async function POST(req: Request) {
  try {
    const body = await req.json()
    const cacheKey = `gr:${JSON.stringify(body || {})}`
    // Basic in-memory cache per runtime instance (replace with Redis if available)
    const g: any = global as any
    g.__grCache = g.__grCache || new Map<string, { t: number; v: any }>()
    const now = Date.now()
    const ttlMs = 15_000
    const cached = g.__grCache.get(cacheKey)
    if (cached && now - cached.t < ttlMs) {
      return jsonResponse(cached.v)
    }
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    const res = await fetch(`${BACKEND_ORIGIN}/api/graphrag/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    })
    const payload = await res.json().catch(() => ({}))
    if (res.ok) {
      g.__grCache.set(cacheKey, { t: now, v: payload })
    }
    return jsonResponse(payload, { status: res.status })
  } catch (e: any) {
    return jsonResponse({ success: false, error: e?.message || 'GraphRAG search failed' }, { status: 500 })
  }
}
  }
})