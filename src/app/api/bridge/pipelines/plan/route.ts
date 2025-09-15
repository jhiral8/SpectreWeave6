import { NextRequest, NextResponse } from 'next/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import { agentsRepo } from '@/lib/services/agentsRepo'

export const runtime = 'nodejs'

type PlanStage = { index: number; steps: Array<{ id: string; role: string; agent_id?: string | null; name?: string | null }> }

export const POST = createProtectedRoute(async (ctx, req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({} as any))
    let pipeline = body?.pipeline as any

    if (!pipeline && body?.pipeline_id) {
      const full = await agentsRepo.getPipelineById(ctx.user.id, String(body.pipeline_id))
      if (!full) return NextResponse.json({ success: false, error: 'Pipeline not found' }, { status: 404 })
      pipeline = {
        id: full.id,
        name: full.name,
        steps: (full.steps || []).map(s => ({
          id: s.id,
          role: s.role,
          agent_id: s.agent_id,
          enabled: s.enabled,
          retrieval: s.retrieval,
          inputs_mode: (s as any).inputs_mode,
          inputs_config: (s as any).inputs_config,
          order_index: s.order_index,
        })),
        edges: (full.edges || []).map(e => ({ from: e.from_step_id, to: e.to_step_id })),
      }
    }

    if (!pipeline) return NextResponse.json({ success: false, error: 'pipeline or pipeline_id required' }, { status: 400 })

    // Local plan compilation (Kahn's algorithm with level grouping)
    const steps = Array.isArray(pipeline.steps) ? pipeline.steps.slice() : []
    const idToStep = new Map<string, any>()
    steps.forEach((s: any) => idToStep.set(String(s.id), s))
    const edges = Array.isArray(pipeline.edges) ? pipeline.edges.slice() : []

    const indegree = new Map<string, number>()
    const adj = new Map<string, Set<string>>()
    steps.forEach((s: any) => { indegree.set(String(s.id), 0); adj.set(String(s.id), new Set()) })
    for (const e of edges) {
      const from = String(e.from)
      const to = String(e.to)
      if (!idToStep.has(from) || !idToStep.has(to)) continue
      adj.get(from)!.add(to)
      indegree.set(to, (indegree.get(to) || 0) + 1)
    }

    const stages: PlanStage[] = []
    const queue: string[] = []
    indegree.forEach((v, k) => { if (v === 0) queue.push(k) })

    const visited = new Set<string>()
    let index = 0
    if (edges.length === 0 && steps.length > 0) {
      // Fallback to linear plan by order_index
      const ordered = [...steps].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      for (const s of ordered) {
        stages.push({ index: index++, steps: [{ id: String(s.id), role: s.role, agent_id: s.agent_id || null }] })
        visited.add(String(s.id))
      }
    } else {
      while (queue.length) {
        const levelSize = queue.length
        const level: Array<{ id: string; role: string; agent_id?: string | null }> = []
        for (let i = 0; i < levelSize; i++) {
          const u = queue.shift()!
          if (visited.has(u)) continue
          visited.add(u)
          const step = idToStep.get(u)
          if (step) level.push({ id: u, role: step.role, agent_id: step.agent_id || null })
          for (const v of adj.get(u) || []) {
            indegree.set(v, (indegree.get(v) || 0) - 1)
            if ((indegree.get(v) || 0) === 0) queue.push(v)
          }
        }
        if (level.length) stages.push({ index: index++, steps: level })
      }
    }

    const issues: string[] = []
    if (visited.size !== steps.length) issues.push('Cycle detected or unreachable nodes present')
    // Disconnected: nodes with no edges at all in graph and not visited via fallback
    const missing = steps.filter((s: any) => !visited.has(String(s.id)))
    if (missing.length) issues.push(`Unscheduled steps: ${missing.map((m: any) => m.role).join(', ')}`)

    return NextResponse.json({ success: true, data: { stages, issues } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to build plan' }, { status: 500 })
  }
})


