import { NextRequest, NextResponse } from 'next/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import { agentsRepo } from '@/lib/services/agentsRepo'

export const runtime = 'nodejs'

export const GET = createProtectedRoute(async (ctx) => {
  try {
    const pipelines = await agentsRepo.listPipelines(ctx.user.id)
    return NextResponse.json({ success: true, data: pipelines })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to list pipelines' }, { status: 500 })
  }
})

export const POST = createProtectedRoute(async (ctx, req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}))
    if (!body?.name) return NextResponse.json({ success: false, error: 'name required' }, { status: 400 })
    // Normalize retrieval weights per step
    const steps = Array.isArray(body.steps) ? body.steps.map((s: any) => {
      if (s?.retrieval) {
        const gw = s.retrieval.graphWeight
        const vw = s.retrieval.vectorWeight
        if (gw !== undefined || vw !== undefined) {
          const g = Math.max(0, Math.min(1, gw ?? 0))
          const v = Math.max(0, Math.min(1, vw ?? 0))
          const sum = g + v
          s.retrieval.graphWeight = sum > 0 ? g / sum : 0.5
          s.retrieval.vectorWeight = sum > 0 ? v / sum : 0.5
        }
      }
      return s
    }) : []
    const edges = Array.isArray(body.edges) ? body.edges.filter((e: any) => e && e.from && e.to).map((e: any) => ({ from: String(e.from), to: String(e.to) })) : []
    const created = await agentsRepo.upsertPipeline(ctx.user.id, { name: body.name, description: body.description, steps, edges })
    return NextResponse.json({ success: true, data: created })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to create pipeline' }, { status: 500 })
  }
})

export const PUT = createProtectedRoute(async (ctx, req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}))
    if (!body?.id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })
    const edges = Array.isArray(body.edges) ? body.edges.filter((e: any) => e && e.from && e.to).map((e: any) => ({ from: String(e.from), to: String(e.to) })) : undefined
    const updated = await agentsRepo.upsertPipeline(ctx.user.id, { ...body, edges })
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to update pipeline' }, { status: 500 })
  }
})

export const DELETE = createProtectedRoute(async (ctx, req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })
    await agentsRepo.deletePipeline(ctx.user.id, id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to delete pipeline' }, { status: 500 })
  }
})


