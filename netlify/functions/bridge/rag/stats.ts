import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { ragSystem } from '../../../src/lib/ai/ragSystem'

export const handler = createNetlifyHandler({

  GET: async (request: Request) => {
    export async function GET(_req: Request) {
  try {
    // Try backend first
    try {
      const res = await fetch(`${BACKEND_ORIGIN}/api/rag/stats`, { cache: 'no-store' })
      if (res.ok) {
        const payload = await res.json().catch(() => ({}))
        return jsonResponse(payload, { status: res.status })
      }
    } catch {}
    const stats = ragSystem.getVectorStoreStats()
    // Map keys to backend-like shape
    const mapped = {
      total_vectors: stats.totalVectors,
      categories: stats.categories,
      frameworks: stats.frameworks,
    }
    return jsonResponse({ success: true, data: mapped })
  } catch (e: any) {
    return jsonResponse({ error: e?.message || 'Failed to get stats' }, { status: 500 })
  }
}
  }
})