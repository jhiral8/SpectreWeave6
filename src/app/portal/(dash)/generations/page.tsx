'use client'

import React, { useEffect, useState } from 'react'
import { ActiveGenerationStream } from '@/components/portal/ActiveGenerationStream'

type ApiResponse<T = any> = { success?: boolean; data?: T; error?: string; pagination?: any }

export default function GenerationsPage() {
  const [history, setHistory] = useState<any[]>([])
  const [active, setActive] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [providerHealth, setProviderHealth] = useState<any>(null)
  const [providerAnalytics, setProviderAnalytics] = useState<any>(null)

  const load = async () => {
    try {
      const [h, a, ph, pa] = await Promise.all([
        fetch('/api/bridge/chapter-generation/history').then(r => r.json() as Promise<ApiResponse<any[]>>),
        fetch('/api/bridge/chapter-generation/active').then(r => r.json() as Promise<ApiResponse<any[]>>),
        fetch('/api/bridge/ai/provider-health').then(r => r.json()).catch(() => ({})),
        fetch('/api/bridge/ai/provider-analytics').then(r => r.json()).catch(() => ({})),
      ])
      setHistory((h as any)?.data || (h as any) || [])
      setActive((a as any)?.data || (a as any) || [])
      setProviderHealth(ph)
      setProviderAnalytics(pa?.data || pa)
    } catch (e: any) {
      setError('Failed to load generations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const cancel = async (id: string) => {
    await fetch(`/api/bridge/chapter-generation/${encodeURIComponent(id)}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'User cancel' }) })
    load()
  }
  const pause = async (id: string) => {
    await fetch(`/api/bridge/chapter-generation/${encodeURIComponent(id)}/pause`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'User pause' }) })
    load()
  }
  const resume = async (id: string) => {
    await fetch(`/api/bridge/chapter-generation/${encodeURIComponent(id)}/resume`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    load()
  }
  const exportGen = async (id: string, format: string) => {
    const url = `/api/bridge/chapter-generation/${encodeURIComponent(id)}/export?format=${encodeURIComponent(format)}`
    window.open(url, '_blank')
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-heading">Generations</h1>
      {error && <div className="rounded border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Active</h2>
          <button className="px-3 py-2 rounded border border-[--border]" onClick={load}>Refresh</button>
        </div>
        {active.length === 0 ? (
          <div className="text-sm text-[--muted-foreground]">No active generations.</div>
        ) : (
          <ul className="space-y-2">
            {active.map((g: any) => (
              <li key={g.id} className="rounded border border-[--border] bg-[--card] p-3 grid gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">{g.id}</div>
                    <div className="text-[--muted-foreground]">{Math.round(g.progress || 0)}% · {g.currentStage || 'running'}</div>
                  </div>
                  <div className="flex gap-2">
                  <button className="px-2 py-1 rounded border border-[--border]" onClick={() => pause(g.id)}>Pause</button>
                  <button className="px-2 py-1 rounded border border-[--border]" onClick={() => cancel(g.id)}>Cancel</button>
                    <a href={`/portal/generations/${encodeURIComponent(g.id)}`} className="px-2 py-1 rounded border border-[--border]">Details</a>
                  </div>
                </div>
                <ActiveGenerationStream id={g.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Provider Health</h2>
        {providerHealth ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(providerHealth).map(([name, h]: any) => (
              <div key={name} className="rounded border border-[--border] bg-[--card] p-3 text-sm">
                <div className="font-medium flex items-center justify-between">
                  <span>{name}</span>
                  <span className={`inline-block w-2 h-2 rounded-full ${h.healthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
                </div>
                <div className="text-[--muted-foreground] mt-1">RT: {h.response_time ?? '—'} ms</div>
                {h.error && <div className="text-xs text-red-600 mt-1">{h.error}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[--muted-foreground]">No health data.</div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Provider Analytics</h2>
        {providerAnalytics ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(providerAnalytics).map(([name, a]: any) => (
              <div key={name} className="rounded border border-[--border] bg-[--card] p-3 text-sm">
                <div className="font-medium">{a.provider_info?.name || name}</div>
                <div className="text-[--muted-foreground] mt-1">Success: {Math.round((a.performance?.success_rate || 0) * 100)}%</div>
                <div className="text-[--muted-foreground]">Avg RT: {a.performance?.average_response_time ?? '—'} ms</div>
                <div className="text-[--muted-foreground]">Daily cost: ${a.usage?.daily_cost?.toFixed?.(2) ?? '—'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[--muted-foreground]">No analytics data.</div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">History</h2>
        {history.length === 0 ? (
          <div className="text-sm text-[--muted-foreground]">No history yet.</div>
        ) : (
          <ul className="space-y-2">
            {history.map((g: any) => (
              <li key={g.id} className="rounded border border-[--border] bg-[--card] p-3 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{g.novel_frameworks?.title || 'Untitled'} · Chapter {g.chapter_number}</div>
                  <div className="text-[--muted-foreground]">{g.status} · {new Date(g.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 rounded border border-[--border]" onClick={() => exportGen(g.id, 'txt')}>Export .txt</button>
                  <button className="px-2 py-1 rounded border border-[--border]" onClick={() => exportGen(g.id, 'md')}>Export .md</button>
                  <button className="px-2 py-1 rounded border border-[--border]" onClick={() => exportGen(g.id, 'html')}>Export .html</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}


