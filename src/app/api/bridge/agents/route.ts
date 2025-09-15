import { NextRequest, NextResponse } from 'next/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import { agentsRepo } from '@/lib/services/agentsRepo'

export const runtime = 'nodejs'

export const GET = createProtectedRoute(async (ctx) => {
  try {
    const agents = await agentsRepo.listAgents(ctx.user.id)
    return NextResponse.json({ success: true, data: agents })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to list agents' }, { status: 500 })
  }
})

export const POST = createProtectedRoute(async (ctx, req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}))
    if (!body?.name || !body?.role) {
      return NextResponse.json({ success: false, error: 'name and role are required' }, { status: 400 })
    }
    const created = await agentsRepo.upsertAgent(ctx.user.id, body)
    return NextResponse.json({ success: true, data: created })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to create agent' }, { status: 500 })
  }
})

export const PUT = createProtectedRoute(async (ctx, req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}))
    if (!body?.id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })
    const updated = await agentsRepo.upsertAgent(ctx.user.id, body)
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to update agent' }, { status: 500 })
  }
})

export const DELETE = createProtectedRoute(async (ctx, req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })
    await agentsRepo.deleteAgent(ctx.user.id, id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to delete agent' }, { status: 500 })
  }
})


