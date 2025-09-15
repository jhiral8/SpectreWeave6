import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'


export const handler = createNetlifyHandler({

  GET: async (request: Request) => {
    export async function GET(req: Request) {
  try {
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    const res = await fetch(`${BACKEND_ORIGIN}/api/graphrag/status`, {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: 'no-store',
    })
    const payload = await res.json().catch(() => ({}))
    return jsonResponse(payload, { status: res.status })
  } catch (e: any) {
    return jsonResponse({ success: false, error: e?.message || 'GraphRAG status failed' }, { status: 500 })
  }
}
  }
})