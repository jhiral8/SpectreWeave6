// @ts-nocheck
// Example Node backend server for LangGraph execution.
// This is a scaffold to be adapted in your external backend (BACKEND_ORIGIN).

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { compilePipelineToGraph } from './GraphBuilder.example'
import { EchoLlm, GeminiLlm, AzureLlm, DatabricksLlm } from './llm.example'

const app = express()
app.use(cors())
app.use(bodyParser.json({ limit: '2mb' }))

// In-memory store for demo runs and SSE clients
const runs: Record<string, any> = {}
const sseClients: Record<string, Set<import('express').Response>> = {}

// Simple validators reused here as a baseline
function validatePipeline(pipeline: any) {
  const steps = Array.isArray(pipeline.steps) ? pipeline.steps : []
  const edges = Array.isArray(pipeline.edges) ? pipeline.edges : []
  const idToStep = new Map(steps.map((s: any) => [String(s.id), s]))
  const issues: string[] = []
  for (const e of edges) {
    if (!idToStep.has(String(e.from)) || !idToStep.has(String(e.to))) {
      issues.push(`Edge references missing step: ${e.from} -> ${e.to}`)
    }
  }
  // Kahn's algorithm for plan
  const indeg = new Map<string, number>()
  const adj = new Map<string, Set<string>>()
  steps.forEach((s: any) => { indeg.set(String(s.id), 0); adj.set(String(s.id), new Set()) })
  for (const e of edges) { const f = String(e.from), t = String(e.to); if (idToStep.has(f) && idToStep.has(t)) { adj.get(f)!.add(t); indeg.set(t, (indeg.get(t)||0)+1) } }
  const q: string[] = []; indeg.forEach((v,k)=>{ if (v===0) q.push(k) })
  const visited = new Set<string>()
  const stages: Array<{ index: number; steps: any[] }> = []
  let idx = 0
  if (edges.length === 0 && steps.length > 0) {
    for (const s of steps) { stages.push({ index: idx++, steps: [{ id: String(s.id), role: s.role, agent_id: s.agent_id||null }] }); visited.add(String(s.id)) }
  } else {
    while (q.length) {
      const levelSize = q.length
      const level: any[] = []
      for (let i=0;i<levelSize;i++) {
        const u = q.shift()!
        if (visited.has(u)) continue
        visited.add(u)
        const st = idToStep.get(u)
        if (st) level.push({ id: u, role: st.role, agent_id: st.agent_id||null })
        for (const v of adj.get(u) || []) { indeg.set(v, (indeg.get(v)||0)-1); if ((indeg.get(v)||0)===0) q.push(v) }
      }
      if (level.length) stages.push({ index: idx++, steps: level })
    }
  }
  if (visited.size !== steps.length) {
    const missing = steps.filter((s:any)=>!visited.has(String(s.id))).map((s:any)=>s.role)
    issues.push(`Cycle detected or unreachable steps: ${missing.join(', ')}`)
  }
  return { stages, issues }
}

// Validate endpoint
app.post('/api/pipelines/validate', (req, res) => {
  try {
    const { pipeline } = req.body || {}
    if (!pipeline) return res.status(400).json({ success: false, error: 'pipeline required' })
    const plan = validatePipeline(pipeline)
    return res.json({ success: true, data: plan })
  } catch (e:any) {
    return res.status(500).json({ success: false, error: e?.message || 'Validation failed' })
  }
})

// LLM client
const llm = process.env.GEMINI_API_KEY
  ? new GeminiLlm({ apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL })
  : process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_AI_API_KEY
  ? new AzureLlm({ endpoint: process.env.AZURE_OPENAI_ENDPOINT || process.env.NEXT_PUBLIC_AZURE_AI_ENDPOINT, apiKey: process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_AI_API_KEY, deployment: process.env.AZURE_OPENAI_DEPLOYMENT, apiVersion: process.env.AZURE_OPENAI_API_VERSION })
  : process.env.DATABRICKS_API_TOKEN
  ? new DatabricksLlm({ workspaceUrl: process.env.DATABRICKS_WORKSPACE_URL || process.env.NEXT_PUBLIC_DATABRICKS_WORKSPACE_URL, modelName: process.env.DATABRICKS_MODEL_NAME || process.env.NEXT_PUBLIC_DATABRICKS_MODEL_NAME, apiToken: process.env.DATABRICKS_API_TOKEN })
  : new EchoLlm()

// Role handlers (replace with your production prompts/models)
const handlers = {
  planner: async ({ inputText }: any) => {
    const system = 'You are a senior story planner. Produce a clear outline with beats and scenes.'
    const text = await llm.generate(inputText, { system, maxTokens: 800 })
    return { text }
  },
  scene_builder: async ({ inputText }: any) => {
    const system = 'You are a scene construction expert. Expand outline items into vivid scenes.'
    const text = await llm.generate(inputText, { system, maxTokens: 1200 })
    return { text }
  },
  dialogue_specialist: async ({ inputText }: any) => {
    const system = 'You are a dialogue writer. Add natural, characterful dialogue that advances the story.'
    const text = await llm.generate(inputText, { system, maxTokens: 1000 })
    return { text }
  },
  description_enhancer: async ({ inputText }: any) => {
    const system = 'You add sensory detail and tighten prose without changing plot.'
    const text = await llm.generate(inputText, { system, maxTokens: 1000 })
    return { text }
  },
  consistency_editor: async ({ inputText }: any) => {
    const system = 'Ensure character, plot, tense, and POV consistency. Return corrected text.'
    const text = await llm.generate(inputText, { system, maxTokens: 1000 })
    return { text }
  },
  compiler: async ({ inputText }: any) => {
    const system = 'Compile scenes into a cohesive chapter with smooth transitions.'
    const text = await llm.generate(inputText, { system, maxTokens: 1600 })
    return { text }
  },
}

// Hybrid retriever: replace with real GraphRAG + vector search
const retriever = async ({ goalText, mergedInput, retrieval }: any) => {
  const graphW = retrieval?.graphWeight ?? 0.6
  const vecW = retrieval?.vectorWeight ?? 0.4
  const categories = retrieval?.categories
  const maxHops = retrieval?.maxHops ?? 3
  const graphPart = graphW > 0 ? await mockGraphSearch(goalText, { categories, maxHops }) : []
  const vectorPart = vecW > 0 ? await mockVectorSearch(mergedInput, { limit: 5 }) : []
  return { snippets: [...graphPart, ...vectorPart] }
}

async function mockGraphSearch(query: string, opts: { categories?: string[]; maxHops?: number }) {
  return [`[GraphRAG hops=${opts.maxHops} cats=${opts.categories?.join('|')||'all'}] ${query?.slice(0, 200)}`]
}
async function mockVectorSearch(query: string, opts: { limit?: number }) {
  return [`[VectorRAG k=${opts.limit||5}] ${query?.slice(0, 200)}`]
}

// Helper to emit SSE event to listeners
function emitSse(genId: string, event: string, data: any) {
  const set = sseClients[genId]
  if (!set) return
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const client of set) {
    try { client.write(payload) } catch {}
  }
}

// Generate endpoint
app.post('/api/chapters/generate', async (req, res) => {
  try {
    const body = req.body || {}
    const { pipeline, chapter_goal, generation_id } = body
    if (!pipeline) return res.status(400).json({ error: 'pipeline required' })
    const genId = generation_id || `gen_${Date.now()}`
    const totalNodes = (pipeline.steps || []).filter((s:any)=>s.enabled!==false).length || 1
    runs[genId] = { id: genId, status: 'running', progress: 0, currentAgent: null, startedAt: Date.now(), result: null, totalNodes, completedNodes: 0, pipelineName: pipeline.name }

    const appGraph = await compilePipelineToGraph({
      pipeline,
      handlers,
      retriever,
      sse: (evt) => {
        if (evt.type === 'node_start') {
          runs[genId].currentAgent = evt.role
          emitSse(genId, 'node_start', { currentAgent: evt.role })
        } else if (evt.type === 'node_complete') {
          runs[genId].completedNodes += 1
          runs[genId].progress = Math.round((runs[genId].completedNodes / totalNodes) * 100)
          emitSse(genId, 'node_complete', { role: evt.role, progress: runs[genId].progress })
        }
      },
      summarize: async (texts) => llm.generate(texts.join('\n').slice(0, 4000), { system: 'Summarize the following inputs succinctly.' }),
    })

    // Run asynchronously to allow client to open SSE stream
    ;(async () => {
      try {
        const state = { goal: chapter_goal || '', outputs: {} }
        await appGraph.invoke(state)
        runs[genId].status = 'completed'
        runs[genId].result = state.outputs
        runs[genId].finishedAt = Date.now()
        emitSse(genId, 'completed', { progress: 100 })
      } catch (err:any) {
        runs[genId].status = 'failed'
        runs[genId].error = String(err?.message || err)
        runs[genId].finishedAt = Date.now()
        emitSse(genId, 'error', { error: runs[genId].error })
      }
    })()

    return res.json({ success: true, generation_id: genId })
  } catch (e:any) {
    return res.status(500).json({ error: e?.message || 'Generation failed' })
  }
})

// Status endpoint
app.get('/api/chapters/generations/:id/status', (req, res) => {
  const id = req.params.id
  const run = runs[id]
  if (!run) return res.status(404).json({ error: 'Not found' })
  return res.json({ success: true, status: run.status, progress: { progress: run.progress, message: run.status }, currentAgent: run.currentAgent })
})

// Stream endpoint (SSE)
app.get('/api/chapters/generations/:id/stream', (req, res) => {
  const id = req.params.id
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()
  if (!sseClients[id]) sseClients[id] = new Set()
  sseClients[id].add(res)
  const run = runs[id]
  if (run) {
    res.write(`event: status\ndata: ${JSON.stringify({ progress: run.progress, currentAgent: run.currentAgent, status: run.status })}\n\n`)
  }
  req.on('close', () => { try { sseClients[id].delete(res) } catch {} })
})

// Result endpoint
app.get('/api/chapters/generations/:id', (req, res) => {
  const id = req.params.id
  const run = runs[id]
  if (!run) return res.status(404).json({ error: 'Not found' })
  // Construct a minimal payload compatible with bridge mapping
  const generated_content = Object.values(run.result || {}).map((o:any)=>o?.text || '').join('\n\n')
  const word_count = generated_content.split(/\s+/).filter(Boolean).length
  const data = {
    id,
    generated_content,
    word_count,
    agent_outputs: { scenes_compiled: 0 },
    generation_metadata: {
      pipeline_version: 'v1',
      agents_executed: [],
      total_execution_time: (run.finishedAt||Date.now()) - (run.startedAt||Date.now()),
      tokens_used: 0,
      cost: 0,
      errors_encountered: run.status === 'failed' ? 1 : 0,
    },
  }
  return res.json({ success: true, data })
})

// Active runs
app.get('/api/chapters/active', (req, res) => {
  const active = Object.values(runs).filter((r:any) => r.status === 'running').map((r:any) => ({ id: r.id, progress: r.progress, currentAgent: r.currentAgent, startedAt: r.startedAt, pipelineName: r.pipelineName }))
  return res.json({ success: true, data: active })
})

// History
app.get('/api/chapters/generations', (req, res) => {
  const recent = Object.values(runs).sort((a:any,b:any)=> (b.startedAt||0) - (a.startedAt||0)).slice(0, 50).map((r:any)=> ({ id: r.id, status: r.status, startedAt: r.startedAt, finishedAt: r.finishedAt, pipelineName: r.pipelineName }))
  return res.json({ success: true, data: recent })
})

// Start server (example)
if (require.main === module) {
  const port = process.env.PORT || 3010
  app.listen(port, () => console.log(`LangGraph example backend listening on ${port}`))
}

export default app


