'use client'

import { useEffect, useState } from 'react'

type DashboardAnalytics = {
  total_chapters_generated: number
  total_cost: number
  average_quality_score: number
  provider_usage: Record<string, number>
  recent_generations: Array<{ id: string; chapter_goal: string; word_count: number; quality_score: number; created_at: string }>
  cost_trends: Array<{ date: string; cost: number }>
}

export default function PortalAnalyticsPage() {
  const [data, setData] = useState<DashboardAnalytics | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/bridge/dashboard/analytics', { cache: 'no-store' })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(payload?.error || 'Failed to load analytics')
        setData(payload?.data || payload)
      } catch (e: any) {
        setError(e?.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-heading">Analytics</h1>
      {loading && (
        <div className="rounded-lg border border-[--border] bg-[--card] p-4 text-sm text-[--muted-foreground]">Loading…</div>
      )}
      {!loading && error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}
      {!loading && data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total Chapters" value={data.total_chapters_generated} />
            <MetricCard label="Total Cost" value={`$${data.total_cost?.toFixed?.(2) ?? data.total_cost}`} />
            <MetricCard label="Avg Quality" value={data.average_quality_score?.toFixed?.(2) ?? data.average_quality_score} />
            <MetricCard label="Providers" value={Object.keys(data.provider_usage || {}).length} />
          </div>

          <div className="rounded-lg border border-[--border] bg-[--card] p-4">
            <h2 className="text-lg font-semibold mb-3">Provider Usage</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.entries(data.provider_usage || {}).map(([name, val]) => (
                <div key={name} className="flex items-center justify-between rounded-md border border-[--border] bg-[--muted]/30 px-3 py-2 text-sm">
                  <span className="text-[--muted-foreground]">{name}</span>
                  <span className="font-medium text-[--foreground]">{val as any}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[--border] bg-[--card] p-4">
            <h2 className="text-lg font-semibold mb-3">Recent Generations</h2>
            <div className="space-y-3">
              {(data.recent_generations || []).slice(0, 10).map((g) => (
                <div key={g.id} className="flex items-center justify-between text-sm rounded-md border border-[--border] bg-[--muted]/30 px-3 py-2">
                  <div className="truncate pr-3">
                    <div className="font-medium text-[--foreground] truncate">{g.chapter_goal || 'Chapter'}</div>
                    <div className="text-[--muted-foreground]">{new Date(g.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-4 text-[--muted-foreground]">
                    <span>{g.word_count} words</span>
                    <span>Q {g.quality_score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-[--border] bg-[--card] p-4">
      <div className="text-sm text-[--muted-foreground]">{label}</div>
      <div className="text-2xl font-bold text-[--foreground]">{value}</div>
    </div>
  )
}


