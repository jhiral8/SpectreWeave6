'use client'

import React, { useEffect, useMemo, useState } from 'react'

type ApiResponse<T = any> = { success?: boolean; data?: T; error?: string }

type AgentTemplate = {
  id: string
  name: string
  role: string
  provider?: string
  model?: string
  temperature?: number
  maxTokens?: number
  promptTemplate?: string
  createdAt: string
  updatedAt: string
}

type Pipeline = {
  id: string
  name: string
  description?: string
  steps: Array<{ id: string; agentId: string; role: string; enabled: boolean; retrieval?: { graphWeight?: number; vectorWeight?: number; categories?: string[]; maxHops?: number } }>
  createdAt: string
  updatedAt: string
}

const ROLES = [
  'planner',
  'scene_builder',
  'dialogue_specialist',
  'description_enhancer',
  'consistency_editor',
  'compiler',
]

export default function PortalAgentsPage() {
  const [agents, setAgents] = useState<AgentTemplate[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [defaultPipelineId, setDefaultPipelineId] = useState<string | undefined>(undefined)

  const [form, setForm] = useState<Partial<AgentTemplate>>({ role: 'scene_builder', temperature: 0.7, maxTokens: 1000 })
  const [editingId, setEditingId] = useState<string | null>(null)

  const [pipelineForm, setPipelineForm] = useState<{ id?: string; name: string; description?: string; steps: Pipeline['steps'] }>({ name: 'New Pipeline', description: '', steps: [] })
  const [testPrompt, setTestPrompt] = useState<string>('Write two lines of dialogue between the hero and mentor about the next quest.')
  const [testingAgentId, setTestingAgentId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string>('')
  const [seeding, setSeeding] = useState<boolean>(false)
  const [seedMsg, setSeedMsg] = useState<string>('')

  useEffect(() => {
    const init = async () => {
      try {
        const [a, p, d] = await Promise.all([
          fetch('/api/bridge/agents').then(r => r.json() as Promise<ApiResponse<AgentTemplate[]>>),
          fetch('/api/bridge/pipelines').then(r => r.json() as Promise<ApiResponse<Pipeline[]>>),
          fetch('/api/bridge/pipelines/default').then(r => r.json() as Promise<ApiResponse<{ defaultPipelineId?: string }>>),
        ])
        if (a?.data) setAgents(a.data)
        if (p?.data) setPipelines(p.data)
        if (d?.data) setDefaultPipelineId(d.data.defaultPipelineId)
      } catch (e: any) {
        setError('Failed to load agents/pipelines')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const resetForm = () => {
    setForm({ role: 'scene_builder', temperature: 0.7, maxTokens: 1000 })
    setEditingId(null)
  }

  const seedDefaults = async () => {
    try {
      setSeeding(true)
      setSeedMsg('')
      const res = await fetch('/api/bridge/agents/seed', { method: 'POST' })
      const payload: ApiResponse<{ agents: AgentTemplate[]; pipelines: Pipeline[] }> = await res.json()
      if (!res.ok || payload?.success === false) throw new Error(payload?.error || 'Seed failed')
      if (payload?.data?.agents) setAgents(payload.data.agents)
      if (payload?.data?.pipelines) setPipelines(payload.data.pipelines)
      setSeedMsg('Defaults seeded successfully')
    } catch (e: any) {
      setSeedMsg(e?.message || 'Failed to seed')
    } finally {
      setSeeding(false)
    }
  }

  const saveAgent = async () => {
    const method = editingId ? 'PUT' : 'POST'
    const res = await fetch('/api/bridge/agents', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: editingId ?? form.id }),
    })
    const payload: ApiResponse<AgentTemplate> = await res.json()
    if (!res.ok || !payload.success) {
      setError(payload.error || 'Save failed')
      return
    }
    const saved = payload.data!
    setAgents(prev => {
      const next = prev.filter(a => a.id !== saved.id)
      return [...next, saved].sort((a, b) => a.name.localeCompare(b.name))
    })
    resetForm()
  }

  const editAgent = (agent: AgentTemplate) => {
    setForm(agent)
    setEditingId(agent.id)
  }

  const deleteAgent = async (id: string) => {
    const res = await fetch(`/api/bridge/agents?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (res.ok) setAgents(prev => prev.filter(a => a.id !== id))
  }

  const testRunAgent = async (agent: AgentTemplate) => {
    try {
      setTestingAgentId(agent.id)
      setTestResult('')
      const res = await fetch('/api/bridge/ai/generate-intelligent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `[ROLE=${agent.role}]\n${testPrompt}`,
          options: {
            provider: agent.provider || 'local',
            model: agent.model || 'local-stub',
            temperature: agent.temperature ?? 0.7,
            maxTokens: agent.maxTokens ?? 300,
          },
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Generation failed')
      const text = payload?.text || payload?.data || ''
      setTestResult(String(text))
    } catch (e: any) {
      setTestResult(e?.message || 'Test failed')
    } finally {
      setTestingAgentId(null)
    }
  }

  const addStepToPipeline = (agent: AgentTemplate) => {
    setPipelineForm(p => ({
      ...p,
      steps: [...p.steps, { id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, agentId: agent.id, role: agent.role, enabled: true }],
    }))
  }

  const removeStep = (stepId: string) => {
    setPipelineForm(p => ({ ...p, steps: p.steps.filter(s => s.id !== stepId) }))
  }

  const toggleStep = (stepId: string) => {
    setPipelineForm(p => ({ ...p, steps: p.steps.map(s => (s.id === stepId ? { ...s, enabled: !s.enabled } : s)) }))
  }

  const reorderStep = (stepId: string, dir: -1 | 1) => {
    setPipelineForm(p => {
      const idx = p.steps.findIndex(s => s.id === stepId)
      if (idx < 0) return p
      const next = [...p.steps]
      const newIdx = Math.max(0, Math.min(next.length - 1, idx + dir))
      const [moved] = next.splice(idx, 1)
      next.splice(newIdx, 0, moved)
      return { ...p, steps: next }
    })
  }

  const savePipeline = async () => {
    const method = pipelineForm.id ? 'PUT' : 'POST'
    const res = await fetch('/api/bridge/pipelines', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pipelineForm),
    })
    const payload: ApiResponse<Pipeline> = await res.json()
    if (!res.ok || !payload.success) {
      setError(payload.error || 'Pipeline save failed')
      return
    }
    const saved = payload.data!
    setPipelines(prev => {
      const next = prev.filter(p => p.id !== saved.id)
      return [...next, saved].sort((a, b) => a.name.localeCompare(b.name))
    })
    setPipelineForm({ name: 'New Pipeline', description: '', steps: [] })
  }

  const editPipeline = (p: Pipeline) => {
    setPipelineForm({ id: p.id, name: p.name, description: p.description, steps: p.steps })
  }

  const deletePipeline = async (id: string) => {
    const res = await fetch(`/api/bridge/pipelines?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (res.ok) setPipelines(prev => prev.filter(p => p.id !== id))
  }

  const setDefaultPipeline = async (id?: string) => {
    const res = await fetch('/api/bridge/pipelines/default', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const payload: ApiResponse<{ defaultPipelineId?: string }> = await res.json()
    if (res.ok && payload.success) {
      setDefaultPipelineId(payload.data?.defaultPipelineId)
    }
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-heading">Agents</h1>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <button className="px-3 py-2 rounded border border-[--border]" onClick={seedDefaults} disabled={seeding}>
          {seeding ? 'Seeding…' : 'Seed default agents & pipeline'}
        </button>
        {seedMsg && (
          <div className={`text-sm ${seedMsg.includes('success') ? 'text-emerald-600' : 'text-red-600'}`}>{seedMsg}</div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="space-y-3">
          <h2 className="font-medium">Create / Edit Agent</h2>
          <div className="grid grid-cols-2 gap-2">
            <input className="border border-[--border] bg-[--input] px-2 py-1" placeholder="Name" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
            <select className="border border-[--border] bg-[--input] px-2 py-1" value={form.role as string} onChange={e => setForm({ ...form, role: e.target.value })}>
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <input className="border border-[--border] bg-[--input] px-2 py-1" placeholder="Provider (e.g. openai)" value={form.provider || ''} onChange={e => setForm({ ...form, provider: e.target.value })} />
            <input className="border border-[--border] bg-[--input] px-2 py-1" placeholder="Model (e.g. gpt-4o)" value={form.model || ''} onChange={e => setForm({ ...form, model: e.target.value })} />
            <input className="border border-[--border] bg-[--input] px-2 py-1" placeholder="Temperature" type="number" step="0.1" value={form.temperature ?? 0.7} onChange={e => setForm({ ...form, temperature: parseFloat(e.target.value) })} />
            <input className="border border-[--border] bg-[--input] px-2 py-1" placeholder="Max tokens" type="number" value={form.maxTokens ?? 1000} onChange={e => setForm({ ...form, maxTokens: parseInt(e.target.value || '0', 10) })} />
          </div>
          <textarea className="border border-[--border] bg-[--input] w-full px-2 py-1 min-h-[120px]" placeholder="Prompt template" value={form.promptTemplate || ''} onChange={e => setForm({ ...form, promptTemplate: e.target.value })} />
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50" onClick={saveAgent} disabled={!form.name}> {editingId ? 'Update Agent' : 'Create Agent'} </button>
            {editingId && (
              <button className="px-3 py-2 rounded bg-slate-700 text-white" onClick={resetForm}>Cancel</button>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium">Pipeline Builder</h2>
          <input className="border border-[--border] bg-[--input] w-full px-2 py-1" placeholder="Pipeline name" value={pipelineForm.name} onChange={e => setPipelineForm({ ...pipelineForm, name: e.target.value })} />
          <textarea className="border border-[--border] bg-[--input] w-full px-2 py-1 min-h-[60px]" placeholder="Description (optional)" value={pipelineForm.description} onChange={e => setPipelineForm({ ...pipelineForm, description: e.target.value })} />
          <div className="flex flex-wrap gap-2">
            {agents.map(a => (
              <button key={a.id} className="px-2 py-1 rounded border border-[--border] bg-[--card] text-sm" onClick={() => addStepToPipeline(a)}>
                + {a.name} ({a.role})
              </button>
            ))}
          </div>
          <ul className="space-y-3">
            {pipelineForm.steps.map((s, idx) => (
              <li key={s.id} className="rounded border border-[--border] bg-[--card] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">Step {idx + 1}</div>
                    <div className="text-[--muted-foreground]">{agents.find(a => a.id === s.agentId)?.name} · {s.role}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 rounded border border-[--border]" onClick={() => reorderStep(s.id, -1)}>↑</button>
                    <button className="px-2 py-1 rounded border border-[--border]" onClick={() => reorderStep(s.id, +1)}>↓</button>
                    <button className="px-2 py-1 rounded border border-[--border]" onClick={() => toggleStep(s.id)}>{s.enabled ? 'Disable' : 'Enable'}</button>
                    <button className="px-2 py-1 rounded border border-[--border] text-red-600" onClick={() => removeStep(s.id)}>Remove</button>
                  </div>
                </div>
                {/* Retrieval controls */}
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <label className="whitespace-nowrap">Graph %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={Math.round(((s.retrieval?.graphWeight ?? 0.5) * 100))}
                      onChange={e => {
                        const val = Math.max(0, Math.min(100, parseInt(e.target.value || '0', 10)))
                        const g = val / 100
                        const v = 1 - g
                        setPipelineForm(p => ({
                          ...p,
                          steps: p.steps.map(st => st.id === s.id ? { ...st, retrieval: { ...(st.retrieval||{}), graphWeight: g, vectorWeight: v } } : st)
                        }))
                      }}
                      className="w-20 border border-[--border] bg-[--input] px-2 py-1 rounded"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="whitespace-nowrap">Max hops</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={s.retrieval?.maxHops ?? 3}
                      onChange={e => {
                        const val = Math.max(1, Math.min(5, parseInt(e.target.value || '3', 10)))
                        setPipelineForm(p => ({
                          ...p,
                          steps: p.steps.map(st => st.id === s.id ? { ...st, retrieval: { ...(st.retrieval||{}), maxHops: val } } : st)
                        }))
                      }}
                      className="w-20 border border-[--border] bg-[--input] px-2 py-1 rounded"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <label className="whitespace-nowrap">Categories</label>
                    <input
                      type="text"
                      placeholder="character,location,plotpoint"
                      value={(s.retrieval?.categories || []).join(',')}
                      onChange={e => {
                        const cats = e.target.value.split(',').map(x => x.trim()).filter(Boolean)
                        setPipelineForm(p => ({
                          ...p,
                          steps: p.steps.map(st => st.id === s.id ? { ...st, retrieval: { ...(st.retrieval||{}), categories: cats } } : st)
                        }))
                      }}
                      className="flex-1 border border-[--border] bg-[--input] px-2 py-1 rounded"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={savePipeline}>Save Pipeline</button>
            {pipelineForm.id && (
              <button className="px-3 py-2 rounded bg-slate-700 text-white" onClick={() => setPipelineForm({ name: 'New Pipeline', description: '', steps: [] })}>New</button>
            )}
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium">Agent Test Run</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <textarea className="border border-[--border] bg-[--input] px-2 py-1 md:col-span-2 min-h-[100px]" value={testPrompt} onChange={e => setTestPrompt(e.target.value)} />
          <div className="space-y-2">
            {agents.length === 0 ? (
              <div className="text-sm text-[--muted-foreground]">No agents available. Create one above.</div>
            ) : (
              agents.map(a => (
                <button key={a.id} className={`w-full px-3 py-2 rounded border text-left ${testingAgentId===a.id ? 'opacity-60' : ''}`} onClick={() => testRunAgent(a)} disabled={!!testingAgentId}>
                  Run with {a.name}
                </button>
              ))
            )}
          </div>
        </div>
        {testResult && (
          <pre className="bg-[--card] border border-[--border] rounded p-3 text-sm overflow-auto whitespace-pre-wrap">{testResult}</pre>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Agents</h2>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map(a => (
            <li key={a.id} className="rounded-lg border border-[--border] bg-[--card] p-4">
              <div className="font-medium">{a.name}</div>
              <div className="text-sm text-[--muted-foreground]">{a.role}{a.model ? ` · ${a.model}` : ''}</div>
              <div className="mt-3 flex gap-2">
                <button className="px-2 py-1 rounded border border-[--border]" onClick={() => editAgent(a)}>Edit</button>
                <button className="px-2 py-1 rounded border border-[--border] text-red-600" onClick={() => deleteAgent(a.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Pipelines</h2>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pipelines.map(p => (
            <li key={p.id} className="rounded-lg border border-[--border] bg-[--card] p-4">
              <div className="font-medium flex items-center justify-between">
                <span>{p.name}</span>
                {defaultPipelineId===p.id && (
                  <span className="text-xs text-emerald-600 border border-emerald-600 rounded px-2 py-0.5">Default</span>
                )}
              </div>
              <div className="text-sm text-[--muted-foreground]">{p.steps.length} steps</div>
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <button className="px-2 py-1 rounded border border-[--border]" onClick={() => editPipeline(p)}>Edit</button>
                <button className="px-2 py-1 rounded border border-[--border] text-red-600" onClick={() => deletePipeline(p.id)}>Delete</button>
                <button className={`px-2 py-1 rounded border ${defaultPipelineId===p.id ? 'border-emerald-600 text-emerald-600' : 'border-[--border]'}`} onClick={() => setDefaultPipeline(p.id)}>
                  {defaultPipelineId===p.id ? 'Default ✓' : 'Set Default'}
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="text-xs text-[--muted-foreground]">Default pipeline will be used for chapter generation unless overridden.</div>
      </section>
    </div>
  )
}


