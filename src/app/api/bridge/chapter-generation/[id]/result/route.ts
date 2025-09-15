import { NextRequest, NextResponse } from 'next/server'
import { createProtectedRoute } from '@/lib/middleware/auth'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export const GET = createProtectedRoute(async (_ctx, req: NextRequest, _perm, { params }: { params: { id: string } }) => {
  const { id } = params
  try {
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    const res = await fetch(`${BACKEND_ORIGIN}/api/chapters/generations/${id}?include_content=true`, { 
      cache: 'no-store',
      headers: authHeader ? { Authorization: authHeader } : {},
    })
    const payload = await res.json()
    if (!res.ok) return NextResponse.json(payload, { status: res.status })
    const g = payload?.data || payload
    const result = {
      final_chapter: g.generated_content || '',
      word_count: g.word_count || 0,
      scenes_compiled: g.agent_outputs?.scenes_compiled || 0,
      quality_score: g.generation_metadata?.quality_score || 0,
      compilation_notes: g.generation_metadata?.notes || [],
      orchestration_metadata: {
        execution_id: g.id,
        pipeline_version: g.generation_metadata?.pipeline_version || 'v1',
        agents_executed: g.generation_metadata?.agents_executed || [],
        total_execution_time: g.generation_metadata?.total_execution_time || 0,
        total_tokens_used: g.generation_metadata?.tokens_used || 0,
        total_cost: g.generation_metadata?.cost || 0,
        errors_encountered: g.generation_metadata?.errors_encountered || 0,
      },
    }
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch result' }, { status: 500 })
  }
}, { requireAuth: true })


