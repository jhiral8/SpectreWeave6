import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { agentStore } from '@/lib/agents/agentStore'

export type DbAgent = {
  id: string
  user_id: string
  name: string
  role: string
  provider?: string | null
  model?: string | null
  temperature?: number | null
  max_tokens?: number | null
  prompt_template?: string | null
  created_at: string
  updated_at: string
}

export type DbPipeline = {
  id: string
  user_id: string
  name: string
  description?: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export type DbPipelineStep = {
  id: string
  pipeline_id: string
  agent_id?: string | null
  role: string
  enabled: boolean
  retrieval?: any | null
  inputs_mode?: string | null
  inputs_config?: any | null
  order_index: number
  created_at: string
  updated_at: string
}

export type DbPipelineLink = {
  id: string
  pipeline_id: string
  from_step_id: string
  to_step_id: string
  created_at: string
}

export class AgentsRepo {
  async listAgents(userId: string): Promise<DbAgent[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('agent_templates')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })
      if (error) throw error
      return data || []
    } catch (e: any) {
      if (String(e?.message || '').includes('relation') && String(e?.message || '').includes('agent_templates')) {
        // Fallback to in-memory store until migration applied
        const now = new Date().toISOString()
        return agentStore.listAgents().map(a => ({
          id: a.id,
          user_id: userId,
          name: a.name,
          role: a.role,
          provider: a.provider || null,
          model: a.model || null,
          temperature: a.temperature ?? 0.7,
          max_tokens: a.maxTokens ?? 1000,
          prompt_template: a.promptTemplate || null,
          created_at: a.createdAt || now,
          updated_at: a.updatedAt || now,
        }))
      }
      throw e
    }
  }

  async upsertAgent(userId: string, agent: Partial<DbAgent> & { name: string; role: string }): Promise<DbAgent> {
    try {
      const supabase = createClient()
      const row = {
        id: agent.id || `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        user_id: userId,
        name: agent.name,
        role: agent.role,
        provider: agent.provider ?? null,
        model: agent.model ?? null,
        temperature: agent.temperature ?? 0.7,
        max_tokens: agent.max_tokens ?? (agent as any).maxTokens ?? 1000,
        prompt_template: agent.prompt_template ?? (agent as any).promptTemplate ?? null,
        updated_at: new Date().toISOString(),
        created_at: (agent as any).created_at || new Date().toISOString(),
      }
      const { data, error } = await supabase
        .from('agent_templates')
        .upsert(row)
        .select('*')
        .single()
      if (error) throw error
      return data as DbAgent
    } catch (e: any) {
      // If RLS blocks inserts (rare), fallback to service role
      if (e?.code === '42501' || String(e?.message || '').includes('permission')) {
        try {
          const admin = createServiceClient()
          const row = {
            id: (agent as any).id || `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            user_id: userId,
            name: agent.name,
            role: agent.role,
            provider: agent.provider ?? null,
            model: agent.model ?? null,
            temperature: agent.temperature ?? 0.7,
            max_tokens: agent.max_tokens ?? (agent as any).maxTokens ?? 1000,
            prompt_template: agent.prompt_template ?? (agent as any).promptTemplate ?? null,
            updated_at: new Date().toISOString(),
            created_at: (agent as any).created_at || new Date().toISOString(),
          }
          const { data } = await admin.from('agent_templates').upsert(row).select('*').single()
          return data as DbAgent
        } catch {}
      }
      if (String(e?.message || '').includes('relation') && String(e?.message || '').includes('agent_templates')) {
        // Fallback: write to in-memory
        const created = agentStore.upsertAgent({
          id: (agent as any).id,
          name: agent.name,
          role: agent.role as any,
          provider: agent.provider || undefined,
          model: agent.model || undefined,
          temperature: agent.temperature ?? 0.7,
          maxTokens: (agent as any).maxTokens ?? agent.max_tokens ?? 1000,
          promptTemplate: (agent as any).promptTemplate || undefined,
        })
        const now = new Date().toISOString()
        return {
          id: created.id,
          user_id: userId,
          name: created.name,
          role: created.role,
          provider: created.provider || null,
          model: created.model || null,
          temperature: created.temperature ?? 0.7,
          max_tokens: created.maxTokens ?? 1000,
          prompt_template: created.promptTemplate || null,
          created_at: created.createdAt || now,
          updated_at: created.updatedAt || now,
        }
      }
      throw e
    }
  }

  async deleteAgent(userId: string, id: string): Promise<boolean> {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('agent_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
      if (error) throw error
      return true
    } catch (e: any) {
      if (String(e?.message || '').includes('relation') && String(e?.message || '').includes('agent_templates')) {
        agentStore.deleteAgent(id)
        return true
      }
      throw e
    }
  }

  async listPipelines(userId: string): Promise<(DbPipeline & { steps: DbPipelineStep[]; edges?: DbPipelineLink[] })[]> {
    try {
      const supabase = createClient()
      const { data: pipes, error } = await supabase
        .from('agent_pipelines')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })
      if (error) throw error
      const pipelines = pipes || []
      const { data: steps } = await supabase
        .from('agent_pipeline_steps')
        .select('*')
        .in('pipeline_id', pipelines.map(p => p.id))
        .order('order_index', { ascending: true })
      const { data: links } = await supabase
        .from('agent_pipeline_links')
        .select('*')
        .in('pipeline_id', pipelines.map(p => p.id))
      const grouped: Record<string, DbPipelineStep[]> = {}
      ;(steps || []).forEach(s => {
        grouped[s.pipeline_id] = grouped[s.pipeline_id] || []
        grouped[s.pipeline_id].push(s)
      })
      const linksGrouped: Record<string, DbPipelineLink[]> = {}
      ;(links || []).forEach(l => {
        linksGrouped[l.pipeline_id] = linksGrouped[l.pipeline_id] || []
        linksGrouped[l.pipeline_id].push(l as DbPipelineLink)
      })
      return pipelines.map(p => ({ ...p, steps: grouped[p.id] || [], edges: linksGrouped[p.id] || [] }))
    } catch (e: any) {
      if (String(e?.message || '').includes('relation') && (String(e?.message || '').includes('agent_pipelines') || String(e?.message || '').includes('agent_pipeline_steps'))) {
        return agentStore.listPipelines().map(p => ({
          id: p.id,
          user_id: userId,
          name: p.name,
          description: p.description || null,
          is_default: false,
          created_at: p.createdAt,
          updated_at: p.updatedAt,
          steps: p.steps.map((s, idx) => ({
            id: s.id,
            pipeline_id: p.id,
            agent_id: s.agentId,
            role: s.role,
            enabled: s.enabled,
            retrieval: s.retrieval || null,
            order_index: idx,
            created_at: p.createdAt,
            updated_at: p.updatedAt,
          })),
        }))
      }
      throw e
    }
  }

  async getPipelineById(userId: string, id: string): Promise<(DbPipeline & { steps: DbPipelineStep[]; edges?: DbPipelineLink[] }) | null> {
    try {
      const supabase = createClient()
      const { data: pipe } = await supabase
        .from('agent_pipelines')
        .select('*')
        .eq('user_id', userId)
        .eq('id', id)
        .maybeSingle()
      if (!pipe) return null
      const { data: steps } = await supabase
        .from('agent_pipeline_steps')
        .select('*')
        .eq('pipeline_id', id)
        .order('order_index', { ascending: true })
      const { data: edges } = await supabase
        .from('agent_pipeline_links')
        .select('*')
        .eq('pipeline_id', id)
      return { ...(pipe as any), steps: steps || [], edges: edges || [] }
    } catch (e: any) {
      if (String(e?.message || '').includes('relation') && (String(e?.message || '').includes('agent_pipelines') || String(e?.message || '').includes('agent_pipeline_steps'))) {
        const saved = agentStore.listPipelines().find(p => p.id === id)
        if (!saved) return null
        return {
          id: saved.id,
          user_id: userId,
          name: saved.name,
          description: saved.description || null,
          is_default: false,
          created_at: saved.createdAt,
          updated_at: saved.updatedAt,
          steps: saved.steps.map((s, idx) => ({ id: s.id, pipeline_id: saved.id, agent_id: s.agentId, role: s.role, enabled: s.enabled, retrieval: s.retrieval || null, order_index: idx, created_at: saved.createdAt, updated_at: saved.updatedAt })),
          edges: [],
        } as any
      }
      throw e
    }
  }

  async upsertPipeline(userId: string, pipeline: Partial<DbPipeline> & { name: string; steps?: Array<Partial<DbPipelineStep> & { id?: string }>; edges?: Array<{ from: string; to: string }> }): Promise<DbPipeline & { steps: DbPipelineStep[]; edges?: DbPipelineLink[] } > {
    try {
      const supabase = createClient()
      const pipelineId = pipeline.id || `pipeline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const pipeRow = {
        id: pipelineId,
        user_id: userId,
        name: pipeline.name,
        description: pipeline.description ?? null,
        updated_at: new Date().toISOString(),
        created_at: (pipeline as any).created_at || new Date().toISOString(),
      }
      const { error: upErr } = await supabase.from('agent_pipelines').upsert(pipeRow)
      if (upErr) throw upErr

      if (pipeline.steps) {
        await supabase.from('agent_pipeline_steps').delete().eq('pipeline_id', pipelineId)
        const rows = pipeline.steps.map((s, idx) => ({
          id: s.id || `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          pipeline_id: pipelineId,
          agent_id: s.agent_id || (s as any).agentId || null,
          role: s.role!,
          enabled: s.enabled ?? true,
          retrieval: s.retrieval ?? null,
          inputs_mode: (s as any).inputs_mode ?? (s as any).inputsMode ?? null,
          inputs_config: (s as any).inputs_config ?? (s as any).inputsConfig ?? null,
          order_index: idx,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
        if (rows.length > 0) {
          const { error: insErr } = await supabase.from('agent_pipeline_steps').insert(rows)
          if (insErr) throw insErr
        }
      }
      // Upsert edges
      await supabase.from('agent_pipeline_links').delete().eq('pipeline_id', pipelineId)
      if (pipeline.edges && pipeline.edges.length > 0) {
        const linkRows = pipeline.edges.map((e) => ({
          id: `link_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          pipeline_id: pipelineId,
          from_step_id: e.from,
          to_step_id: e.to,
          created_at: new Date().toISOString(),
        }))
        const { error: linkErr } = await supabase.from('agent_pipeline_links').insert(linkRows)
        if (linkErr) throw linkErr
      }

      const steps = (await supabase
        .from('agent_pipeline_steps')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('order_index', { ascending: true })).data || []
      const edges = (await supabase
        .from('agent_pipeline_links')
        .select('*')
        .eq('pipeline_id', pipelineId)).data || []

      return { ...pipeRow, is_default: false, steps, edges } as any
    } catch (e: any) {
      // If blocked by RLS, write via service client
      if (e?.code === '42501' || String(e?.message || '').includes('permission')) {
        try {
          const admin = createServiceClient()
          const pipelineId = (pipeline as any).id || `pipeline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
          const pipeRow = {
            id: pipelineId,
            user_id: userId,
            name: pipeline.name,
            description: pipeline.description ?? null,
            updated_at: new Date().toISOString(),
            created_at: (pipeline as any).created_at || new Date().toISOString(),
          }
          await admin.from('agent_pipelines').upsert(pipeRow)
          if (pipeline.steps) {
            await admin.from('agent_pipeline_steps').delete().eq('pipeline_id', pipelineId)
            const rows = pipeline.steps.map((s, idx) => ({
              id: s.id || `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              pipeline_id: pipelineId,
              agent_id: s.agent_id || (s as any).agentId || null,
              role: s.role!,
              enabled: s.enabled ?? true,
              retrieval: s.retrieval ?? null,
              inputs_mode: (s as any).inputs_mode ?? (s as any).inputsMode ?? null,
              inputs_config: (s as any).inputs_config ?? (s as any).inputsConfig ?? null,
              order_index: idx,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))
            if (rows.length > 0) {
              await admin.from('agent_pipeline_steps').insert(rows)
            }
          }
          // edges via service client
          await admin.from('agent_pipeline_links').delete().eq('pipeline_id', pipelineId)
          if ((pipeline as any).edges && (pipeline as any).edges.length > 0) {
            const linkRows = (pipeline as any).edges.map((e: any) => ({
              id: `link_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              pipeline_id: pipelineId,
              from_step_id: e.from,
              to_step_id: e.to,
              created_at: new Date().toISOString(),
            }))
            await admin.from('agent_pipeline_links').insert(linkRows)
          }
          const { data: steps } = await admin.from('agent_pipeline_steps').select('*').eq('pipeline_id', pipelineId).order('order_index', { ascending: true })
          const { data: edges } = await admin.from('agent_pipeline_links').select('*').eq('pipeline_id', pipelineId)
          return { ...pipeRow, is_default: false, steps: steps || [], edges: edges || [] } as any
        } catch {}
      }
      if (String(e?.message || '').includes('relation') && (String(e?.message || '').includes('agent_pipelines') || String(e?.message || '').includes('agent_pipeline_steps'))) {
        const saved = agentStore.upsertPipeline({ id: (pipeline as any).id, name: pipeline.name, description: pipeline.description, steps: (pipeline.steps || []).map((s: any) => ({ id: s.id, agentId: s.agent_id || s.agentId, role: s.role, enabled: s.enabled ?? true, retrieval: s.retrieval })) })
        return {
          id: saved.id,
          user_id: userId,
          name: saved.name,
          description: saved.description || null,
          is_default: false,
          created_at: saved.createdAt,
          updated_at: saved.updatedAt,
          steps: saved.steps.map((s, idx) => ({ id: s.id, pipeline_id: saved.id, agent_id: s.agentId, role: s.role, enabled: s.enabled, retrieval: s.retrieval || null, order_index: idx, created_at: saved.createdAt, updated_at: saved.updatedAt })),
        } as any
      }
      throw e
    }
  }

  async deletePipeline(userId: string, id: string): Promise<boolean> {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('agent_pipelines')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
      if (error) throw error
      return true
    } catch (e: any) {
      if (String(e?.message || '').includes('relation') && String(e?.message || '').includes('agent_pipelines')) {
        return agentStore.deletePipeline(id)
      }
      throw e
    }
  }

  async getDefaultPipelineId(userId: string): Promise<string | undefined> {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('agent_pipelines')
        .select('id')
        .eq('user_id', userId)
        .eq('is_default', true)
        .maybeSingle()
      return data?.id || undefined
    } catch (e: any) {
      if (String(e?.message || '').includes('relation') && String(e?.message || '').includes('agent_pipelines')) {
        return undefined
      }
      throw e
    }
  }

  async setDefaultPipeline(userId: string, id?: string): Promise<string | undefined> {
    try {
      const supabase = createClient()
      await supabase.from('agent_pipelines').update({ is_default: false }).eq('user_id', userId).eq('is_default', true)
      if (id) {
        const { error } = await supabase.from('agent_pipelines').update({ is_default: true }).eq('id', id).eq('user_id', userId)
        if (error) throw error
      }
      return this.getDefaultPipelineId(userId)
    } catch (e: any) {
      if (e?.code === '42501' || String(e?.message || '').includes('permission')) {
        try {
          const admin = createServiceClient()
          await admin.from('agent_pipelines').update({ is_default: false }).eq('user_id', userId).eq('is_default', true)
          if (id) {
            await admin.from('agent_pipelines').update({ is_default: true }).eq('id', id).eq('user_id', userId)
          }
          return id
        } catch {}
      }
      if (String(e?.message || '').includes('relation') && String(e?.message || '').includes('agent_pipelines')) {
        // No-op fallback
        return id
      }
      throw e
    }
  }
}

export const agentsRepo = new AgentsRepo()


