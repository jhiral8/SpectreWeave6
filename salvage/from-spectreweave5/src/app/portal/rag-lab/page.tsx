"use client"
import React, { useState } from 'react'

type ApiResponse<T = any> = { success?: boolean; data?: T; error?: string }

export default function RAGLabPage() {
  const [stats, setStats] = useState<any>(null)
  const [indexing, setIndexing] = useState(false)
  const [indexResult, setIndexResult] = useState<any>(null)
  const [query, setQuery] = useState('ancient dragon fire')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [frameworkId, setFrameworkId] = useState('fw-demo')
  const [contextQuery, setContextQuery] = useState('The hero confronts the dragon in the ancient temple')
  const [retrieving, setRetrieving] = useState(false)
  const [relevant, setRelevant] = useState<any>(null)
  // GraphRAG
  const [grQuery, setGrQuery] = useState('hero confronts dragon')
  const [grRunning, setGrRunning] = useState(false)
  const [grResults, setGrResults] = useState<any[]>([])
  const [grStatus, setGrStatus] = useState<any>(null)

  const loadStats = async () => {
    try {
      const res = await fetch('/api/bridge/rag/stats', { cache: 'no-store' })
      const data: ApiResponse = await res.json()
      setStats(data?.data || data)
    } catch (e) {
      setStats({ error: 'Failed to load stats' })
    }
  }

  const indexDemoFramework = async () => {
    setIndexing(true)
    setIndexResult(null)
    try {
      const demo = {
        framework: {
          id: 'fw-demo',
          title: 'Demo Framework',
          plotSummary: 'A hero embarks on a quest to confront an ancient dragon in a forgotten temple.',
          characters: [
            { id: 'c1', name: 'Aria', description: 'A brave ranger', traits: ['brave', 'loyal'] },
            { id: 'c2', name: 'Kael', description: 'A wise mage', traits: ['wise', 'calm'] },
          ],
          worldElements: [
            { id: 'w1', name: 'Rivertown', type: 'location', description: 'A riverside town' },
            { id: 'w2', name: 'Ancient Temple', type: 'location', description: 'Ruins deep in the forest' },
          ],
          themes: ['courage', 'friendship'],
        },
      }
      const res = await fetch('/api/bridge/rag/index-framework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demo),
      })
      const data: ApiResponse = await res.json()
      setIndexResult(data)
      await loadStats()
    } catch (e) {
      setIndexResult({ error: 'Indexing failed' })
    } finally {
      setIndexing(false)
    }
  }

  const ingestToGraph = async () => {
    setIndexing(true)
    try {
      const demo = {
        framework: {
          id: 'fw-demo',
          title: 'Demo Framework',
          plotSummary: 'A hero embarks on a quest to confront an ancient dragon in a forgotten temple.',
          characters: [
            { id: 'c1', name: 'Aria', description: 'A brave ranger', traits: ['brave', 'loyal'] },
            { id: 'c2', name: 'Kael', description: 'A wise mage', traits: ['wise', 'calm'] },
          ],
          worldElements: [
            { id: 'w1', name: 'Rivertown', type: 'location', description: 'A riverside town' },
            { id: 'w2', name: 'Ancient Temple', type: 'location', description: 'Ruins deep in the forest' },
          ],
          themes: ['courage', 'friendship'],
        },
      }
      const res = await fetch('/api/bridge/graphrag/ingest-framework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demo),
      })
      const data: ApiResponse = await res.json()
      setIndexResult(data)
    } catch (e) {
      setIndexResult({ error: 'Graph ingestion failed' })
    } finally {
      setIndexing(false)
    }
  }

  const runSearch = async () => {
    setSearching(true)
    setResults([])
    try {
      const res = await fetch('/api/bridge/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data: ApiResponse = await res.json()
      setResults((data?.data as any[]) || [])
    } catch (e) {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const getRelevant = async () => {
    setRetrieving(true)
    setRelevant(null)
    try {
      const res = await fetch('/api/bridge/rag/relevant-elements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ framework_id: frameworkId, context_query: contextQuery }),
      })
      const data: ApiResponse = await res.json()
      setRelevant(data?.data || data)
    } catch (e) {
      setRelevant({ error: 'Retrieval failed' })
    } finally {
      setRetrieving(false)
    }
  }

  const runGraphRAG = async () => {
    setGrRunning(true)
    setGrResults([])
    try {
      const res = await fetch('/api/bridge/graphrag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: grQuery, options: { frameworkId } }),
      })
      const data: ApiResponse = await res.json()
      setGrResults((data?.data as any[]) || [])
    } catch (e) {
      setGrResults([])
    } finally {
      setGrRunning(false)
    }
  }

  const loadGraphRAGStatus = async () => {
    try {
      const res = await fetch('/api/bridge/graphrag/status', { cache: 'no-store' })
      const data: ApiResponse = await res.json()
      setGrStatus(data?.data || data)
    } catch (e) {
      setGrStatus({ error: 'Failed to load GraphRAG status' })
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 text-[--foreground]">
      <h1 className="text-2xl font-semibold text-[--foreground]">RAG Lab</h1>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <button className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50" onClick={indexDemoFramework} disabled={indexing}>
            {indexing ? 'Indexing…' : 'Index demo framework'}
          </button>
          <button className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50" onClick={ingestToGraph} disabled={indexing}>
            {indexing ? 'Ingesting…' : 'Ingest to GraphRAG'}
          </button>
          <button className="px-3 py-2 rounded bg-slate-700 text-white" onClick={loadStats}>Refresh stats</button>
        </div>
        <pre className="bg-[--card] text-[--foreground] border border-[--border] p-3 rounded text-sm overflow-auto">{JSON.stringify(indexResult, null, 2)}</pre>
        <div>
          <h2 className="font-medium text-[--foreground]">Stats</h2>
          <pre className="bg-[--card] text-[--foreground] border border-[--border] p-3 rounded text-sm overflow-auto">{JSON.stringify(stats, null, 2)}</pre>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-[--foreground]">Search</h2>
        <div className="flex gap-2">
          <input className="border border-[--border] bg-[--input] text-[--foreground] px-2 py-1 w-full" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50" onClick={runSearch} disabled={searching}>
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>
        <pre className="bg-[--card] text-[--foreground] border border-[--border] p-3 rounded text-sm overflow-auto">{JSON.stringify(results, null, 2)}</pre>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-[--foreground]">Relevant Elements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="border border-[--border] bg-[--input] text-[--foreground] px-2 py-1" value={frameworkId} onChange={(e) => setFrameworkId(e.target.value)} placeholder="framework_id" />
          <input className="border border-[--border] bg-[--input] text-[--foreground] px-2 py-1" value={contextQuery} onChange={(e) => setContextQuery(e.target.value)} placeholder="context_query" />
        </div>
        <button className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50" onClick={getRelevant} disabled={retrieving}>
          {retrieving ? 'Retrieving…' : 'Get relevant elements'}
        </button>
        <pre className="bg-[--card] text-[--foreground] border border-[--border] p-3 rounded text-sm overflow-auto">{JSON.stringify(relevant, null, 2)}</pre>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-[--foreground]">GraphRAG (Hybrid)</h2>
          <button className="px-3 py-2 rounded bg-slate-700 text-white" onClick={loadGraphRAGStatus}>Status</button>
        </div>
        <div className="flex gap-2">
          <input className="border border-[--border] bg-[--input] text-[--foreground] px-2 py-1 w-full" value={grQuery} onChange={(e) => setGrQuery(e.target.value)} placeholder="hybrid query" />
          <button className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50" onClick={runGraphRAG} disabled={grRunning}>
            {grRunning ? 'Searching…' : 'Hybrid search'}
          </button>
        </div>
        <div>
          <h3 className="text-sm font-medium">Hybrid Results</h3>
          <pre className="bg-[--card] text-[--foreground] border border-[--border] p-3 rounded text-sm overflow-auto">{JSON.stringify(grResults, null, 2)}</pre>
        </div>
        <div>
          <h3 className="text-sm font-medium">Engine Status</h3>
          <pre className="bg-[--card] text-[--foreground] border border-[--border] p-3 rounded text-sm overflow-auto">{JSON.stringify(grStatus, null, 2)}</pre>
        </div>
      </section>
    </div>
  )
}


