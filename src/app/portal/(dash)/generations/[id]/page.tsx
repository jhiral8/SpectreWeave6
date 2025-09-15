'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type ApiResponse<T = any> = { success?: boolean; data?: T; error?: string }

export default function GenerationDetailsPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [gen, setGen] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scenesToRegen, setScenesToRegen] = useState<string>('')
  const [newInstructions, setNewInstructions] = useState<string>('')
  const [agentIds, setAgentIds] = useState<string>('dialogue_specialist,description_enhancer')
  const [projectId, setProjectId] = useState<string>('')
  const [saveTitle, setSaveTitle] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)
  const [saveMsg, setSaveMsg] = useState<string>('')

  const load = async () => {
    try {
      const res = await fetch(`/api/bridge/chapter-generation/${encodeURIComponent(params.id)}/result`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load')
      setGen(data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (params.id) load() }, [params.id])

  const doRegenerate = async () => {
    try {
      const parsed = (scenesToRegen || '').split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isFinite(n))
      const body: any = { scenes: parsed, new_instructions: newInstructions }
      const res = await fetch(`/api/bridge/chapter-generation/${encodeURIComponent(params.id)}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok || data?.success === false) throw new Error(data?.error || 'Regenerate failed')
      alert('Regeneration started')
      router.push('/portal/generations')
    } catch (e: any) {
      alert(e?.message || 'Failed to regenerate')
    }
  }

  const doRerunAgents = async () => {
    try {
      const agents = (agentIds || '').split(',').map(s => s.trim()).filter(Boolean)
      if (agents.length === 0) throw new Error('Specify at least one agent id')
      const res = await fetch(`/api/bridge/chapter-generation/${encodeURIComponent(params.id)}/rerun-agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_agents: agents, user_feedback: { instructions: newInstructions || undefined } })
      })
      const data = await res.json()
      if (!res.ok || data?.success === false) throw new Error(data?.error || 'Rerun failed')
      alert('Agent rerun started')
      router.push('/portal/generations')
    } catch (e: any) {
      alert(e?.message || 'Failed to rerun agents')
    }
  }

  const doSaveAsChapter = async () => {
    try {
      setSaving(true)
      setSaveMsg('')
      if (!projectId.trim()) throw new Error('Enter a project ID')
      const res = await fetch(`/api/bridge/chapter-generation/${encodeURIComponent(params.id)}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projectId.trim(), title: saveTitle.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok || data?.success === false) throw new Error(data?.error || 'Save failed')
      setSaveMsg('Saved to project successfully')
    } catch (e: any) {
      setSaveMsg(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Loading…</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading">Generation {params.id}</h1>
        <button className="px-3 py-2 rounded border border-[--border]" onClick={() => router.push('/portal/generations')}>Back</button>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium">Result</h2>
        <div className="rounded border border-[--border] bg-[--card] p-3 text-sm whitespace-pre-wrap">
          {gen?.final_chapter || 'No content'}
        </div>
        <div className="text-sm text-[--muted-foreground]">Words: {gen?.word_count ?? 0}</div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Save as Chapter</h2>
        <div className="grid md:grid-cols-3 gap-2 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs text-[--muted-foreground] mb-1">Project ID</label>
            <input className="border border-[--border] bg-[--input] w-full px-2 py-1" placeholder="project UUID" value={projectId} onChange={e => setProjectId(e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs text-[--muted-foreground] mb-1">Title (optional)</label>
            <input className="border border-[--border] bg-[--input] w-full px-2 py-1" placeholder={`Generated Chapter (${params.id})`} value={saveTitle} onChange={e => setSaveTitle(e.target.value)} />
          </div>
          <div>
            <button className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50 w-full" onClick={doSaveAsChapter} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
        {saveMsg && <div className={`text-sm ${saveMsg.includes('success') ? 'text-emerald-600' : 'text-red-600'}`}>{saveMsg}</div>}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Regenerate Scenes</h2>
        <div className="grid md:grid-cols-2 gap-2">
          <input className="border border-[--border] bg-[--input] px-2 py-1" placeholder="Scenes (comma sep) e.g. 2,4" value={scenesToRegen} onChange={e => setScenesToRegen(e.target.value)} />
          <input className="border border-[--border] bg-[--input] px-2 py-1" placeholder="New instructions (optional)" value={newInstructions} onChange={e => setNewInstructions(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={doRegenerate}>Regenerate Selected</button>
          <button className="px-3 py-2 rounded border border-[--border]" onClick={() => { setScenesToRegen(''); setNewInstructions('') }}>Clear</button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Rerun Agents</h2>
        <div className="grid md:grid-cols-2 gap-2">
          <input className="border border-[--border] bg-[--input] px-2 py-1" placeholder="Agent ids (comma sep) e.g. dialogue_specialist,description_enhancer" value={agentIds} onChange={e => setAgentIds(e.target.value)} />
          <input className="border border-[--border] bg-[--input] px-2 py-1" placeholder="Feedback (optional)" value={newInstructions} onChange={e => setNewInstructions(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={doRerunAgents}>Rerun Agents</button>
        </div>
      </section>
    </div>
  )
}


