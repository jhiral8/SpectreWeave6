
'use client'
import React from 'react'

export default function PortalIntegrationsPage() {
  const demo = [
    { id: 'notion', name: 'Notion' },
    { id: 'google-docs', name: 'Google Docs' },
  ]
  const [running, setRunning] = React.useState(false)
  const [result, setResult] = React.useState<any>(null)
  const [checking, setChecking] = React.useState(false)
  const [bridgeStatus, setBridgeStatus] = React.useState<any>(null)
  const [neo4jHealth, setNeo4jHealth] = React.useState<any>(null)
  const [neo4jStatus, setNeo4jStatus] = React.useState<any>(null)
  const [grStatus, setGrStatus] = React.useState<any>(null)
  const [indexes, setIndexes] = React.useState<any>(null)
  const [constraints, setConstraints] = React.useState<any>(null)

  const refreshHealth = async () => {
    setChecking(true)
    try {
      const [b, nh, ns, gr, idx, cons] = await Promise.all([
        fetch('/api/bridge/health', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
        fetch('/api/bridge/neo4j/health', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
        fetch('/api/bridge/neo4j/status', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
        fetch('/api/bridge/graphrag/status', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
        fetch('/api/bridge/neo4j/indexes', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
        fetch('/api/bridge/neo4j/constraints', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
      ])
      setBridgeStatus(b)
      setNeo4jHealth(nh)
      setNeo4jStatus(ns)
      setGrStatus(gr)
      setIndexes(idx)
      setConstraints(cons)
    } finally {
      setChecking(false)
    }
  }
  React.useEffect(() => { refreshHealth() }, [])
  const runIngestAll = async () => {
    setRunning(true)
    setResult(null)
    try {
      const res = await fetch('/api/bridge/graphrag/ingest-all', { method: 'POST' })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : 'Failed' })
    } finally {
      setRunning(false)
    }
  }
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-heading">Integrations</h1>
      <div className="rounded-lg border border-[--border] bg-[--card] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">GraphRAG Health</div>
            <div className="text-sm text-[--muted-foreground]">Bridge, Neo4j, and GraphRAG engine status</div>
          </div>
          <button onClick={refreshHealth} disabled={checking} className="px-3 py-2 rounded border border-[--border]">
            {checking ? 'Checking…' : 'Refresh'}
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded border border-[--border] p-3">
            <div className="font-medium mb-1">Bridge</div>
            <pre className="bg-slate-100 p-2 rounded overflow-auto text-xs">{JSON.stringify(bridgeStatus, null, 2)}</pre>
          </div>
          <div className="rounded border border-[--border] p-3">
            <div className="font-medium mb-1">Neo4j Health</div>
            <pre className="bg-slate-100 p-2 rounded overflow-auto text-xs">{JSON.stringify(neo4jHealth, null, 2)}</pre>
          </div>
          <div className="rounded border border-[--border] p-3">
            <div className="font-medium mb-1">Neo4j Status</div>
            <pre className="bg-slate-100 p-2 rounded overflow-auto text-xs">{JSON.stringify(neo4jStatus, null, 2)}</pre>
          </div>
          <div className="rounded border border-[--border] p-3">
            <div className="font-medium mb-1">GraphRAG Engine</div>
            <pre className="bg-slate-100 p-2 rounded overflow-auto text-xs">{JSON.stringify(grStatus, null, 2)}</pre>
          </div>
          <div className="rounded border border-[--border] p-3 sm:col-span-2">
            <div className="font-medium mb-1">Neo4j Indexes</div>
            <pre className="bg-slate-100 p-2 rounded overflow-auto text-xs">{JSON.stringify(indexes, null, 2)}</pre>
          </div>
          <div className="rounded border border-[--border] p-3 sm:col-span-2">
            <div className="font-medium mb-1">Neo4j Constraints</div>
            <pre className="bg-slate-100 p-2 rounded overflow-auto text-xs">{JSON.stringify(constraints, null, 2)}</pre>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-[--border] bg-[--card] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">GraphRAG</div>
            <div className="text-sm text-[--muted-foreground]">Batch ingest all frameworks into Neo4j</div>
          </div>
          <button onClick={runIngestAll} disabled={running} className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50">
            {running ? 'Ingesting…' : 'Ingest all frameworks'}
          </button>
        </div>
        {result && (
          <pre className="mt-3 text-xs bg-slate-100 p-2 rounded overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {demo.map(i => (
          <li key={i.id} className="rounded-lg border border-[--border] bg-[--card] p-4">
            <div className="font-medium">{i.name}</div>
            <div className="mt-2 text-sm text-[--muted-foreground]">ID: {i.id}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}


