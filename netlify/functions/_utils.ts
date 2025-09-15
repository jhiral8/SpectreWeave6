import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions"

/**
 * Utility to convert Next.js API route handlers to Netlify Functions
 */
export function createNetlifyHandler(handlers: {
  GET?: (req: Request) => Promise<Response>
  POST?: (req: Request) => Promise<Response>
  PUT?: (req: Request) => Promise<Response>
  DELETE?: (req: Request) => Promise<Response>
  PATCH?: (req: Request) => Promise<Response>
}): Handler {
  return async (event: HandlerEvent, context: HandlerContext) => {
    try {
      const method = event.httpMethod as keyof typeof handlers
      const handler = handlers[method]

      if (!handler) {
        return {
          statusCode: 405,
          body: JSON.stringify({ error: `Method ${method} not allowed` }),
          headers: { 'Content-Type': 'application/json' }
        }
      }

      // Convert Netlify event to Request
      const url = new URL(event.path, `https://${event.headers.host}`)
      if (event.queryStringParameters) {
        Object.entries(event.queryStringParameters).forEach(([key, value]) => {
          if (value) url.searchParams.set(key, value)
        })
      }

      const request = new Request(url, {
        method: event.httpMethod,
        headers: new Headers(event.headers as Record<string, string>),
        body: event.body || undefined
      })

      // Call the handler
      const response = await handler(request)
      
      // Convert Response to Netlify format
      const body = await response.text()
      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })

      return {
        statusCode: response.status,
        body,
        headers
      }
    } catch (error) {
      console.error('Netlify function error:', error)
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        headers: { 'Content-Type': 'application/json' }
      }
    }
  }
}

/**
 * Helper to extract path parameters from Netlify event
 */
export function getPathParams(event: HandlerEvent, pattern: string): Record<string, string> {
  const pathParts = event.path.split('/')
  const patternParts = pattern.split('/')
  const params: Record<string, string> = {}

  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i]
    if (part?.startsWith('[') && part.endsWith(']')) {
      const paramName = part.slice(1, -1)
      params[paramName] = pathParts[i] || ''
    }
  }

  return params
}

/**
 * Helper to get JSON body from request
 */
export async function getJsonBody(request: Request): Promise<any> {
  try {
    const text = await request.text()
    return text ? JSON.parse(text) : {}
  } catch {
    return {}
  }
}

/**
 * Helper to create JSON response
 */
export function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

/**
 * Helper to create error response
 */
export function errorResponse(message: string, status: number = 500): Response {
  return jsonResponse({ error: message }, status)
}