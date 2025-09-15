import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/lib/services/ai'

// Test endpoint for AI service validation (bypasses auth for testing)
export async function GET() {
  try {
    const testResults = {
      timestamp: Date.now(),
      services: [] as any[]
    }

    // Test basic AI service availability
    try {
      const testPrompt = "Generate a single word: 'test'"
      
      // Test Gemini
      try {
        const geminiResult = await aiService.generateText({
          prompt: testPrompt,
          provider: 'gemini',
          maxTokens: 10,
          temperature: 0.1,
        })
        testResults.services.push({
          provider: 'gemini',
          status: 'available',
          response: geminiResult?.content?.substring(0, 100) || 'No content'
        })
      } catch (error: any) {
        testResults.services.push({
          provider: 'gemini',
          status: 'error',
          error: error.message
        })
      }

      // Test Azure (if available)
      try {
        const azureResult = await aiService.generateText({
          prompt: testPrompt,
          provider: 'azure',
          maxTokens: 10,
          temperature: 0.1,
        })
        testResults.services.push({
          provider: 'azure',
          status: 'available',
          response: azureResult?.content?.substring(0, 100) || 'No content'
        })
      } catch (error: any) {
        testResults.services.push({
          provider: 'azure',
          status: 'error',
          error: error.message
        })
      }

    } catch (error: any) {
      testResults.services.push({
        provider: 'general',
        status: 'error',
        error: error.message
      })
    }

    return NextResponse.json(testResults)
  } catch (error: any) {
    return NextResponse.json({
      error: 'Test endpoint failed',
      details: error.message,
      timestamp: Date.now()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, provider = 'gemini' } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const result = await aiService.generateText({
      prompt,
      provider,
      maxTokens: 200,
      temperature: 0.7,
    })

    return NextResponse.json({ 
      result,
      provider,
      timestamp: Date.now()
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Failed to generate text',
      timestamp: Date.now()
    }, { status: 500 })
  }
}