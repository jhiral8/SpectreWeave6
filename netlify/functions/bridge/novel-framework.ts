import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'


export const handler = createNetlifyHandler({

  GET: async (request: Request) => {
    export async function GET(req: Request) {
  try {
    const res = await fetch(`${BACKEND_ORIGIN}/api/novel-frameworks`, {
      headers: { ...authHeaderFrom(req) },
      cache: 'no-store',
    })
    const payload = await res.json().catch(() => ({}))
    return jsonResponse(payload, { status: res.status })
  } catch (e: any) {
    return jsonResponse({ success: false, error: e?.message || 'Failed to list frameworks' }, { status: 500 })
  }
}
  },

  POST: async (request: Request) => {
    export async function POST(req: Request) {
  try {
    const body = await req.json()
    const res = await fetch(`${BACKEND_ORIGIN}/api/novel-frameworks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaderFrom(req) },
      body: JSON.stringify(body),
    })
    const payload = await res.json().catch(() => ({}))
    return jsonResponse(payload, { status: res.status })
  } catch (e: any) {
    return jsonResponse({ success: false, error: e?.message || 'Failed to create framework' }, { status: 500 })
  }
}
  }
})