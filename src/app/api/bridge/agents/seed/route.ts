import { NextResponse } from 'next/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import { agentsRepo } from '@/lib/services/agentsRepo'

export const runtime = 'nodejs'

export const POST = createProtectedRoute(async (ctx) => {
  try {
    console.log('[seed] user', ctx.user?.id)
    const existingAgents = await agentsRepo.listAgents(ctx.user.id)
    const existingPipelines = await agentsRepo.listPipelines(ctx.user.id)
    console.log('[seed] existing counts', { agents: existingAgents.length, pipelines: existingPipelines.length })

    const roles = [
      { role: 'planner', name: 'Planner Agent', model: 'gpt-4o-mini' },
      { role: 'scene_builder', name: 'Scene Builder Agent', model: 'gpt-4o-mini' },
      { role: 'dialogue_specialist', name: 'Dialogue Specialist', model: 'gpt-4o-mini' },
      { role: 'description_enhancer', name: 'Description Enhancer', model: 'gpt-4o-mini' },
      { role: 'consistency_editor', name: 'Consistency Editor', model: 'gpt-4o-mini' },
      { role: 'compiler', name: 'Compiler Agent', model: 'gpt-4o-mini' },
    ] as const

    // Ensure required agents exist for all roles
    for (const r of roles) {
      const found = existingAgents.find(a => a.role === r.role)
      if (!found) {
        console.log('[seed] creating agent for role', r.role)
        await agentsRepo.upsertAgent(ctx.user.id, { name: r.name, role: r.role, provider: 'openai', model: r.model, temperature: 0.7, max_tokens: 1200 })
      }
    }

    // Create default pipeline if none exists
    let defaultPipelineId: string | undefined
    if (existingPipelines.length === 0) {
      const latestAgents = await agentsRepo.listAgents(ctx.user.id)
      const idByRole = (role: string) => latestAgents.find(a => a.role === role)?.id
      console.log('[seed] creating default pipeline')
      const created = await agentsRepo.upsertPipeline(ctx.user.id, {
        name: 'Standard Chapter Pipeline',
        description: 'Planner → Scene Builder → Dialogue → Description → Consistency → Compiler',
        steps: [
          { role: 'planner', agent_id: idByRole('planner')!, enabled: true },
          { role: 'scene_builder', agent_id: idByRole('scene_builder')!, enabled: true },
          { role: 'dialogue_specialist', agent_id: idByRole('dialogue_specialist')!, enabled: true },
          { role: 'description_enhancer', agent_id: idByRole('description_enhancer')!, enabled: true },
          { role: 'consistency_editor', agent_id: idByRole('consistency_editor')!, enabled: true },
          { role: 'compiler', agent_id: idByRole('compiler')!, enabled: true },
        ],
      })
      defaultPipelineId = created.id
      // set as default
      try { await agentsRepo.setDefaultPipeline(ctx.user.id, created.id); console.log('[seed] set default pipeline', created.id) } catch (e) { console.log('[seed] set default failed', e) }
    }

    const [agents, pipelines] = await Promise.all([
      agentsRepo.listAgents(ctx.user.id),
      agentsRepo.listPipelines(ctx.user.id),
    ])
    console.log('[seed] final counts', { agents: agents.length, pipelines: pipelines.length })

    return NextResponse.json({ success: true, data: { agents, pipelines, defaultPipelineId } })
  } catch (e: any) {
    console.log('[seed] error', e)
    return NextResponse.json({ success: false, error: e?.message || 'Failed to seed agents' }, { status: 500 })
  }
})


