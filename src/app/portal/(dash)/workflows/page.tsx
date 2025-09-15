'use client'

import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import ReactFlow, { ReactFlowProvider, Background, Controls, MiniMap, addEdge, applyEdgeChanges, applyNodeChanges, Connection, Edge, Node, OnEdgesChange, OnNodesChange, ReactFlowInstance, MarkerType, Position, ConnectionLineType, useReactFlow, Handle, NodeTypes, ConnectionMode } from 'reactflow'
import 'reactflow/dist/style.css'

// Utilities to style nodes by variant inferred from role
type NodeVariant = 'llm' | 'rag' | 'tool'
function computeVariant(role?: string): { variant: NodeVariant; badge: string; color: string } {
  const r = (role || '').toLowerCase()
  if (r.includes('rag') || r.includes('search') || r.includes('graph') || r.includes('retriev')) {
    return { variant: 'rag', badge: 'RAG', color: '#14b8a6' }
  }
  if (r.includes('tool') || r.includes('action') || r.includes('fetch') || r.includes('process') || r.includes('scrape')) {
    return { variant: 'tool', badge: 'Tool', color: '#a78bfa' }
  }
  return { variant: 'llm', badge: 'LLM', color: '#38bdf8' }
}

// Stable custom node type with explicit handles allowing connections
function SimpleNode({ data, isConnectable = true }: { data: { label: string; role?: string; variant?: NodeVariant; badge?: string; color?: string }; isConnectable?: boolean }) {
  const accent = data.color || computeVariant(data.role).color
  const badge = data.badge || computeVariant(data.role).badge
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: `linear-gradient(135deg, var(--card, #16181d) 0%, ${accent}2d 100%)`,
        color: 'var(--foreground, #eef2f7)',
        border: '1px solid',
        borderColor: accent,
        padding: 12,
        borderRadius: 12,
        position: 'relative',
        pointerEvents: 'all',
        minWidth: 200,
        boxShadow: hovered
          ? `0 12px 28px ${accent}26, 0 8px 20px rgba(0,0,0,0.38)`
          : `0 8px 22px ${accent}1f, 0 6px 18px rgba(0,0,0,0.35)`,
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'all 160ms ease'
      }}
    >
      {/* header stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent, borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
      <Handle id="l" type="target" position={Position.Left} isConnectable={isConnectable} isValidConnection={() => true} style={{ background: accent, width: 10, height: 10, border: `1.5px solid ${accent}`, pointerEvents: 'all', zIndex: 10 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, textShadow: '0 1px 0 rgba(0,0,0,0.35)' }}>{data.label}</div>
        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, background: `${accent}26`, color: '#e5f9ff', border: `1px solid ${accent}` }}>{badge}</span>
      </div>
      {data.role && (
        <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>{data.role}</div>
      )}
      <Handle id="r" type="source" position={Position.Right} isConnectable={isConnectable} isValidConnection={() => true} style={{ background: accent, width: 10, height: 10, border: `1.5px solid ${accent}`, pointerEvents: 'all', zIndex: 10 }} />
    </div>
  )
}

const NODE_TYPES: NodeTypes = { simple: SimpleNode }

type Agent = { id: string; name: string; role: string }
type Pipeline = { id: string; name: string; description?: string; steps: Array<{ id: string; agent_id?: string; role: string; inputs_mode?: string | null; inputs_config?: any | null; retrieval?: any | null }>; edges?: Array<{ from_step_id: string; to_step_id: string }> }

export default function PortalWorkflowsPage() {
  // helper to fit after next paint
  const fitSoon = () => requestAnimationFrame(() => {
    try {
      const pane = document.querySelector('.react-flow__pane') as any
      if (pane && (pane as any).__rfInstance) {
        (pane as any).__rfInstance.fitView?.({ padding: 0.2, includeHiddenNodes: true })
      }
    } catch {}
  })
  const [agents, setAgents] = useState<Agent[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [defaultPipelineId, setDefaultPipelineId] = useState<string | undefined>(undefined)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [planStages, setPlanStages] = useState<Array<{ index: number; steps: Array<{ id: string; role: string; agent_id?: string | null }> }>>([])
  const [planIssues, setPlanIssues] = useState<string[]>([])
  const [saving, setSaving] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')
  const [seeding, setSeeding] = useState<boolean>(false)
  const [inspecting, setInspecting] = useState<boolean>(false)
  const rfInstance = useRef<ReactFlowInstance | null>(null)
  // updater will be used inside FlowCanvas via useReactFlow
  const updateInternals = (ids: string[]) => {
    try {
      // no-op here; real call happens in child with useReactFlow
    } catch {}
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [agentsRes, pipesRes, defRes] = await Promise.all([
          fetch('/api/bridge/agents', { cache: 'no-store', credentials: 'include' }),
          fetch('/api/bridge/pipelines', { cache: 'no-store', credentials: 'include' }),
          fetch('/api/bridge/pipelines/default', { cache: 'no-store', credentials: 'include' }),
        ])
        console.log('[workflows] initial fetch statuses', { agentsStatus: agentsRes.status, pipelinesStatus: pipesRes.status })
        const agentsJson = await agentsRes.json().catch(() => ({}))
        const pipesJson = await pipesRes.json().catch(() => ({}))
        const defJson = await defRes.json().catch(() => ({}))
        console.log('[workflows] initial agents json', agentsJson)
        console.log('[workflows] initial pipelines json', pipesJson)
        setAgents(agentsJson?.data || [])
        setPipelines(pipesJson?.data || [])
        const defId = defJson?.data?.defaultPipelineId as string | undefined
        if (defId) setDefaultPipelineId(defId)
        const first = (pipesJson?.data || [])[0]
        if (defId) {
          setSelected(defId)
        } else if (first) {
          setSelected(first.id)
        }
      } catch {}
    }
    load()
  }, [])

  const seedDefaults = async () => {
    try {
      setSeeding(true)
      setMessage('')
      console.log('[workflows] seeding: start')
      const t0 = performance.now()
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 15000)
      let res: Response
      try {
        res = await fetch('/api/bridge/agents/seed', { method: 'POST', credentials: 'include', signal: controller.signal })
      } finally {
        clearTimeout(timer)
      }
      console.log('[workflows] seeding: response status', res.status)
      const payload = await res.json().catch((e) => { console.log('[workflows] seeding: json parse error', e); return {} })
      console.log('[workflows] seeding: payload', payload)
      if (!res.ok || payload?.success === false) throw new Error(payload?.error || 'Failed to seed')
      // Refresh from server to ensure we read persisted data with RLS session
      const [pipesRes, defRes, agentsRes] = await Promise.all([
        fetch('/api/bridge/pipelines', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/bridge/pipelines/default', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/bridge/agents', { cache: 'no-store', credentials: 'include' }),
      ])
      console.log('[workflows] seeding: refetch statuses', { pipelinesStatus: pipesRes.status, defaultStatus: defRes.status, agentsStatus: agentsRes.status })
      const [pipesRef, defRef, agentsRef] = await Promise.all([
        pipesRes.json().catch((e) => { console.log('[workflows] pipelines json error', e); return {} }),
        defRes.json().catch((e) => { console.log('[workflows] default json error', e); return {} }),
        agentsRes.json().catch((e) => { console.log('[workflows] agents json error', e); return {} }),
      ])
      console.log('[workflows] seeding: refetch payloads', { pipesRef, defRef, agentsRef })
      setAgents(agentsRef?.data || payload?.data?.agents || [])
      setPipelines(pipesRef?.data || payload?.data?.pipelines || [])
      const nextId = defRef?.data?.defaultPipelineId || (pipesRef?.data?.[0]?.id) || (payload?.data?.pipelines?.[0]?.id)
      if (defRef?.data?.defaultPipelineId) setDefaultPipelineId(defRef.data.defaultPipelineId)
      if (nextId) setSelected(nextId)
      const t1 = performance.now()
      setMessage(`Defaults ready (${Math.round(t1 - t0)}ms)`) 
    } catch (e: any) {
      console.log('[workflows] seeding error', e)
      setMessage(e?.name === 'AbortError' ? 'Seeding timed out (15s)' : (e?.message || 'Seeding failed'))
    } finally {
      setSeeding(false)
    }
  }

  const inspect = async () => {
    try {
      setInspecting(true)
      setMessage('')
      const [pipesRes, agentsRes, defRes] = await Promise.all([
        fetch('/api/bridge/pipelines', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/bridge/agents', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/bridge/pipelines/default', { cache: 'no-store', credentials: 'include' }),
      ])
      const [pipes, agents, def] = await Promise.all([
        pipesRes.json().catch(() => ({})),
        agentsRes.json().catch(() => ({})),
        defRes.json().catch(() => ({})),
      ])
      console.log('[workflows] inspect payloads', { pipes, agents, def })
      setAgents(agents?.data || [])
      setPipelines(pipes?.data || [])
      if (def?.data?.defaultPipelineId) {
        setDefaultPipelineId(def.data.defaultPipelineId)
        setSelected(def.data.defaultPipelineId)
      }
      setMessage(`Inspect: ${agents?.data?.length ?? 0} agents, ${pipes?.data?.length ?? 0} pipelines`)
    } catch (e: any) {
      setMessage(e?.message || 'Inspect failed')
    } finally {
      setInspecting(false)
    }
  }

  useEffect(() => {
    const pipe = pipelines.find(p => p.id === selected)
    console.log('[workflows] selection changed', { selected, pipelinesCount: pipelines.length, pipeFound: !!pipe })
    if (!pipe) {
      setNodes([])
      setEdges([])
      return
    }
    // Simple layout
    const newNodes: Node[] = (pipe.steps || []).map((s, idx) => ({
      id: String(s.id),
      position: { x: idx * 220, y: 20 },
      data: {
        label: agents.find(a => a.id === s.agent_id)?.name || s.role,
        role: s.role,
      },
      type: 'simple',
      // help RF compute anchors even with custom handles
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      draggable: true,
      selectable: true,
      connectable: true,
    }))
    const persisted = Array.isArray(pipe.edges) && pipe.edges.length > 0
    const newEdges: Edge[] = persisted
      ? pipe.edges!.map((e) => ({
          id: `e-${String(e.from_step_id)}-${String(e.to_step_id)}`,
          source: String(e.from_step_id),
          target: String(e.to_step_id),
          sourceHandle: 'r',
          targetHandle: 'l',
          type: 'step',
          animated: false,
          style: { stroke: '#38bdf8', strokeWidth: 2 },
        }))
      : newNodes.slice(1).map((node, i) => ({
          id: `e-${newNodes[i].id}-${node.id}`,
          source: newNodes[i].id,
          target: node.id,
          sourceHandle: 'r',
          targetHandle: 'l',
          type: 'step',
          animated: false,
          style: { stroke: '#38bdf8', strokeWidth: 2 },
        }))
    console.log('[workflows] computed graph', { nodes: newNodes, edges: newEdges })
    setNodes(newNodes)
    setEdges(newEdges)
    setSelectedNodeId(null)
    // After next paint, force node measurements, then fit view
    if ((newNodes?.length || 0) > 0) {
      requestAnimationFrame(() => {
        try {
          updateInternals(newNodes.map(n => n.id))
          // re-apply edges to ensure binding after internals update
          setEdges(newEdges)
          rfInstance.current?.fitView({ padding: 0.2, includeHiddenNodes: true })
        } catch {}
      })
    }
  }, [selected, pipelines, agents])

  const onNodesChange: OnNodesChange = (changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
    try {
      const sel = changes.find((ch: any) => ch.type === 'select') as any
      if (sel && typeof sel.selected === 'boolean') {
        setSelectedNodeId(sel.selected ? String(sel.id) : null)
      }
    } catch {}
  }
  const onEdgesChange: OnEdgesChange = (changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds))
  }
  const onConnect = useCallback((connection: Connection) => {
    try {
      const edge = {
        ...connection,
        id: `e-${String(connection.source)}-${String(connection.target)}`,
        type: 'step',
        sourceHandle: connection.sourceHandle ?? 'r',
        targetHandle: connection.targetHandle ?? 'l',
        style: { stroke: '#38bdf8', strokeWidth: 2 },
      } as any
      setEdges((eds) => addEdge(edge, eds))
      console.log('[workflows] onConnect', edge)
    } catch (e) {
      console.warn('[workflows] onConnect error', e)
    }
  }, [])

  const patchStep = (stepId: string, patch: Record<string, any>) => {
    setPipelines(prev => prev.map(p => {
      if (p.id !== (selected || '')) return p
      return {
        ...p,
        steps: (p.steps || []).map(s => s.id === stepId ? { ...s, ...patch, retrieval: patch.retrieval !== undefined ? patch.retrieval : (s as any).retrieval } : s),
      }
    }))
  }

  const save = async () => {
    const pipe = pipelines.find(p => p.id === selected)
    if (!pipe) return
    try {
      setSaving(true)
      setMessage('')
      // Derive order from x position
      const order = [...nodes].sort((a, b) => a.position.x - b.position.x).map(n => n.id)
      const stepMap = new Map(pipe.steps.map(s => [s.id, s]))
      const steps = order.map((id) => {
        const s = stepMap.get(id)!
        return {
          id: s.id,
          role: s.role,
          agent_id: s.agent_id,
          inputs_mode: (s as any).inputs_mode,
          inputs_config: (s as any).inputs_config,
          retrieval: (s as any).retrieval,
        }
      })
      // Persist edges from current graph
      const edgesPayload = edges.map(e => ({ from: String(e.source), to: String(e.target) }))
      console.log('[workflows] saving pipeline', { id: pipe.id, name: pipe.name, steps })
      const res = await fetch('/api/bridge/pipelines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pipe.id, name: pipe.name, description: pipe.description, steps, edges: edgesPayload }),
      })
      const payload = await res.json().catch(() => ({}))
      console.log('[workflows] save response', { status: res.status, payload })
      if (!res.ok || payload?.success === false) throw new Error(payload?.error || 'Failed to save pipeline')
      setMessage('Saved')
      // Refresh pipelines list
      const refreshed = await fetch('/api/bridge/pipelines', { cache: 'no-store', credentials: 'include' }).then(r => r.json()).catch(() => ({}))
      console.log('[workflows] pipelines refreshed', refreshed)
      setPipelines(refreshed?.data || [])
    } catch (e: any) {
      setMessage(e?.message || 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  const setAsDefault = async () => {
    if (!selected) return
    try {
      setMessage('')
      const res = await fetch('/api/bridge/pipelines/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: selected }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || payload?.success === false) throw new Error(payload?.error || 'Failed to set default pipeline')
      setDefaultPipelineId(payload?.data?.defaultPipelineId || selected)
      setMessage('Default pipeline set')
    } catch (e: any) {
      setMessage(e?.message || 'Failed to set default')
    }
  }

  const validatePipeline = async () => {
    if (!selected) return
    try {
      setMessage('')
      const res = await fetch('/api/bridge/pipelines/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pipeline_id: selected }),
      })
      const payload = await res.json().catch(() => ({}))
      console.log('[workflows] validate response', { status: res.status, payload })
      if (!res.ok || payload?.success === false) {
        setMessage(payload?.error || 'Validation failed')
        return
      }
      const issues = (payload?.data?.issues || payload?.issues || []) as any[]
      setMessage(issues.length ? `Validation: ${issues.length} issue(s)` : 'Validation: OK')
    } catch (e: any) {
      setMessage(e?.message || 'Validation failed')
    }
  }

  const planPipeline = async () => {
    if (!selected) return
    try {
      setMessage('')
      const res = await fetch('/api/bridge/pipelines/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pipeline_id: selected }),
      })
      const payload = await res.json().catch(() => ({}))
      console.log('[workflows] plan response', { status: res.status, payload })
      if (!res.ok || payload?.success === false) {
        setMessage(payload?.error || 'Plan failed')
        setPlanStages([])
        setPlanIssues([])
        return
      }
      const stages = payload?.data?.stages || payload?.stages || []
      const issues = payload?.data?.issues || payload?.issues || []
      setPlanStages(stages)
      setPlanIssues(issues)
      setMessage(`Plan: ${stages.length} stage(s)${issues?.length ? `, ${issues.length} issue(s)` : ''}`)
    } catch (e: any) {
      setMessage(e?.message || 'Plan failed')
      setPlanStages([])
      setPlanIssues([])
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
      <h1 className="text-2xl font-heading">Workflows</h1>
        <div className="flex items-center gap-2 text-sm">
          <select className="rounded-md border border-[--border] bg-[--card] px-2 py-1" value={selected || ''} onChange={e => setSelected(e.target.value)}>
            {pipelines.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button onClick={setAsDefault} disabled={!selected || selected === defaultPipelineId} className="rounded-md px-3 py-1 border border-[--border] bg-[--card] disabled:opacity-60">
            {selected === defaultPipelineId ? 'Default ✓' : 'Use for generation'}
          </button>
          <button onClick={save} disabled={saving} className="rounded-md px-3 py-1 bg-[--foreground] text-[--background] disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
          <button onClick={validatePipeline} className="rounded-md px-3 py-1 border border-[--border] bg-[--card]">Validate</button>
          <button onClick={planPipeline} className="rounded-md px-3 py-1 border border-[--border] bg-[--card]">Plan</button>
          <button onClick={seedDefaults} disabled={seeding} className="rounded-md px-3 py-1 border border-[--border] bg-[--card] disabled:opacity-60">{seeding ? 'Seeding…' : 'Seed defaults'}</button>
          <button onClick={inspect} disabled={inspecting} className="rounded-md px-3 py-1 border border-[--border] bg-[--card] disabled:opacity-60">{inspecting ? 'Inspect…' : 'Inspect'}</button>
          <button onClick={() => { try { rfInstance.current?.fitView({ padding: 0.2, includeHiddenNodes: true }) } catch {} }} className="rounded-md px-3 py-1 border border-[--border] bg-[--card]">Fit</button>
          <button onClick={() => { try { rfInstance.current?.setViewport({ x: 0, y: 0, zoom: 1 }) } catch {} }} className="rounded-md px-3 py-1 border border-[--border] bg-[--card]">1:1</button>
          {message && <span className="text-[--muted-foreground]">{message}</span>}
        </div>
      </div>

      {(pipelines.length === 0) ? (
        <div className="rounded-xl border border-dashed border-[--border] bg-[--card] p-8 text-center text-[--muted-foreground]">
          <div className="text-lg mb-2">No pipelines yet</div>
          <div className="mb-4">Click “Seed defaults” to create a standard chapter pipeline with agents.</div>
          <button onClick={seedDefaults} disabled={seeding} className="rounded-md px-4 py-2 bg-[--foreground] text-[--background] disabled:opacity-60">{seeding ? 'Seeding…' : 'Seed defaults'}</button>
        </div>
      ) : (
        <>
          <div className="h-[560px] rounded-xl border border-[--border] bg-[--card] overflow-visible">
            <ReactFlowProvider>
              <FlowCanvas 
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                selectedKey={selected || 'rf'}
                setInstance={(inst) => { rfInstance.current = inst }}
              />
            </ReactFlowProvider>
          </div>
          {/* Node inspector */}
          {selectedNodeId && (
            <div className="rounded-xl border border-[--border] bg-[--card] p-4 text-sm">
              {(() => {
                const pipe = pipelines.find(p => p.id === selected)
                const step = pipe?.steps.find(s => String(s.id) === String(selectedNodeId)) as any
                if (!step) return <div className="text-[--muted-foreground]">Select a node to edit its inputs.</div>
                const retrieval = step.retrieval || {}
                const graphPct = Math.round(((retrieval.graphWeight ?? 0.5) * 100))
                return (
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Step: <span className="font-mono">{step.role}</span></div>
                      <div className="text-xs text-[--muted-foreground]">id: {step.id}</div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <label className="flex items-center gap-2">Input mode
                        <select className="border border-[--border] bg-[--input] px-2 py-1"
                          value={step.inputs_mode || 'concat'}
                          onChange={e => patchStep(step.id, { inputs_mode: e.target.value })}
                        >
                          <option value="concat">concat</option>
                          <option value="merge">merge</option>
                          <option value="summary">summary</option>
                          <option value="first">first</option>
                          <option value="last">last</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-2">Condition
                        <input
                          type="text"
                          placeholder="state.flag === true"
                          className="flex-1 border border-[--border] bg-[--input] px-2 py-1"
                          value={step.inputs_config?.condition?.predicate || ''}
                          onChange={e => {
                            const next = { ...(step.inputs_config || {}), condition: { ...(step.inputs_config?.condition || {}), predicate: e.target.value } }
                            patchStep(step.id, { inputs_config: next })
                          }}
                        />
                      </label>
                      <label className="flex items-center gap-2">Graph %
                        <input type="number" min={0} max={100} className="w-24 border border-[--border] bg-[--input] px-2 py-1"
                          value={graphPct}
                          onChange={e => {
                            const val = Math.max(0, Math.min(100, parseInt(e.target.value || '0', 10)))
                            const g = val / 100
                            const v = 1 - g
                            patchStep(step.id, { retrieval: { ...(step.retrieval || {}), graphWeight: g, vectorWeight: v } })
                          }}
                        />
                      </label>
                      <label className="flex items-center gap-2">Max hops
                        <input type="number" min={1} max={5} className="w-20 border border-[--border] bg-[--input] px-2 py-1"
                          value={retrieval.maxHops ?? 3}
                          onChange={e => {
                            const val = Math.max(1, Math.min(5, parseInt(e.target.value || '3', 10)))
                            patchStep(step.id, { retrieval: { ...(step.retrieval || {}), maxHops: val } })
                          }}
                        />
                      </label>
                    </div>
                    <label className="flex items-center gap-2">Categories
                      <input type="text" className="flex-1 border border-[--border] bg-[--input] px-2 py-1"
                        placeholder="character,location,plotpoint"
                        value={(retrieval.categories || []).join(',')}
                        onChange={e => {
                          const cats = e.target.value.split(',').map(x => x.trim()).filter(Boolean)
                          patchStep(step.id, { retrieval: { ...(step.retrieval || {}), categories: cats } })
                        }}
                      />
                    </label>
                    <div className="text-xs text-[--muted-foreground]">Changes are saved when you click Save above.</div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Plan preview */}
          {(planStages.length > 0 || planIssues.length > 0) && (
            <div className="rounded-xl border border-[--border] bg-[--card] p-4 text-sm">
              <div className="font-medium mb-2">Execution Plan</div>
              {planStages.length > 0 && (
                <ol className="list-decimal ml-5 space-y-1">
                  {planStages.map(st => (
                    <li key={st.index}>
                      Stage {st.index + 1}: {st.steps.map(s => s.role).join(', ')}
                    </li>
                  ))}
                </ol>
              )}
              {planIssues.length > 0 && (
                <div className="mt-3">
                  <div className="font-medium text-red-600">Issues</div>
                  <ul className="list-disc ml-5">
                    {planIssues.map((iss, i) => (<li key={i}>{iss}</li>))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {/* Force visibility as a fallback if RF keeps nodes hidden */}
          <style jsx global>{`
            .react-flow__node { visibility: visible !important; }
            .react-flow__renderer, .react-flow__edges { overflow: visible !important; }
            .react-flow__edges { visibility: visible !important; opacity: 1 !important; z-index: 2 !important; }
            .react-flow__nodes { z-index: 3 !important; pointer-events: all !important; }
            .react-flow__edge-path { stroke: #38bdf8 !important; stroke-width: 1.75px !important; opacity: 0.9 !important; }
            .react-flow__handle { width: 10px !important; height: 10px !important; opacity: 1 !important; pointer-events: all !important; }
            .react-flow__pane { pointer-events: all !important; }
          `}</style>
          <div className="text-xs text-[--muted-foreground]">
            <div>Selected pipeline: <span className="font-mono">{selected || '(none)'}</span></div>
            <div>Steps: {(pipelines.find(p => p.id === selected)?.steps || []).map((s) => s.role).join(' → ') || '(none)'}</div>
          </div>
        </>
      )}
    </div>
  )
}

function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  selectedKey,
  setInstance,
}: {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: (c: Connection) => void
  selectedKey: string
  setInstance: (inst: ReactFlowInstance) => void
}) {
  const rf = useReactFlow()
  useEffect(() => {
    try {
      // log current RF state after external edges change
      const rfe = rf.getEdges?.() || []
      const rfn = rf.getNodes?.() || []
      console.log('[workflows] rf state', { rfEdges: rfe.length, rfNodes: rfn.length, edgesProp: edges.length, nodesProp: nodes.length })
    } catch {}
  }, [edges, nodes, rf])
  useEffect(() => {
    try {
      const ids = nodes.map(n => n.id)
      // force RF to compute internals after nodes set
      if ((rf as any)?.updateNodeInternals) {
        ;(rf as any).updateNodeInternals(ids)
      }
    } catch {}
  }, [nodes, rf])

  return (
    <ReactFlow 
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onEdgeClick={(event, edge) => { try { if (event.altKey || event.metaKey || event.ctrlKey) { event.preventDefault(); event.stopPropagation(); onEdgesChange([{ id: edge.id, type: 'remove' } as any]) } } catch {} }}
      onConnectStart={(params) => { try { console.log('[workflows] onConnectStart', params) } catch {} }}
      onConnectEnd={(event) => { try { console.log('[workflows] onConnectEnd', event.type) } catch {} }}
      fitView
      onlyRenderVisibleElements={false}
      nodesConnectable
      nodesDraggable
      elementsSelectable
      deleteKeyCode={["Backspace", "Delete"]}
      key={selectedKey}
      onInit={(inst) => { setInstance(inst); try { inst.fitView({ padding: 0.2, includeHiddenNodes: true }) } catch {} }}
      connectionLineType={ConnectionLineType.Step}
      connectionMode={ConnectionMode.Loose}
      connectOnClick
      panOnDrag={[2]}
      snapToGrid
      snapGrid={[16, 16]}
      selectionOnDrag
      minZoom={0.3}
      maxZoom={1.75}
      connectionLineStyle={{ stroke: '#38bdf8', strokeWidth: 1.5, opacity: 0.9 }}
      defaultEdgeOptions={{ type: 'step', style: { stroke: '#38bdf8', strokeWidth: 1.75, opacity: 0.9 } }}
      nodeTypes={NODE_TYPES}
    >
      {/* Temporarily remove Background to rule out overlay issues */}
      <Controls />
      <MiniMap pannable zoomable style={{ backgroundColor: 'var(--background, #0a0a0a)' }} maskColor={'rgba(15,20,25,0.82)'} nodeColor={() => 'var(--card, #1f2937)'} nodeStrokeColor={() => 'var(--primary, #38bdf8)'} />
    </ReactFlow>
  )
}
