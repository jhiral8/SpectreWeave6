import { NextRequest, NextResponse } from 'next/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import { agentsRepo } from '@/lib/services/agentsRepo'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export const POST = createProtectedRoute(async (ctx, req: NextRequest) => {
  try {
    const body = await req.json()
    // Map bridge request to backend schema
    const mapped = {
      novel_id: body.novel_framework_id || body.novelId || body.novel_id,
      chapter_goal: body.chapterGoal || body.chapter_goal,
      target_word_count: body.targetWordCount || body.target_word_count,
      chapter_number: body.chapterNumber || body.chapter_number,
      complexity: body.complexity || 'medium',
      chapter_length: body.length || body.chapter_length || 'medium',
      style_profile_id: body.styleProfileId || body.style_profile_id || null,
      user_instructions: body.userInstructions || body.user_instructions || '',
      previous_chapter_summary: body.previousChapterSummary || body.previous_chapter_summary || '',
      generate_outline_only: !!body.generate_outline_only,
      allow_partial_generation: !!body.allow_partial_generation,
      subplot_threads: body.subplot_threads,
      character_perspectives: body.character_perspectives || [],
      scene_structure: body.scene_structure || 'standard',
      pipeline_id: body.pipeline_id || body.pipelineId || undefined,
      // Optional per-agent retrieval overrides
      perAgentRetrieval: Array.isArray(body.perAgentRetrieval) ? body.perAgentRetrieval : undefined,
      execution_engine: body.execution_engine || 'langgraph',
      retrieval_mode: body.retrieval_mode || 'hybrid',
    }

    // Attach default pipeline from Supabase if none provided
    try {
      if (!mapped.pipeline_id && ctx?.user?.id) {
        const defaultId = await agentsRepo.getDefaultPipelineId(ctx.user.id)
        if (defaultId) mapped.pipeline_id = defaultId
      }
    } catch {}

    // If executing via LangGraph, attach pipeline structure for backend compilation
    try {
      if (mapped.pipeline_id && (mapped as any).execution_engine === 'langgraph') {
        const full = await agentsRepo.getPipelineById(ctx.user.id, mapped.pipeline_id)
        const allAgents = await agentsRepo.listAgents(ctx.user.id)
        const agentMap = new Map(allAgents.map(a => [a.id, a]))
        if (full) {
          ;(mapped as any).pipeline = {
            id: full.id,
            name: full.name,
            steps: (full.steps || []).map(s => {
              const ag = s.agent_id ? agentMap.get(s.agent_id) : undefined
              return {
                id: s.id,
                role: s.role,
                agent_id: s.agent_id,
                enabled: s.enabled,
                retrieval: s.retrieval,
                inputs_mode: (s as any).inputs_mode,
                inputs_config: (s as any).inputs_config,
                agent: ag ? {
                  id: ag.id,
                  name: ag.name,
                  role: ag.role,
                  provider: ag.provider || null,
                  model: ag.model || null,
                  temperature: ag.temperature ?? null,
                  max_tokens: ag.max_tokens ?? null,
                  prompt_template: ag.prompt_template || null,
                } : undefined,
              }
            }),
            edges: (full.edges || []).map(e => ({ from: e.from_step_id, to: e.to_step_id })),
          }
        }
      }
    } catch {}

    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader = req.headers.get('authorization') 
      || (cookieToken ? `Bearer ${cookieToken}` : (process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : ''))
    const res = await fetch(`${BACKEND_ORIGIN}/api/chapters/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(mapped),
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }
    // Normalize response to bridge shape
    return NextResponse.json({ generation_id: data?.data?.generation_id || data?.generation_id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to initiate generation' }, { status: 500 })
  }
}, { requireAuth: true, rateLimit: { maxRequests: 20, windowMs: 60_000 } })


