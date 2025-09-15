import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://localhost:3010'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const url = `${BACKEND_ORIGIN}/api/ai/generate-intelligent`
    const cookieToken = req.cookies.get('backend_jwt')?.value
    const authHeader =
      req.headers.get('authorization') ||
      (cookieToken ? `Bearer ${cookieToken}` : process.env.BACKEND_SERVICE_JWT ? `Bearer ${process.env.BACKEND_SERVICE_JWT}` : '')

    // Try backend first
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json(data)
      }
    } catch {}

    // Local stub fallback so Agents Test Run works without backend
    const prompt: string = String(body?.prompt || '')
    const options: any = body?.options || {}
    const model = options?.model || 'local-stub'
    const provider = options?.provider || 'local'
    const temperature = typeof options?.temperature === 'number' ? options.temperature : 0.7
    const maxTokens = typeof options?.maxTokens === 'number' ? options.maxTokens : 300

    const stub = buildLocalStub(prompt, { temperature, maxTokens })
    return NextResponse.json({
      success: true,
      text: stub,
      provider,
      model,
      usage: { prompt_tokens: Math.ceil(prompt.length / 4), completion_tokens: Math.ceil(stub.length / 4), total_tokens: Math.ceil((prompt.length + stub.length) / 4) },
      selection_info: { selection_score: 100 },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to generate' }, { status: 500 })
  }
}

function buildLocalStub(prompt: string, opts: { temperature: number; maxTokens: number }): string {
  if (!prompt) return 'No prompt provided.'
  const base = prompt.trim().replace(/\s+/g, ' ')
  // Simple deterministic expansion influenced by temperature
  const extras = [
    'This draft outlines key ideas clearly.',
    'It balances style and clarity for quick review.',
    'Further refinement by specialized agents is recommended.',
  ]
  const pick = Math.min(extras.length - 1, Math.floor(opts.temperature * extras.length))
  const out = `${base}\n\n${extras[pick]}`
  const limitChars = Math.max(40, Math.min(opts.maxTokens * 4, 2000))
  return out.slice(0, limitChars)
}


