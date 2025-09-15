import { NextResponse } from 'next/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import { agentsRepo } from '@/lib/services/agentsRepo'

export const runtime = 'nodejs'

// Expose current in-memory agents and pipelines to the generation UI
export const GET = createProtectedRoute(async (ctx) => {
  try {
    const [agents, pipelines] = await Promise.all([
      agentsRepo.listAgents(ctx.user.id),
      agentsRepo.listPipelines(ctx.user.id),
    ])
    return NextResponse.json({ success: true, data: { agents, pipelines } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to fetch' }, { status: 500 })
  }
})


