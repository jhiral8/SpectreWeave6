import { NextRequest, NextResponse } from 'next/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import { agentsRepo } from '@/lib/services/agentsRepo'

export const runtime = 'nodejs'

type ValidationIssue = string

export const POST = createProtectedRoute(async (ctx, req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}))
    let pipeline = body?.pipeline as any

    // If id provided, load full pipeline structure (steps + edges) for validation
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

    const steps = Array.isArray(pipeline.steps) ? pipeline.steps.slice() : []
    const edges = Array.isArray(pipeline.edges) ? pipeline.edges.slice() : []
    const issues: ValidationIssue[] = []

    // Basic structure checks
    const idToStep = new Map<string, any>()
    steps.forEach((s: any) => idToStep.set(String(s.id), s))
    for (const e of edges) {
      const fromOk = idToStep.has(String(e.from))
      const toOk = idToStep.has(String(e.to))
      if (!fromOk || !toOk) issues.push(`Edge references missing step: ${String(e.from)} -> ${String(e.to)}`)
    }

    // Agent existence check
    try {
      const agents = await agentsRepo.listAgents(ctx.user.id)
      const agentIds = new Set(agents.map(a => a.id))
      steps.forEach((s: any) => {
        if (s.agent_id && !agentIds.has(s.agent_id)) {
          issues.push(`Unknown agent for step ${s.id} (${s.role}): ${s.agent_id}`)
        }
      })
    } catch {}

    // DAG validation and parallel stage planning (Kahn's algorithm)
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

    const stages: Array<{ index: number; steps: Array<{ id: string; role: string; agent_id?: string | null }> }> = []
    const queue: string[] = []
    indegree.forEach((v, k) => { if (v === 0) queue.push(k) })
    const visited = new Set<string>()
    let idx = 0

    if (edges.length === 0 && steps.length > 0) {
      const ordered = [...steps].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      for (const s of ordered) {
        stages.push({ index: idx++, steps: [{ id: String(s.id), role: s.role, agent_id: s.agent_id || null }] })
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
        if (level.length) stages.push({ index: idx++, steps: level })
      }
    }

    if (visited.size !== steps.length) {
      const missing = steps.filter((s: any) => !visited.has(String(s.id))).map((s: any) => s.role)
      issues.push(`Cycle detected or unreachable steps: ${missing.join(', ')}`)
    }

    return NextResponse.json({ success: true, data: { stages, issues, summary: { steps: steps.length, edges: edges.length, stages: stages.length } } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Validation failed' }, { status: 500 })
  }
})


