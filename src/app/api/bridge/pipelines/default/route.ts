import { NextRequest, NextResponse } from 'next/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import { agentsRepo } from '@/lib/services/agentsRepo'

export const runtime = 'nodejs'

export const GET = createProtectedRoute(async (ctx) => {
  try {
    const id = await agentsRepo.getDefaultPipelineId(ctx.user.id)
    return NextResponse.json({ success: true, data: { defaultPipelineId: id } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to get default pipeline' }, { status: 500 })
  }
})

export const POST = createProtectedRoute(async (ctx, req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}))
    const id = body?.id as string | undefined
    if (id && typeof id !== 'string') return NextResponse.json({ success: false, error: 'invalid id' }, { status: 400 })
    const newId = await agentsRepo.setDefaultPipeline(ctx.user.id, id)
    return NextResponse.json({ success: true, data: { defaultPipelineId: newId } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to set default pipeline' }, { status: 500 })
  }
})


