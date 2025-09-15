import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'


export const handler = createNetlifyHandler({

  GET: async (request: Request) => {
    export async function GET(req: Request) {
  try {
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    const res = await fetch(`${BACKEND_ORIGIN}/api/ai/cost-optimization`, { headers: authHeader ? { Authorization: authHeader } : {} })
    const data = await res.json().catch(() => ({}))
    return jsonResponse(data, { status: res.status })
  } catch (e: any) {
    return jsonResponse({ success: false, error: e?.message || 'Failed to fetch cost optimization' }, { status: 500 })
  }
}
  }
})