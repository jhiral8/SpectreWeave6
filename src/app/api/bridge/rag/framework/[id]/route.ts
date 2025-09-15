import { NextRequest, NextResponse } from 'next/server'
import { ragSystem } from '@/lib/ai/ragSystem'
import { createProtectedRoute } from '@/lib/middleware/auth'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export const runtime = 'nodejs'

export const DELETE = createProtectedRoute(async (_ctx, _req: NextRequest, _perm, { params }: { params: { id: string } }) => {
  try {
    const { id } = params
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    // Try backend first
    try {
      const res = await fetch(`${BACKEND_ORIGIN}/api/rag/framework/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.ok) {
        const payload = await res.json().catch(() => ({}))
        return NextResponse.json(payload, { status: res.status })
      }
    } catch {}
    const result = await ragSystem.removeFrameworkFromIndex(id)
    return NextResponse.json({ success: true, data: { framework_id: result.frameworkId, removed_elements: result.removedElements } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Removal failed' }, { status: 500 })
  }
}, { requireAuth: true })


