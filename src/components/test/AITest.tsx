'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function AITest() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const testAI = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setError('')
    setResult('')

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          provider: 'gemini',
          maxTokens: 200,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate')
      }

      setResult(data.result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
        AI Integration Test
      </h2>
      
      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a test prompt..."
          className="w-full h-32 px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-black text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
        />
        
        <Button
          onClick={testAI}
          disabled={loading || !prompt.trim()}
          variant="primary"
        >
          {loading ? 'Testing...' : 'Test AI Generation'}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
            AI Response:
          </h3>
          <p className="text-green-700 dark:text-green-300 whitespace-pre-wrap">
            {result}
          </p>
        </div>
      )}
    </div>
  )
}