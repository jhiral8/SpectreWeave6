// @ts-nocheck
// Reference implementation sketch for compiling a saved pipeline (steps + edges)
// into a LangGraph StateGraph. This is intended for your external Node backend.
// It is not imported by the Next.js app and serves as a guide.

import { StateGraph, Annotation } from '@langchain/langgraph'

export type PipelineDef = {
  id: string
  name: string
  steps: Array<{
    id: string
    role: string
    agent_id?: string | null
    enabled?: boolean
    retrieval?: {
      graphWeight?: number
      vectorWeight?: number
      categories?: string[]
      maxHops?: number
    } | null
    inputs_mode?: 'concat' | 'merge' | 'summary' | 'first' | 'last' | null
    inputs_config?: any | null // e.g., { condition: { predicate: "state.flag === true" } }
  }>
  edges: Array<{ from: string; to: string }>
}

export type NodeHandler = (args: {
  step: PipelineDef['steps'][number]
  inputText: string
  context: any
  state: any
}) => Promise<{ text: string; metadata?: Record<string, any> }>

export type HandlersMap = Record<string, NodeHandler>

export type Retriever = (args: {
  goalText: string
  mergedInput: string
  retrieval?: PipelineDef['steps'][number]['retrieval']
  state: any
}) => Promise<{ snippets: string[]; metadata?: any }>

export type SseEmitter = (event: {
  type: 'node_start' | 'node_complete' | 'node_error'
  stepId: string
  role: string
  data?: any
}) => void

// Very lightweight state shape. Extend as needed.
const State = Annotation.Root({
  outputs: Annotation.Object({}), // stepId -> { text, metadata }
  flags: Annotation.Object({}),
})

function aggregateFanIn(mode: string | null | undefined, inputs: Array<{ text?: string; metadata?: any }>, helpers: { summarize: (texts: string[]) => Promise<string> }): Promise<string> | string {
  const safeTexts = inputs.map(x => x?.text || '').filter(Boolean)
  switch (mode) {
    case 'first':
      return safeTexts[0] || ''
    case 'last':
      return safeTexts.length ? safeTexts[safeTexts.length - 1] : ''
    case 'merge': {
      // naive merge: join JSON if possible, else concat
      try {
        const asJson = inputs.map(x => (typeof x?.text === 'string' ? JSON.parse(x.text) : x?.text)).filter(Boolean)
        return JSON.stringify(asJson.reduce((acc, obj) => Object.assign(acc, obj), {}))
      } catch {
        return safeTexts.join('\n')
      }
    }
    case 'summary':
      return helpers.summarize(safeTexts)
    case 'concat':
    default:
      return safeTexts.join('\n')
  }
}

export async function compilePipelineToGraph(params: {
  pipeline: PipelineDef
  handlers: HandlersMap
  retriever: Retriever
  sse?: SseEmitter
  summarize?: (texts: string[]) => Promise<string>
}) {
  const { pipeline, handlers, retriever, sse, summarize = async (texts) => texts.join('\n').slice(0, 4000) } = params

  const idToStep = new Map(pipeline.steps.map(s => [String(s.id), s]))

  const graph = new StateGraph(State)

  // Add node wrappers that do fan-in aggregation + retrieval + handler
  for (const step of pipeline.steps) {
    if (step.enabled === false) continue
    const role = step.role
    const handler = handlers[role]
    if (!handler) throw new Error(`No handler for role: ${role}`)

    graph.addNode(String(step.id), async (state: any) => {
      try {
        sse?.({ type: 'node_start', stepId: String(step.id), role })

        // Fan-in aggregation: collect parent outputs present in state.outputs
        const parents = pipeline.edges.filter(e => String(e.to) === String(step.id)).map(e => String(e.from))
        const parentOutputs = parents.map(pid => state.outputs?.[pid] || {})
        const aggregated = await aggregateFanIn(step.inputs_mode || 'concat', parentOutputs, { summarize })

        // Hybrid retrieval based on goal + merged input
        const goalText = state?.goal || ''
        const retrieved = await retriever({ goalText, mergedInput: String(aggregated || ''), retrieval: step.retrieval || undefined, state })
        const contextText = (retrieved?.snippets || []).join('\n')

        // Compose final input for the node
        const inputText = [goalText, aggregated, contextText].filter(Boolean).join('\n\n')
        const result = await handler({ step, inputText, context: { retrieved }, state })

        state.outputs = {
          ...(state.outputs || {}),
          [String(step.id)]: { text: result?.text || '', metadata: result?.metadata || {} },
        }

        sse?.({ type: 'node_complete', stepId: String(step.id), role, data: state.outputs[String(step.id)] })
        return state
      } catch (err: any) {
        sse?.({ type: 'node_error', stepId: String(step.id), role, data: { error: String(err?.message || err) } })
        throw err
      }
    })
  }

  // Edges: conditional if inputs_config.condition.predicate exists on source, otherwise direct
  const stepHasPredicate = (sid: string) => {
    const st = idToStep.get(String(sid))
    return !!st?.inputs_config?.condition?.predicate
  }

  const groupedBySource: Record<string, Array<{ to: string }>> = {}
  for (const e of pipeline.edges) {
    groupedBySource[e.from] = groupedBySource[e.from] || []
    groupedBySource[e.from].push({ to: e.to })
  }

  for (const step of pipeline.steps) {
    if (step.enabled === false) continue
    const fromId = String(step.id)
    const outs = groupedBySource[fromId] || []
    if (outs.length === 0) continue

    if (stepHasPredicate(fromId)) {
      // Single predicate routing: truthy => first edge, else next (if exists)
      const predicate = String(step.inputs_config.condition.predicate)
      const nextIds = outs.map(o => String(o.to))
      graph.addConditionalEdges(fromId, async (state: any) => {
        // Unsafe eval by default; replace with sandboxed predicate evaluation in production
        let pass = false
        try { pass = !!(Function('state', `return (${predicate})`))(state) } catch { pass = false }
        return pass ? nextIds[0] : (nextIds[1] || undefined)
      })
    } else {
      // Plain fan-out edges
      for (const o of outs) {
        graph.addEdge(fromId, String(o.to))
      }
    }
  }

  // Auto-start nodes: indegree 0
  const indeg = new Map<string, number>()
  for (const s of pipeline.steps) indeg.set(String(s.id), 0)
  for (const e of pipeline.edges) indeg.set(String(e.to), (indeg.get(String(e.to)) || 0) + 1)
  const startNodes = Array.from(indeg.entries()).filter(([, v]) => v === 0).map(([k]) => k)
  if (startNodes.length > 0) {
    for (let i = 0; i < startNodes.length - 1; i++) {
      graph.addEdge(startNodes[i], startNodes[i + 1]) // allow graph to enter chain; adjust as needed
    }
  }

  const app = graph.compile()
  return app
}


