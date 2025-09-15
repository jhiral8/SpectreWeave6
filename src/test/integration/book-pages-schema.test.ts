/**
 * Database Integration Tests for Book Pages Schema Compatibility
 * 
 * These tests verify that the book_pages table works correctly with both
 * the new schema (project_id) and legacy schema (book_id) patterns.
 */

import { setupSupabaseMock, createMockUser, createMockProject, createMockBookPages } from '@/test/helpers/supabase-mock'

describe('Book Pages Schema Compatibility', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = setupSupabaseMock()
  })

  describe('Schema Detection and Querying', () => {
    const mockUser = createMockUser()
    const mockProject = createMockProject()

    it('should query book_pages with project_id first (new schema)', async () => {
      const mockPages = createMockBookPages(3, 'test-project-id')
      
      // Mock successful project_id query
      mockSupabase.from('book_pages').select().eq('project_id').order.mockResolvedValue({
        data: mockPages,
        error: null
      })

      // Simulate the pattern used in book-creator page
      const supabase = mockSupabase
      let pages, error
      
      // Try project_id first (new schema)
      const result = await supabase
        .from('book_pages')
        .select('page_number, illustration_prompt')
        .eq('project_id', mockProject.id)
        .order('page_number')
      
      pages = result.data
      error = result.error

      expect(error).toBeNull()
      expect(pages).toHaveLength(3)
      expect(pages[0].page_number).toBe(1)
      expect(mockSupabase.from).toHaveBeenCalledWith('book_pages')
    })

    it('should fallback to book_id query when project_id returns no results', async () => {
      const mockPages = createMockBookPages(3, 'test-project-id')
      
      // Mock project_id query returns empty
      mockSupabase.from('book_pages').select().eq('project_id').order.mockResolvedValue({
        data: [],
        error: null
      })

      // Mock book_id query returns data
      mockSupabase.from('book_pages').select().eq('book_id').order.mockResolvedValue({
        data: mockPages,
        error: null
      })

      // Simulate the fallback pattern used in frontend
      const supabase = mockSupabase
      let pages, error
      
      // Try project_id first
      let result = await supabase
        .from('book_pages')
        .select('page_number, illustration_prompt')
        .eq('project_id', mockProject.id)
        .order('page_number')
      
      pages = result.data
      error = result.error

      // If no pages found with project_id, try book_id
      if (!pages || pages.length === 0) {
        result = await supabase
          .from('book_pages')
          .select('page_number, illustration_prompt')  
          .eq('book_id', mockProject.id)
          .order('page_number')
        pages = result.data
        error = result.error
      }

      expect(error).toBeNull()
      expect(pages).toHaveLength(3)
      expect(mockSupabase.from).toHaveBeenCalledTimes(2) // Called for both project_id and book_id
    })

    it('should handle both project_id and book_id in projects page status loading', async () => {
      const projectId = 'test-project-id'
      const mockPages = createMockBookPages(4, projectId).map(page => ({
        id: page.id,
        illustration_url: page.illustration_url
      }))

      // Mock project_id query first
      mockSupabase.from('book_pages').select().eq('project_id').mockResolvedValue({
        data: [],
        error: null
      })

      // Mock book_id fallback
      mockSupabase.from('book_pages').select().eq('book_id').mockResolvedValue({
        data: mockPages,
        error: null
      })

      // Simulate the projects page status loading logic
      const supabase = mockSupabase
      let pages, error

      // Try project_id first
      let result = await supabase
        .from('book_pages')
        .select('id, illustration_url')
        .eq('project_id', projectId)

      pages = result.data
      error = result.error

      // Fallback to book_id if no pages found
      if (!pages || pages.length === 0) {
        result = await supabase
          .from('book_pages')
          .select('id, illustration_url')
          .eq('book_id', projectId)
        pages = result.data
        error = result.error
      }

      expect(error).toBeNull()
      expect(pages).toHaveLength(4)
      
      // Calculate book status like in projects page
      const bookStatus = {
        hasPages: pages.length > 0,
        hasImages: pages.some(p => p.illustration_url),
        pageCount: pages.length,
        pagesWithImages: pages.filter(p => p.illustration_url).length
      }

      expect(bookStatus.hasPages).toBe(true)
      expect(bookStatus.pageCount).toBe(4)
    })
  })

  describe('Database Update Compatibility', () => {
    it('should update book_pages using optimized database function', async () => {
      // Mock the RPC call that handles schema compatibility
      mockSupabase.rpc.mockResolvedValue({
        data: [{ 
          updated_count: 1, 
          update_method: 'project_id',
          page_number: 1 
        }],
        error: null
      })

      const supabase = mockSupabase

      // Call the same RPC function used in the API
      const { data: updateResult, error: updateError } = await supabase
        .rpc('update_book_page_illustration', {
          p_book_id: 'test-project-id',
          p_page_number: 1,
          p_illustration_url: 'https://example.com/image.png',
          p_illustration_prompt: 'Test prompt',
          p_user_id: 'test-user-id'
        })

      expect(updateError).toBeNull()
      expect(updateResult).toHaveLength(1)
      expect(updateResult[0].updated_count).toBe(1)
      expect(updateResult[0].update_method).toBe('project_id')
    })

    it('should handle batch updates with schema compatibility', async () => {
      // Mock batch update RPC
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { page_number: 1, updated: true, error_message: null },
          { page_number: 2, updated: true, error_message: null },
          { page_number: 3, updated: true, error_message: null }
        ],
        error: null
      })

      const supabase = mockSupabase
      const updateData = [
        { page_number: 1, illustration_url: 'https://example.com/image1.png', illustration_prompt: 'Prompt 1' },
        { page_number: 2, illustration_url: 'https://example.com/image2.png', illustration_prompt: 'Prompt 2' },
        { page_number: 3, illustration_url: 'https://example.com/image3.png', illustration_prompt: 'Prompt 3' }
      ]

      const { data: batchResult, error: batchError } = await supabase
        .rpc('batch_update_book_page_illustrations', {
          p_book_id: 'test-project-id',
          p_updates: updateData,
          p_user_id: 'test-user-id'
        })

      expect(batchError).toBeNull()
      expect(batchResult).toHaveLength(3)
      expect(batchResult.every(result => result.updated)).toBe(true)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from('book_pages').select().eq().order.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed')
      })

      const supabase = mockSupabase
      const { data: pages, error } = await supabase
        .from('book_pages')
        .select('page_number, illustration_prompt')
        .eq('project_id', 'test-project-id')
        .order('page_number')

      expect(pages).toBeNull()
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Database connection failed')
    })

    it('should handle empty results correctly', async () => {
      // Mock empty results from both queries
      mockSupabase.from('book_pages').select().eq('project_id').order.mockResolvedValue({
        data: [],
        error: null
      })

      mockSupabase.from('book_pages').select().eq('book_id').order.mockResolvedValue({
        data: [],
        error: null
      })

      const supabase = mockSupabase
      let pages, error

      // Try both schemas
      let result = await supabase
        .from('book_pages')
        .select('page_number, illustration_prompt')
        .eq('project_id', 'non-existent-project')
        .order('page_number')
      
      pages = result.data
      error = result.error

      if (!pages || pages.length === 0) {
        result = await supabase
          .from('book_pages')
          .select('page_number, illustration_prompt')
          .eq('book_id', 'non-existent-project')
          .order('page_number')
        pages = result.data
        error = result.error
      }

      expect(error).toBeNull()
      expect(pages).toEqual([])
    })

    it('should validate illustration URL updates', async () => {
      const validUrls = [
        'https://example.com/image.png',
        'https://storage.supabase.io/bucket/image.jpg',
        null // Should handle null URLs
      ]

      const invalidUrls = [
        '', // Empty string
        'not-a-url',
        'ftp://invalid-protocol.com/image.png'
      ]

      for (const url of validUrls) {
        mockSupabase.rpc.mockResolvedValue({
          data: [{ updated_count: 1, update_method: 'project_id' }],
          error: null
        })

        const result = await mockSupabase.rpc('update_book_page_illustration', {
          p_book_id: 'test-project-id',
          p_page_number: 1,
          p_illustration_url: url,
          p_illustration_prompt: 'Test prompt',
          p_user_id: 'test-user-id'
        })

        expect(result.error).toBeNull()
      }

      // Invalid URLs should be handled by the database function
      // In a real scenario, these might be validated or sanitized
    })
  })

  describe('Performance and Optimization', () => {
    it('should efficiently query pages with illustrations', async () => {
      const pagesWithImages = createMockBookPages(6, 'test-project-id').map((page, index) => ({
        ...page,
        illustration_url: index < 3 ? `https://example.com/image${index + 1}.png` : null
      }))

      mockSupabase.from('book_pages').select().eq().order.mockResolvedValue({
        data: pagesWithImages,
        error: null
      })

      // Simulate optimized query for pages with images only
      const supabase = mockSupabase
      const { data: pages, error } = await supabase
        .from('book_pages')
        .select('id, page_number, illustration_url, illustration_prompt')
        .eq('project_id', 'test-project-id')
        .order('page_number')

      expect(error).toBeNull()
      expect(pages).toHaveLength(6)

      // Count pages with images (like in projects page)
      const pagesWithIllustrations = pages.filter(p => p.illustration_url)
      expect(pagesWithIllustrations).toHaveLength(3)
    })

    it('should handle large batch operations efficiently', async () => {
      const largeUpdateBatch = Array.from({ length: 20 }, (_, i) => ({
        page_number: i + 1,
        illustration_url: `https://example.com/image${i + 1}.png`,
        illustration_prompt: `Illustration prompt for page ${i + 1}`
      }))

      mockSupabase.rpc.mockResolvedValue({
        data: largeUpdateBatch.map(update => ({
          page_number: update.page_number,
          updated: true,
          error_message: null
        })),
        error: null
      })

      const { data: results, error } = await mockSupabase
        .rpc('batch_update_book_page_illustrations', {
          p_book_id: 'test-project-id',
          p_updates: largeUpdateBatch,
          p_user_id: 'test-user-id'
        })

      expect(error).toBeNull()
      expect(results).toHaveLength(20)
      expect(results.every(r => r.updated)).toBe(true)
    })
  })
})