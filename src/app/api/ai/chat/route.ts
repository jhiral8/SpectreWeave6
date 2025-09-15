import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiService } from '@/lib/services/ai'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messages, provider = 'databricks' } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    const chatRequest = {
      messages,
      provider,
      options: {
        maxTokens: 1000,
        temperature: 0.7
      }
    }

    const result = await aiService.getChatCompletion(chatRequest)

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('AI chat completion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete chat' },
      { status: 500 }
    )
  }
}