import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import Ably from 'ably'

export const handler = createNetlifyHandler({

  GET: async (request: Request) => {
    export async function GET() {
  try {
    const ablyApiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY

    if (!ablyApiKey) {
      return jsonResponse({
        status: 'error',
        message: 'Ably API key not configured'
      }, { status: 500 })
    }

    // Test Ably connection
    const ably = new Ably.Realtime(ablyApiKey)
    
    // Create a test channel
    const channel = ably.channels.get('test-channel')
    
    // Test basic connection
    const connectionState = ably.connection.state
    
    return jsonResponse({
      status: 'ok',
      message: 'Ably service is configured',
      connectionState,
      timestamp: Date.now(),
      hasApiKey: !!ablyApiKey
    })
  } catch (error: any) {
    return jsonResponse({
      status: 'error',
      message: 'Ably service test failed',
      error: error.message,
      timestamp: Date.now()
    }, { status: 500 })
  }

  }
})