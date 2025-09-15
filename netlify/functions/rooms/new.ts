import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { customAlphabet } from 'nanoid'

export const handler = createNetlifyHandler({

  POST: async (request: Request) => {
    export async function POST(request: Request): Promise<Response> {
  // This endpoint creates a new document room
  return new Response(null, {
    status: 307,
    headers: {
      Location: `/${getNanoId()}`,
      'Cache-Control': 'no-store, max-age=0',
    },
  })

  }
})