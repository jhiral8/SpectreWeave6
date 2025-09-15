/**
 * HuggingFace CLIP Client for Character Lock System
 * Uses HuggingFace Inference API (free tier available)
 */

export class HuggingFaceCLIPClient {
  private apiKey: string
  private baseUrl = 'https://api-inference.huggingface.co/models/'
  private model = 'openai/clip-vit-base-patch32' // Free CLIP model
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HUGGINGFACE_API_KEY || ''
    
    // Validate baseUrl to prevent Invalid URL errors during build
    try {
      new URL(this.baseUrl)
    } catch (error) {
      console.warn('Invalid HuggingFace base URL, using fallback')
      this.baseUrl = 'https://api-inference.huggingface.co/models/'
    }
  }

  /**
   * Generate text embeddings using HuggingFace CLIP
   */
  async getTextEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}${this.model}/feature-extraction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text })
      })

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status}`)
      }

      const embeddings = await response.json()
      return Array.isArray(embeddings[0]) ? embeddings[0] : embeddings
    } catch (error) {
      console.error('Error generating text embedding:', error)
      throw error
    }
  }

  /**
   * Generate image embeddings using HuggingFace CLIP
   */
  async getImageEmbedding(imageBase64: string): Promise<number[]> {
    try {
      // For images, we need to use a different endpoint
      const response = await fetch(`${this.baseUrl}${this.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          inputs: {
            image: imageBase64
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status}`)
      }

      const embeddings = await response.json()
      return Array.isArray(embeddings[0]) ? embeddings[0] : embeddings
    } catch (error) {
      console.error('Error generating image embedding:', error)
      throw error
    }
  }

  /**
   * Calculate similarity between two embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension')
    }

    // Cosine similarity
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i]
      norm1 += embedding1[i] * embedding1[i]
      norm2 += embedding2[i] * embedding2[i]
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * Batch process multiple texts
   */
  async getTextEmbeddings(texts: string[]): Promise<number[][]> {
    const promises = texts.map(text => this.getTextEmbedding(text))
    return Promise.all(promises)
  }

  /**
   * Check character consistency
   */
  async checkCharacterConsistency(
    referenceDescription: string,
    generatedImageBase64: string,
    threshold = 0.7
  ): Promise<{
    isConsistent: boolean
    similarity: number
    suggestions?: string[]
  }> {
    try {
      const [textEmb, imageEmb] = await Promise.all([
        this.getTextEmbedding(referenceDescription),
        this.getImageEmbedding(generatedImageBase64)
      ])

      const similarity = this.calculateSimilarity(textEmb, imageEmb)
      const isConsistent = similarity >= threshold

      const result: any = {
        isConsistent,
        similarity
      }

      if (!isConsistent) {
        result.suggestions = [
          'Try adding more specific character details to the prompt',
          'Use the character name consistently in all prompts',
          'Include distinctive features (hair color, clothing, etc.)',
          `Current similarity: ${(similarity * 100).toFixed(1)}%, needs: ${(threshold * 100).toFixed(1)}%`
        ]
      }

      return result
    } catch (error) {
      console.error('Error checking character consistency:', error)
      throw error
    }
  }
}

// Create singleton instance only when needed (lazy initialization)
let _huggingFaceCLIPInstance: HuggingFaceCLIPClient | null = null
export const getHuggingFaceCLIP = () => {
  if (!_huggingFaceCLIPInstance) {
    _huggingFaceCLIPInstance = new HuggingFaceCLIPClient()
  }
  return _huggingFaceCLIPInstance
}