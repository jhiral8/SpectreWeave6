"use client"

import React, { useEffect, useRef, useState } from 'react'

type ProgressEvent = {
  generationId?: string
  stage?: string
  progress?: number
  currentAgent?: string
  message?: string
  overallProgress?: number
  estimatedTimeRemaining?: number | null
  timestamp?: string
}

export function ActiveGenerationStream({ id }: { id: string }) {
  const [progress, setProgress] = useState<ProgressEvent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const url = `/api/bridge/chapter-generation/${encodeURIComponent(id)}/stream`
    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data)
        setProgress(data)
      } catch {}
    }
    es.onerror = () => {
      setError('Stream error')
      es.close()
    }
    return () => { es.close() }
  }, [id])

  if (error) return <div className="text-xs text-red-600">{error}</div>

  return (
    <div className="text-xs grid gap-1">
      <div className="flex items-center justify-between">
        <div>Stage: <span className="font-medium">{progress?.stage || progress?.currentAgent || '—'}</span></div>
        <div>{Math.round(progress?.overallProgress ?? progress?.progress ?? 0)}%</div>
      </div>
      <div className="h-1.5 bg-[--muted] rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf]" style={{ width: `${Math.max(0, Math.min(100, Math.round(progress?.overallProgress ?? progress?.progress ?? 0)))}%` }} />
      </div>
      {progress?.message && <div className="text-[--muted-foreground]">{progress.message}</div>}
      {typeof progress?.estimatedTimeRemaining === 'number' && (
        <div className="text-[--muted-foreground]">ETA: {Math.ceil(progress.estimatedTimeRemaining / 1000)}s</div>
      )}
      {progress?.timestamp && <div className="text-[--muted-foreground]">{new Date(progress.timestamp).toLocaleTimeString()}</div>}
    </div>
  )
}


