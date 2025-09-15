import { customAlphabet } from 'nanoid'
import { NextRequest } from 'next/server'

export const dynamic = 'auto'
export const dynamicParams = true
export const runtime = 'edge'

const getNanoId = (): string => {
  const nanoid = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz', 10)
  return nanoid()
}

export async function POST(request: NextRequest): Promise<Response> {
  // This endpoint creates a new document room
  return new Response(null, {
    status: 307,
    headers: {
      Location: `/${getNanoId()}`,
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}