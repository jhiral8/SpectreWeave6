"use client"

import React from 'react'
import { useAIContext } from '@/lib/ai/advancedAIContext'

export function GenerationPipelineWidget() {
  const {
    isChapterGenerating,
    pipelineView,
    currentAgent,
    pipelineProgress,
  } = useAIContext()

  if (!isChapterGenerating || !pipelineView) return null

  return (
    <div className="rounded-md border border-[--border] bg-[--card] p-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="font-medium">{pipelineView.name}</div>
        <div className="text-xs text-[--muted-foreground]">{Math.round(pipelineProgress)}%</div>
      </div>
      <div className="mt-2 h-1.5 w-full bg-[--muted] rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf]" style={{ width: `${Math.max(0, Math.min(100, pipelineProgress))}%` }} />
      </div>
      <ul className="mt-2 grid gap-1">
        {pipelineView.steps.map((s, idx) => {
          const active = currentAgent === s.role
          return (
            <li key={`${s.role}-${idx}`} className={`flex items-center justify-between rounded px-2 py-1 ${active ? 'bg-[--background]' : ''}`}>
              <span className="truncate">{s.name ? `${s.name} · ${s.role}` : s.role}</span>
              {active && <span className="text-[--muted-foreground] text-xs">running…</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}


