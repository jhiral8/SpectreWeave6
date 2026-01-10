
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Fallback models for free tier reliability
export const FREE_MODELS = [
  'meta-llama/llama-3.2-3b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemini-flash-1.5-8b-exp:free',
  'qwen/qwen-2-7b-instruct:free'
];

export const POWER_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.1-405b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'mistralai/mistral-7b-instruct:free'
];

export async function callOpenRouterWithFallback(
  primaryModel: string, 
  messages: any[], 
  options: { 
    temperature?: number; 
    max_tokens?: number; 
    type?: 'free' | 'power';
    title?: string;
  } = {}
) {
  const { 
    temperature = 0.7, 
    max_tokens = 2000, 
    type = 'free',
    title = 'SpectreWeave'
  } = options;

  const fallbacks = type === 'power' ? POWER_MODELS : FREE_MODELS;
  
  const attempt = async (model: string) => {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': title
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens
        }),
        // Avoid hanging on slow responses
        signal: AbortSignal.timeout(60000) 
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }
        return { ok: false, status: response.status, error: errorData };
      }

      const data = await response.json();
      return { ok: true, data };
    } catch (err: any) {
      return { 
        ok: false, 
        status: err.name === 'TimeoutError' ? 408 : 500, 
        error: { error: { message: err.message || 'Network error' } } 
      };
    }
  };

  // Try primary model
  let result = await attempt(primaryModel);
  
  // If failed with retryable error (rate limit or server error), try fallbacks
  if (!result.ok && result.status && (result.status === 429 || result.status >= 500 || result.status === 408)) {
    console.warn(`Primary model ${primaryModel} failed with ${result.status}. Trying fallbacks...`);
    
    for (const fallbackModel of fallbacks) {
      if (fallbackModel === primaryModel) continue;
      
      console.info(`Attempting fallback avec ${fallbackModel}...`);
      result = await attempt(fallbackModel);
      
      if (result.ok) {
        console.info(`Fallback to ${fallbackModel} successful.`);
        return result;
      }
    }
  }

  return result;
}

export function handleAIError(result: any) {
  console.error('AI call failed:', result.error);
  const errorMessage = result.error?.error?.message || 'AI service error';
  
  if (errorMessage.includes('rate-limited') || result.status === 429) {
    return { error: 'The AI provider is currently busy. Please try again in 1 minute.', status: 429 };
  }
  
  if (result.status === 408) {
    return { error: 'The request timed out. Please try again.', status: 408 };
  }

  return { error: 'AI service error', status: result.status || 500 };
}
