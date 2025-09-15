/**
 * OpenCLIP Client for Character Lock System
 * Provides free, self-hosted multimodal embeddings
 */

interface CLIPServerConfig {
  baseUrl: string
  timeout?: number
  retryAttempts?: number
  apiKey?: string
  maxBatchSize?: number
}

interface EmbeddingResponse {
  embedding?: number[]
  embeddings?: number[] | number[][]
  dimension: number
  cached?: boolean
  processing_time?: number
}

interface MultimodalResponse {
  text_embedding: number[]
  image_embedding: number[]
  cross_modal_similarity: number
}

interface ConsistencyResponse {
  consistency_score: number
  image_similarities: number[]
  text_similarity: number | null
  passed: boolean
  threshold: number
  embedding: number[]
  processing_time?: number
  cache_hits?: number
}

interface SimilarityResponse {
  similarity: number
}

interface SearchResult {
  index: number
  similarity: number
}

interface SearchResponse {
  results: SearchResult[]
  total_candidates?: number
  processing_time?: number
}

interface BatchEmbeddingResponse {
  embeddings: number[][]
  dimension: number
  count: number
  processing_time?: number
  cache_hits?: number
}

interface HealthResponse {
  status: string
  model: string
  embedding_dim: number
  device: string
  uptime_seconds: number
  total_requests: number
  cache_enabled: boolean
  system: {
    memory_usage_percent: number
    available_memory_gb: number
    process_memory_mb: number
  }
  gpu?: {
    total_memory_gb: number
    allocated_memory_gb: number
    utilization_percent: number
  }
}

export class CLIPClient {
  private baseUrl: string
  private timeout: number
  private retryAttempts: number
  private apiKey?: string
  private maxBatchSize: number
  private isServerRunning: boolean = false
  private healthStatus: HealthResponse | null = null
  private lastHealthCheck: number = 0
  private healthCheckInterval: number = 60000 // 1 minute

  constructor(config: CLIPServerConfig = {
    baseUrl: process.env.CLIP_SERVER_URL || process.env.NEXT_PUBLIC_CLIP_SERVER_URL || 'http://localhost:5000',
    timeout: 30000,
    retryAttempts: 3,
    maxBatchSize: 32
  }) {
    this.baseUrl = config.baseUrl
    this.timeout = config.timeout || 30000
    this.retryAttempts = config.retryAttempts || 3
    this.apiKey = config.apiKey || process.env.CLIP_API_KEY
    this.maxBatchSize = config.maxBatchSize || 32
    
    // Never check health on initialization - defer until first use
    this.isServerRunning = false
  }

  /**
   * Check if the CLIP server is healthy with caching
   */
  async checkHealth(force: boolean = false): Promise<boolean> {
    // Check if CLIP is enabled before attempting health check
    const isCharacterLockEnabled = process.env.CHARACTER_LOCK_ENABLED === 'true'
    if (!isCharacterLockEnabled) {
      this.isServerRunning = false
      return false
    }

    const now = Date.now()
    
    // Use cached health status if recent
    if (!force && this.healthStatus && (now - this.lastHealthCheck) < this.healthCheckInterval) {
      return this.isServerRunning
    }

    try {
      const response = await this.request<HealthResponse>('/health', 'GET')
      this.isServerRunning = response.status === 'healthy'
      this.healthStatus = response
      this.lastHealthCheck = now
      
      if (this.isServerRunning) {
        console.log(`CLIP server healthy - Model: ${response.model}, Device: ${response.device}, Uptime: ${Math.round(response.uptime_seconds)}s`)
      }
      
      return this.isServerRunning
    } catch (error) {
      this.isServerRunning = false
      this.healthStatus = null
      // Only log health check warnings if CLIP is supposed to be enabled
      if (process.env.OPENCLIP_SERVICE_TIMEOUT && process.env.OPENCLIP_SERVICE_TIMEOUT !== '0') {
        console.warn('CLIP health check failed:', error)
      }
      return false
    }
  }
  
  /**
   * Get detailed health status
   */
  async getHealthStatus(): Promise<HealthResponse | null> {
    await this.checkHealth(true)
    return this.healthStatus
  }

  /**
   * Generate text embeddings with caching support
   */
  async embedText(text: string | string[], cacheKey?: string): Promise<number[] | number[][]> {
    // Check if CLIP is enabled before attempting
    const isCharacterLockEnabled = process.env.CHARACTER_LOCK_ENABLED === 'true'
    if (!isCharacterLockEnabled) {
      // Return dummy embeddings if CLIP is disabled
      const dummyEmbedding = new Array(512).fill(0).map(() => Math.random())
      return typeof text === 'string' ? dummyEmbedding : [dummyEmbedding]
    }

    const response = await this.request<EmbeddingResponse>('/embed/text', 'POST', {
      text: text,
      cache_key: cacheKey
    })
    
    if (response.processing_time) {
      console.debug(`Text embedding took ${response.processing_time}ms`)
    }
    
    return response.embeddings || []
  }

  /**
   * Generate image embeddings with caching support
   * @param image Base64 encoded image or data URL
   * @param cacheKey Optional cache key for the image
   */
  async embedImage(image: string, cacheKey?: string): Promise<number[]> {
    // Check if CLIP is enabled before attempting
    const isCharacterLockEnabled = process.env.CHARACTER_LOCK_ENABLED === 'true'
    if (!isCharacterLockEnabled) {
      // Return dummy embedding if CLIP is disabled
      return new Array(512).fill(0).map(() => Math.random())
    }

    const response = await this.request<EmbeddingResponse>('/embed/image', 'POST', {
      image,
      cache_key: cacheKey
    })
    
    if (response.processing_time) {
      console.debug(`Image embedding took ${response.processing_time}ms`)
    }
    
    return response.embedding || []
  }

  /**
   * Generate both text and image embeddings for multimodal comparison
   */
  async embedMultimodal(text: string, image: string, cacheKey?: string): Promise<MultimodalResponse> {
    return await this.request<MultimodalResponse>('/embed/multimodal', 'POST', {
      text,
      image,
      cache_key: cacheKey
    })
  }
  
  /**
   * Batch process multiple embeddings efficiently
   */
  async batchEmbed(items: (string | {text?: string, image?: string, cache_key?: string})[], type: 'text' | 'image'): Promise<number[][]> {
    // Split into chunks if needed
    const chunks = []
    for (let i = 0; i < items.length; i += this.maxBatchSize) {
      chunks.push(items.slice(i, i + this.maxBatchSize))
    }
    
    const allEmbeddings: number[][] = []
    
    for (const chunk of chunks) {
      const response = await this.request<BatchEmbeddingResponse>('/embed/batch', 'POST', {
        items: chunk,
        batch_type: type
      })
      
      allEmbeddings.push(...response.embeddings)
      
      if (response.processing_time) {
        console.debug(`Batch embedding (${chunk.length} items) took ${response.processing_time}ms`)
      }
    }
    
    return allEmbeddings
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  async calculateSimilarity(embedding1: number[], embedding2: number[]): Promise<number> {
    const response = await this.request<SimilarityResponse>('/similarity', 'POST', {
      embedding1,
      embedding2
    })
    
    return response.similarity
  }

  /**
   * Find most similar embeddings from candidates
   */
  async findSimilar(
    queryEmbedding: number[],
    candidateEmbeddings: number[][],
    topK: number = 5
  ): Promise<SearchResult[]> {
    const response = await this.request<SearchResponse>('/search', 'POST', {
      query_embedding: queryEmbedding,
      candidate_embeddings: candidateEmbeddings,
      top_k: topK
    })
    
    return response.results
  }

  /**
   * Check character consistency between generated and reference images with optimizations
   */
  async checkCharacterConsistency(
    generatedImage: string,
    referenceImages: string[],
    textDescription?: string,
    threshold: number = 0.85
  ): Promise<ConsistencyResponse> {
    const startTime = Date.now()
    
    const response = await this.request<ConsistencyResponse>('/character/consistency', 'POST', {
      generated_image: generatedImage,
      reference_images: referenceImages,
      text_description: textDescription,
      threshold
    })
    
    const totalTime = Date.now() - startTime
    console.debug(`Character consistency check took ${totalTime}ms (server: ${response.processing_time}ms)`)
    
    return response
  }

  /**
   * Convert image URL to base64 for embedding
   */
  async imageUrlToBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          // Remove data URL prefix if needed
          const base64Data = base64.split(',')[1] || base64
          resolve(base64Data)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Error converting image to base64:', error)
      throw error
    }
  }

  /**
   * Calculate similarity directly without server (for cached embeddings)
   */
  calculateSimilarityLocal(embedding1: number[], embedding2: number[]): number {
    // Normalize vectors
    const norm1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0))
    const norm2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0))
    
    const normalized1 = embedding1.map(val => val / norm1)
    const normalized2 = embedding2.map(val => val / norm2)
    
    // Calculate dot product (cosine similarity for normalized vectors)
    return normalized1.reduce((sum, val, i) => sum + val * normalized2[i], 0)
  }

  /**
   * Batch process multiple images for efficiency
   */
  async batchEmbedImages(images: string[]): Promise<number[][]> {
    const embeddings: number[][] = []
    
    // Process in parallel with concurrency limit
    const batchSize = 5
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize)
      const batchPromises = batch.map(img => this.embedImage(img))
      const batchResults = await Promise.all(batchPromises)
      embeddings.push(...batchResults)
    }
    
    return embeddings
  }

  /**
   * Make HTTP request to CLIP server with enhanced retry logic and monitoring
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any,
    attempt: number = 1
  ): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    const startTime = Date.now()

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'SpectreWeave-CLIP-Client/1.0'
      }
      
      // Add API key if available
      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey
      }
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const requestTime = Date.now() - startTime

      if (!response.ok) {
        let error = 'Unknown error'
        try {
          const errorData = await response.json()
          error = errorData.detail || errorData.error || errorData.message || error
        } catch {
          error = await response.text()
        }
        
        throw new Error(`CLIP server error (${response.status}): ${error}`)
      }

      const result = await response.json()
      
      // Log slow requests
      if (requestTime > 5000) {
        console.warn(`Slow CLIP request: ${endpoint} took ${requestTime}ms`)
      }
      
      return result
    } catch (error: any) {
      clearTimeout(timeoutId)
      const requestTime = Date.now() - startTime

      // Enhanced retry logic
      const isRetryableError = (
        error.name === 'AbortError' || 
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        (error.message.includes('500') || error.message.includes('502') || error.message.includes('503'))
      )
      
      if (attempt < this.retryAttempts && isRetryableError) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // Exponential backoff, max 10s
        // Only log retry warnings if CLIP is supposed to be enabled
        if (process.env.OPENCLIP_SERVICE_TIMEOUT && process.env.OPENCLIP_SERVICE_TIMEOUT !== '0') {
          console.warn(`Retrying CLIP request (attempt ${attempt + 1}/${this.retryAttempts}) after ${delay}ms delay...`)
        }
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.request<T>(endpoint, method, body, attempt + 1)
      }

      // Add request context to error
      error.message = `CLIP request failed after ${requestTime}ms (attempt ${attempt}/${this.retryAttempts}): ${error.message}`
      throw error
    }
  }

  /**
   * Start the CLIP server locally (if not running)
   * Note: This requires Python environment to be set up
   */
  async startServer(): Promise<void> {
    if (this.isServerRunning) {
      console.log('CLIP server is already running')
      return
    }

    console.log('Starting CLIP server...')
    
    // This would typically be handled by a process manager
    // or Docker container in production
    const { spawn } = require('child_process')
    const serverPath = require('path').join(
      __dirname, 
      '../../services/openclip/clip_server.py'
    )
    
    const pythonProcess = spawn('python', [serverPath], {
      env: { ...process.env, CLIP_PORT: '5000' }
    })

    pythonProcess.stdout.on('data', (data: Buffer) => {
      console.log(`CLIP server: ${data.toString()}`)
    })

    pythonProcess.stderr.on('data', (data: Buffer) => {
      console.error(`CLIP server error: ${data.toString()}`)
    })

    // Wait for server to be ready
    let retries = 30
    while (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (await this.checkHealth()) {
        console.log('CLIP server started successfully')
        return
      }
      retries--
    }

    throw new Error('Failed to start CLIP server')
  }
}

// Export singleton instance with production configuration
// Use HuggingFace CLIP as fallback when local server is unavailable
import { HuggingFaceCLIPClient } from './clipClient-huggingface'

// Create a hybrid client that uses HuggingFace if local server fails
class HybridCLIPClient extends CLIPClient {
  private hfClient: HuggingFaceCLIPClient | null = null
  
  constructor(config: CLIPServerConfig) {
    super(config)
  }
  
  private getHfClient(): HuggingFaceCLIPClient {
    if (!this.hfClient) {
      this.hfClient = new HuggingFaceCLIPClient()
    }
    return this.hfClient
  }
  
  async embedText(text: string | string[], cacheKey?: string): Promise<number[] | number[][]> {
    // Check if CLIP is enabled before attempting
    const isCharacterLockEnabled = process.env.CHARACTER_LOCK_ENABLED === 'true'
    if (!isCharacterLockEnabled) {
      // Return dummy embeddings if CLIP is disabled
      const dummyEmbedding = new Array(512).fill(0).map(() => Math.random())
      return typeof text === 'string' ? dummyEmbedding : [dummyEmbedding]
    }

    try {
      return await super.embedText(text, cacheKey)
    } catch (error) {
      // Only log fallback messages if CLIP was supposed to be enabled
      if (process.env.OPENCLIP_SERVICE_TIMEOUT && process.env.OPENCLIP_SERVICE_TIMEOUT !== '0') {
        console.log('Local CLIP server unavailable, using HuggingFace fallback')
      }
      if (typeof text === 'string') {
        return await this.getHfClient().getTextEmbedding(text)
      } else {
        // Handle array of strings
        const embeddings = []
        for (const t of text) {
          embeddings.push(await this.getHfClient().getTextEmbedding(t))
        }
        return embeddings
      }
    }
  }
  
  async embedImage(image: string, cacheKey?: string): Promise<number[]> {
    // Check if CLIP is enabled before attempting
    const isCharacterLockEnabled = process.env.CHARACTER_LOCK_ENABLED === 'true'
    if (!isCharacterLockEnabled) {
      // Return dummy embedding if CLIP is disabled
      return new Array(512).fill(0).map(() => Math.random())
    }

    try {
      return await super.embedImage(image, cacheKey)
    } catch (error) {
      // Only log fallback messages if CLIP was supposed to be enabled
      if (process.env.OPENCLIP_SERVICE_TIMEOUT && process.env.OPENCLIP_SERVICE_TIMEOUT !== '0') {
        console.log('Local CLIP server unavailable, using HuggingFace fallback')
      }
      return await this.getHfClient().getImageEmbedding(image)
    }
  }
}

// Lazy initialization to prevent module-level URL construction during build
let _clipClientInstance: HybridCLIPClient | null = null
export const getClipClient = (): HybridCLIPClient => {
  if (!_clipClientInstance) {
    _clipClientInstance = new HybridCLIPClient({
      baseUrl: process.env.CLIP_SERVER_URL || process.env.NEXT_PUBLIC_CLIP_SERVER_URL || 'http://localhost:5000',
      timeout: parseInt(process.env.CLIP_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.CLIP_RETRY_ATTEMPTS || '3'),
      apiKey: process.env.CLIP_API_KEY,
      maxBatchSize: parseInt(process.env.CLIP_MAX_BATCH_SIZE || '32')
    })
  }
  return _clipClientInstance
}

// Backward compatibility - use getter to ensure lazy initialization
export const clipClient = {
  get instance(): HybridCLIPClient {
    return getClipClient()
  },
  // Proxy all methods to the lazy instance
  embedText: (text: string | string[], cacheKey?: string) => getClipClient().embedText(text, cacheKey),
  embedImage: (image: string, cacheKey?: string) => getClipClient().embedImage(image, cacheKey),
  checkHealth: () => getClipClient().checkHealth(),
  imageUrlToBase64: (url: string) => getClipClient().imageUrlToBase64(url),
  calculateSimilarityLocal: (embedding1: number[], embedding2: number[]) => getClipClient().calculateSimilarityLocal(embedding1, embedding2),
  checkCharacterConsistency: (imageBase64: string, referenceImages: string[], description: string, threshold?: number) => 
    getClipClient().checkCharacterConsistency(imageBase64, referenceImages, description, threshold)
}

// Export types
export type {
  CLIPServerConfig,
  EmbeddingResponse,
  MultimodalResponse,
  ConsistencyResponse,
  SearchResult
}