import { NextRequest, NextResponse } from 'next/server'
import { ragSystem } from '@/lib/ai/ragSystem'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    // Try backend first
    try {
      const res = await fetch(`${BACKEND_ORIGIN}/api/rag/stats`, { cache: 'no-store' })
      if (res.ok) {
        const payload = await res.json().catch(() => ({}))
        return NextResponse.json(payload, { status: res.status })
      }
    } catch {}
    const stats = ragSystem.getVectorStoreStats()
    // Map keys to backend-like shape
    const mapped = {
      total_vectors: stats.totalVectors,
      categories: stats.categories,
      frameworks: stats.frameworks,
    }
    return NextResponse.json({ success: true, data: mapped })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to get stats' }, { status: 500 })
  }
}


