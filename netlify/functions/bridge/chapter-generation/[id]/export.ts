import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'


export const handler = createNetlifyHandler({

  GET: async (request: Request) => {
    export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const format = new URL(req.url).searchParams.get('format') || 'txt'
  try {
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    const res = await fetch(`${BACKEND_ORIGIN}/api/chapters/generations/${id}/export?format=${encodeURIComponent(format)}`, {
      headers: authHeader ? { Authorization: authHeader } : {},
    })
    // Stream back response directly
    const headers = new Headers(res.headers)
    const body = res.body
    return new Response(body, { status: res.status, headers })
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Failed to export' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
  }
})