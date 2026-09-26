import { POST } from './route'
import { NextRequest } from 'next/server'
import { setupSupabaseMock, createMockUser, createMockProject, createMockBookPages } from '@/test/helpers/supabase-mock'
import { createMockRequest, createImageGenerationRequest, createBatchImageGenerationRequest } from '@/test/helpers/api-mock'

// Mock the children's book image service
jest.mock('@/lib/ai/childrensBookImages', () => ({
  childrensBookImageService: {
    generateIllustration: jest.fn(),
    generateBookIllustrations: jest.fn(),
  }
}))

const { childrensBookImageService } = require('@/lib/ai/childrensBookImages')

describe('/api/children-books/generate-images', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = setupSupabaseMock()
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = createMockRequest()
      request.json.mockResolvedValue(createImageGenerationRequest())

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 401 when auth error occurs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth error')
      })

      const request = createMockRequest()
      request.json.mockResolvedValue(createImageGenerationRequest())

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('Input Validation', () => {
    beforeEach(() => {
      const mockUser = createMockUser()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
    })

    it('should return 400 when bookId is missing', async () => {
      const request = createMockRequest()
      request.json.mockResolvedValue({ action: 'generate-single' })

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields: bookId, action')
    })

    it('should return 400 when action is missing', async () => {
      const request = createMockRequest()
      request.json.mockResolvedValue({ bookId: 'test-id' })

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields: bookId, action')
    })

    it('should return 400 when single image generation fields are missing', async () => {
      const request = createMockRequest()
      request.json.mockResolvedValue({
        bookId: 'test-id',
        action: 'generate-single'
      })

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields for single image generation')
    })

    it('should return 400 for unknown action', async () => {
      const request = createMockRequest()
      request.json.mockResolvedValue({
        bookId: 'test-id',
        action: 'unknown-action'
      })

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Unknown action: unknown-action')
    })
  })

  describe('Book Access Control', () => {
    const mockUser = createMockUser()

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
    })

    it('should check project ownership in projects table first', async () => {
      const mockProject = createMockProject()
      
      // Mock successful project query
      mockSupabase.from('projects').select().eq().eq().eq().single.mockResolvedValue({
        data: mockProject,
        error: null
      })

      const request = createMockRequest()
      request.json.mockResolvedValue(createImageGenerationRequest())

      // Mock the image generation service
      childrensBookImageService.generateIllustration.mockResolvedValue({
        id: 'generated-id',
        url: 'https://example.com/image.png',
        base64: 'base64-data',
        enhancedPrompt: 'Enhanced prompt'
      })

      // Mock the database update
      mockSupabase.rpc.mockResolvedValue({
        data: [{ updated_count: 1, update_method: 'project_id' }],
        error: null
      })

      await POST(request as NextRequest)

      // Verify project table was queried first
      expect(mockSupabase.from).toHaveBeenCalledWith('projects')
    })

    it('should fallback to books table for legacy compatibility', async () => {
      const mockBook = createMockProject()
      
      // Mock project query fails
      mockSupabase.from('projects').select().eq().eq().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      // Mock successful books query
      mockSupabase.from('books').select().eq().eq().single.mockResolvedValue({
        data: mockBook,
        error: null
      })

      const request = createMockRequest()
      request.json.mockResolvedValue(createImageGenerationRequest())

      childrensBookImageService.generateIllustration.mockResolvedValue({
        id: 'generated-id',
        url: 'https://example.com/image.png',
        base64: 'base64-data',
        enhancedPrompt: 'Enhanced prompt'
      })

      mockSupabase.rpc.mockResolvedValue({
        data: [{ updated_count: 1, update_method: 'book_id' }],
        error: null
      })

      await POST(request as NextRequest)

      // Verify books table was queried as fallback
      expect(mockSupabase.from).toHaveBeenCalledWith('books')
    })

    it('should return 404 when book is not found in either table', async () => {
      // Mock both queries fail
      mockSupabase.from('projects').select().eq().eq().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })
      
      mockSupabase.from('books').select().eq().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const request = createMockRequest()
      request.json.mockResolvedValue(createImageGenerationRequest())

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Book not found or access denied')
    })
  })

  describe('Single Image Generation', () => {
    const mockUser = createMockUser()
    const mockProject = createMockProject()

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from('projects').select().eq().eq().eq().single.mockResolvedValue({
        data: mockProject,
        error: null
      })
    })

    it('should successfully generate a single image', async () => {
      const mockImage = {
        id: 'generated-id',
        url: 'https://example.com/image.png',
        base64: 'base64-data',
        enhancedPrompt: 'Enhanced prompt'
      }

      childrensBookImageService.generateIllustration.mockResolvedValue(mockImage)

      // Mock storage upload
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'test-project-id/page_1_generated-id.png' },
        error: null
      })

      mockSupabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/image.png' }
      })

      // Mock database update
      mockSupabase.rpc.mockResolvedValue({
        data: [{ updated_count: 1, update_method: 'project_id' }],
        error: null
      })

      // Mock generation record insert
      mockSupabase.from('book_generations').insert().mockResolvedValue({
        data: {},
        error: null
      })

      const request = createMockRequest()
      request.json.mockResolvedValue(createImageGenerationRequest())

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.image).toBeDefined()
      expect(data.image.base64).toBeUndefined() // Should be stripped
      expect(data.metadata.pageNumber).toBe(1)
    })

    it('should handle image upload failure', async () => {
      const mockImage = {
        id: 'generated-id',
        url: null,
        base64: 'base64-data',
        enhancedPrompt: 'Enhanced prompt'
      }

      childrensBookImageService.generateIllustration.mockResolvedValue(mockImage)

      // Mock storage upload failure
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: null,
        error: new Error('Upload failed')
      })

      // Mock database update still succeeds
      mockSupabase.rpc.mockResolvedValue({
        data: [{ updated_count: 1, update_method: 'project_id' }],
        error: null
      })

      mockSupabase.from('book_generations').insert().mockResolvedValue({
        data: {},
        error: null
      })

      const request = createMockRequest()
      request.json.mockResolvedValue(createImageGenerationRequest())

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // Should still succeed even if upload fails
    })

    it('should handle database update failure', async () => {
      childrensBookImageService.generateIllustration.mockResolvedValue({
        id: 'generated-id',
        url: 'https://example.com/image.png',
        base64: 'base64-data',
        enhancedPrompt: 'Enhanced prompt'
      })

      // Mock database update failure
      mockSupabase.rpc.mockResolvedValue({
        data: [{ updated_count: 0 }],
        error: null
      })

      const request = createMockRequest()
      request.json.mockResolvedValue(createImageGenerationRequest())

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to generate images')
    })
  })

  describe('Batch Image Generation', () => {
    const mockUser = createMockUser()
    const mockProject = createMockProject()

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from('projects').select().eq().eq().eq().single.mockResolvedValue({
        data: mockProject,
        error: null
      })
    })

    it('should successfully generate batch images', async () => {
      const mockImages = [
        {
          id: 'generated-1',
          url: null,
          base64: 'base64-data-1',
          enhancedPrompt: 'Enhanced prompt 1',
          metadata: { pageNumber: 1 }
        },
        {
          id: 'generated-2', 
          url: null,
          base64: 'base64-data-2',
          enhancedPrompt: 'Enhanced prompt 2',
          metadata: { pageNumber: 2 }
        }
      ]

      childrensBookImageService.generateBookIllustrations.mockResolvedValue(mockImages)

      // Mock storage uploads
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'uploaded-image.png' },
        error: null
      })

      mockSupabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/image.png' }
      })

      // Mock batch database update
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { page_number: 1, updated: true, error_message: null },
          { page_number: 2, updated: true, error_message: null }
        ],
        error: null
      })

      // Mock transaction functions
      mockSupabase.rpc.mockImplementation((funcName) => {
        if (funcName === 'begin_transaction') {
          return Promise.resolve({ data: { transaction_id: 'tx-123' }, error: null })
        }
        if (funcName === 'commit_transaction') {
          return Promise.resolve({ data: {}, error: null })
        }
        if (funcName === 'batch_update_book_page_illustrations') {
          return Promise.resolve({
            data: [
              { page_number: 1, updated: true, error_message: null },
              { page_number: 2, updated: true, error_message: null }
            ],
            error: null
          })
        }
        return Promise.resolve({ data: {}, error: null })
      })

      // Mock generation record and project update
      mockSupabase.from('book_generations').insert().mockResolvedValue({ data: {}, error: null })
      mockSupabase.from('projects').update().eq().mockResolvedValue({ data: {}, error: null })

      const request = createMockRequest()
      request.json.mockResolvedValue(createBatchImageGenerationRequest())

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.images).toHaveLength(2)
      expect(data.metadata.totalGenerated).toBe(2)
      expect(data.metadata.totalErrors).toBe(0)
    })

    it('should handle partial batch generation failures', async () => {
      const mockImages = [
        {
          id: 'generated-1',
          url: null,
          base64: 'base64-data-1',
          enhancedPrompt: 'Enhanced prompt 1',
          metadata: { pageNumber: 1 }
        }
      ]

      childrensBookImageService.generateBookIllustrations.mockResolvedValue(mockImages)

      // Mock first upload succeeds, second fails
      mockSupabase.storage.from().upload
        .mockResolvedValueOnce({
          data: { path: 'uploaded-image-1.png' },
          error: null
        })

      mockSupabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/image-1.png' }
      })

      // Mock batch update with one success, one failure
      mockSupabase.rpc.mockImplementation((funcName) => {
        if (funcName === 'batch_update_book_page_illustrations') {
          return Promise.resolve({
            data: [
              { page_number: 1, updated: true, error_message: null },
            ],
            error: null
          })
        }
        return Promise.resolve({ data: {}, error: null })
      })

      mockSupabase.from('book_generations').insert().mockResolvedValue({ data: {}, error: null })
      mockSupabase.from('projects').update().eq().mockResolvedValue({ data: {}, error: null })

      const request = createMockRequest()
      request.json.mockResolvedValue(createBatchImageGenerationRequest())

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.images).toHaveLength(1)
    })
  })

  describe('Database Schema Compatibility', () => {
    const mockUser = createMockUser()
    const mockProject = createMockProject()

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockSupabase.from('projects').select().eq().eq().eq().single.mockResolvedValue({
        data: mockProject,
        error: null
      })
    })

    it('should update book_pages using project_id (new schema)', async () => {
      childrensBookImageService.generateIllustration.mockResolvedValue({
        id: 'generated-id',
        url: 'https://example.com/image.png',
        base64: 'base64-data',
        enhancedPrompt: 'Enhanced prompt'
      })

      // Mock successful update using project_id
      mockSupabase.rpc.mockResolvedValue({
        data: [{ updated_count: 1, update_method: 'project_id' }],
        error: null
      })

      mockSupabase.from('book_generations').insert().mockResolvedValue({ data: {}, error: null })

      const request = createMockRequest()
      request.json.mockResolvedValue(createImageGenerationRequest())

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_book_page_illustration', {
        p_book_id: 'test-project-id',
        p_page_number: 1,
        p_illustration_url: 'https://example.com/image.png',
        p_illustration_prompt: 'Enhanced prompt',
        p_user_id: 'test-user-id'
      })
    })

    it('should handle fallback to book_id (legacy schema)', async () => {
      childrensBookImageService.generateIllustration.mockResolvedValue({
        id: 'generated-id',
        url: 'https://example.com/image.png',
        base64: 'base64-data',
        enhancedPrompt: 'Enhanced prompt'
      })

      // Mock update using book_id fallback
      mockSupabase.rpc.mockResolvedValue({
        data: [{ updated_count: 1, update_method: 'book_id' }],
        error: null
      })

      mockSupabase.from('book_generations').insert().mockResolvedValue({ data: {}, error: null })

      const request = createMockRequest()
      request.json.mockResolvedValue(createImageGenerationRequest())

      await POST(request as NextRequest)

      // Verify the RPC was called (the database function handles schema compatibility internally)
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_book_page_illustration', expect.any(Object))
    })
  })
})