// @ts-nocheck
export interface LlmClient {
  generate(prompt: string, options?: { system?: string; model?: string; temperature?: number; maxTokens?: number }): Promise<string>
}

// Removed OpenAI adapter per project preference

export class EchoLlm implements LlmClient {
  async generate(prompt: string): Promise<string> { return `[ECHO]\n${prompt.slice(0, 4000)}` }
}

export class GeminiLlm implements LlmClient {
  private apiKey: string
  private model: string

  constructor(opts?: { apiKey?: string; model?: string }) {
    this.apiKey = opts?.apiKey || process.env.GEMINI_API_KEY || ''
    this.model = opts?.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    if (!this.apiKey) {
      console.warn('[GeminiLlm] Missing GEMINI_API_KEY; falling back to echo responses')
    }
  }

  async generate(prompt: string, options?: { system?: string; model?: string; temperature?: number; maxTokens?: number }): Promise<string> {
    if (!this.apiKey) return `[LLM ECHO]\n${prompt.slice(0, 4000)}`
    const model = options?.model || this.model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`
    const body = {
      contents: [
        {
          parts: [
            ...(options?.system ? [{ text: `(system) ${options.system}` }] : []),
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: options?.maxTokens ?? 800,
        temperature: options?.temperature ?? 0.7,
      },
    }
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json().catch(() => ({}))
    return json?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }
}

export class AzureLlm implements LlmClient {
  private endpoint: string
  private apiKey: string
  private deployment: string
  private apiVersion: string

  constructor(opts?: { endpoint?: string; apiKey?: string; deployment?: string; apiVersion?: string }) {
    this.endpoint = (opts?.endpoint || process.env.AZURE_OPENAI_ENDPOINT || process.env.NEXT_PUBLIC_AZURE_AI_ENDPOINT || '').replace(/\/$/, '')
    this.apiKey = opts?.apiKey || process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_AI_API_KEY || ''
    this.deployment = opts?.deployment || process.env.AZURE_OPENAI_DEPLOYMENT || 'o3-mini-2'
    this.apiVersion = opts?.apiVersion || process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview'
    if (!this.endpoint || !this.apiKey) {
      console.warn('[AzureLlm] Missing Azure endpoint/apiKey; falling back to echo responses')
    }
  }

  async generate(prompt: string, options?: { system?: string; model?: string; temperature?: number; maxTokens?: number }): Promise<string> {
    if (!this.endpoint || !this.apiKey) return `[LLM ECHO]\n${prompt.slice(0, 4000)}`
    const url = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`
    const body = {
      messages: [
        ...(options?.system ? [{ role: 'system', content: options.system }] : []),
        { role: 'user', content: prompt },
      ],
      max_completion_tokens: options?.maxTokens ?? 800,
      temperature: options?.temperature ?? 0.7,
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': this.apiKey },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    return json?.choices?.[0]?.message?.content || ''
  }
}

export class DatabricksLlm implements LlmClient {
  private workspaceUrl: string
  private modelName: string
  private apiToken: string

  constructor(opts?: { workspaceUrl?: string; modelName?: string; apiToken?: string }) {
    this.workspaceUrl = (opts?.workspaceUrl || process.env.DATABRICKS_WORKSPACE_URL || process.env.NEXT_PUBLIC_DATABRICKS_WORKSPACE_URL || '').replace(/\/$/, '')
    this.modelName = opts?.modelName || process.env.DATABRICKS_MODEL_NAME || process.env.NEXT_PUBLIC_DATABRICKS_MODEL_NAME || ''
    this.apiToken = opts?.apiToken || process.env.DATABRICKS_API_TOKEN || ''
    if (!this.workspaceUrl || !this.modelName || !this.apiToken) {
      console.warn('[DatabricksLlm] Missing Databricks config; falling back to echo responses')
    }
  }

  async generate(prompt: string, options?: { system?: string; temperature?: number; maxTokens?: number }): Promise<string> {
    if (!this.workspaceUrl || !this.modelName || !this.apiToken) return `[LLM ECHO]\n${prompt.slice(0, 4000)}`
    const endpoint = `${this.workspaceUrl}/serving-endpoints/${this.modelName}/invocations`
    const body = {
      messages: [
        ...(options?.system ? [{ role: 'system', content: options.system }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: options?.maxTokens ?? 800,
      temperature: options?.temperature ?? 0.7,
    }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiToken}` },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    return json?.choices?.[0]?.message?.content || ''
  }
}


