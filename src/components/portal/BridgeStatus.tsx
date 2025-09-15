"use client"
import React from 'react'

function Dot({ color, title }: { color: string; title: string }) {
  return <span title={title} className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />
}

export function BridgeStatus() {
  const [bridgeHealthy, setBridgeHealthy] = React.useState<boolean | null>(null)
  const [neo4jHealthy, setNeo4jHealthy] = React.useState<boolean | null>(null)

  const check = React.useCallback(async () => {
    try {
      const b = await fetch('/api/bridge/health', { cache: 'no-store' })
      const bj = await b.json().catch(() => ({}))
      setBridgeHealthy(b.ok && (bj?.status === 'healthy' || bj?.status === 'ok'))
    } catch {
      setBridgeHealthy(false)
    }
    try {
      const n = await fetch('/api/bridge/neo4j/health', { cache: 'no-store' })
      const nj = await n.json().catch(() => ({}))
      const ok = n.ok && (nj?.success === true) && (nj?.data?.status === 'healthy')
      setNeo4jHealthy(ok)
    } catch {
      setNeo4jHealthy(false)
    }
  }, [])

  React.useEffect(() => {
    check()
    const id = setInterval(check, 15000)
    return () => clearInterval(id)
  }, [check])

  return (
    <div className="flex items-center gap-2 text-xs text-[--muted-foreground]">
      <div className="flex items-center gap-1">
        <Dot color={bridgeHealthy == null ? 'bg-gray-400' : bridgeHealthy ? 'bg-green-500' : 'bg-red-500'} title={`Bridge: ${bridgeHealthy == null ? 'checking' : bridgeHealthy ? 'healthy' : 'unhealthy'}`} />
        <span className="hidden sm:inline">Bridge</span>
      </div>
      <div className="flex items-center gap-1">
        <Dot color={neo4jHealthy == null ? 'bg-gray-400' : neo4jHealthy ? 'bg-green-500' : 'bg-red-500'} title={`Neo4j: ${neo4jHealthy == null ? 'checking' : neo4jHealthy ? 'healthy' : 'unhealthy'}`} />
        <span className="hidden sm:inline">Neo4j</span>
      </div>
    </div>
  )
}


