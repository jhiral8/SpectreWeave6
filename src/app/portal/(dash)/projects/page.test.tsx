/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import PortalProjectsPage from './page'
import { setupSupabaseMock, createMockUser, createMockProject, createMockBookPages } from '@/test/helpers/supabase-mock'

// Mock the hooks
jest.mock('@/hooks/useProjects', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    projects: [],
    isLoading: false,
    error: null,
    createProject: jest.fn(),
    deleteProject: jest.fn(),
    refreshProjects: jest.fn(),
  })),
  useProjectFilters: jest.fn(() => ({
    filters: { status: 'all', sortBy: 'updated_at', sortOrder: 'desc' },
    updateFilters: jest.fn(),
    clearSearch: jest.fn(),
    toggleSort: jest.fn(),
  })),
}))

jest.mock('@/components/portal/ui/toast', () => ({
  useToast: jest.fn(() => jest.fn()),
}))

const mockUseProjects = require('@/hooks/useProjects').default
const mockUseProjectFilters = require('@/hooks/useProjects').useProjectFilters

describe('PortalProjectsPage', () => {
  let mockSupabase: any
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = setupSupabaseMock()
    
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('Book Status Loading with Schema Compatibility', () => {
    it('should load book statuses using project_id first, then book_id fallback', async () => {
      const mockUser = createMockUser()
      const mockProjects = [
        createMockProject({ project_type: 'childrens-book', id: 'book-1' }),
        createMockProject({ project_type: 'childrens-book', id: 'book-2' }),
      ]

      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      // Mock projects hook
      mockUseProjects.mockReturnValue({
        projects: mockProjects,
        isLoading: false,
        error: null,
        createProject: jest.fn(),
        deleteProject: jest.fn(),
        refreshProjects: jest.fn(),
      })

      // Mock book pages queries - project_id returns empty, book_id returns data
      const mockPages1 = createMockBookPages(3, 'book-1').map(page => ({
        id: page.id,
        illustration_url: page.page_number <= 2 ? `https://example.com/img${page.page_number}.png` : null
      }))

      const mockPages2 = createMockBookPages(4, 'book-2').map(page => ({
        id: page.id,
        illustration_url: null // No images
      }))

      // Mock project_id queries return empty
      mockSupabase.from('book_pages').select().eq('project_id')
        .mockResolvedValueOnce({ data: [], error: null }) // book-1 project_id query
        .mockResolvedValueOnce({ data: [], error: null }) // book-2 project_id query

      // Mock book_id queries return data
      mockSupabase.from('book_pages').select().eq('book_id')
        .mockResolvedValueOnce({ data: mockPages1, error: null }) // book-1 book_id query
        .mockResolvedValueOnce({ data: mockPages2, error: null }) // book-2 book_id query

      render(<PortalProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Projects')).toBeInTheDocument()
      })

      // Should show book status badges
      await waitFor(() => {
        expect(screen.getByText('3 pages')).toBeInTheDocument()
        expect(screen.getByText('2/3 illustrated')).toBeInTheDocument()
        expect(screen.getByText('4 pages')).toBeInTheDocument()
        expect(screen.getByText('No images')).toBeInTheDocument()
      })

      // Verify both project_id and book_id queries were made
      expect(mockSupabase.from).toHaveBeenCalledWith('book_pages')
    })

    it('should handle successful project_id queries without fallback', async () => {
      const mockUser = createMockUser()
      const mockProjects = [
        createMockProject({ project_type: 'childrens-book', id: 'book-1' }),
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockUseProjects.mockReturnValue({
        projects: mockProjects,
        isLoading: false,
        error: null,
        createProject: jest.fn(),
        deleteProject: jest.fn(),
        refreshProjects: jest.fn(),
      })

      const mockPages = createMockBookPages(2, 'book-1').map(page => ({
        id: page.id,
        illustration_url: `https://example.com/img${page.page_number}.png`
      }))

      // Mock successful project_id query
      mockSupabase.from('book_pages').select().eq('project_id').mockResolvedValue({
        data: mockPages,
        error: null
      })

      render(<PortalProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('2 pages')).toBeInTheDocument()
        expect(screen.getByText('2/2 illustrated')).toBeInTheDocument()
      })

      // Should not need to query book_id
      expect(mockSupabase.from).toHaveBeenCalledWith('book_pages')
    })

    it('should handle database errors gracefully', async () => {
      const mockUser = createMockUser()
      const mockProjects = [
        createMockProject({ project_type: 'childrens-book', id: 'book-1' }),
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockUseProjects.mockReturnValue({
        projects: mockProjects,
        isLoading: false,
        error: null,
        createProject: jest.fn(),
        deleteProject: jest.fn(),
        refreshProjects: jest.fn(),
      })

      // Mock database errors for both queries
      mockSupabase.from('book_pages').select().eq('project_id').mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      mockSupabase.from('book_pages').select().eq('book_id').mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(<PortalProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Projects')).toBeInTheDocument()
      })

      // Should show loading status when errors occur
      expect(screen.getByText('Loading status...')).toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalledWith('Error loading book status for', 'book-1', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('Book Status Display', () => {
    it('should display correct status badges for different book states', async () => {
      const mockUser = createMockUser()
      const mockProjects = [
        createMockProject({ project_type: 'childrens-book', id: 'empty-book' }),
        createMockProject({ project_type: 'childrens-book', id: 'pages-no-images' }),
        createMockProject({ project_type: 'childrens-book', id: 'complete-book' }),
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockUseProjects.mockReturnValue({
        projects: mockProjects,
        isLoading: false,
        error: null,
        createProject: jest.fn(),
        deleteProject: jest.fn(),
        refreshProjects: jest.fn(),
      })

      // Mock different book states
      const emptyBookPages = [] // No pages
      const pagesNoImagesPages = createMockBookPages(4, 'pages-no-images').map(page => ({
        id: page.id,
        illustration_url: null
      }))
      const completeBookPages = createMockBookPages(6, 'complete-book').map(page => ({
        id: page.id,
        illustration_url: `https://example.com/img${page.page_number}.png`
      }))

      mockSupabase.from('book_pages').select().eq('project_id')
        .mockResolvedValueOnce({ data: emptyBookPages, error: null })
        .mockResolvedValueOnce({ data: pagesNoImagesPages, error: null })
        .mockResolvedValueOnce({ data: completeBookPages, error: null })

      render(<PortalProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Projects')).toBeInTheDocument()
      })

      // Check status displays
      await waitFor(() => {
        expect(screen.getByText('No content')).toBeInTheDocument() // Empty book
        expect(screen.getByText('4 pages')).toBeInTheDocument() // Pages but no images
        expect(screen.getByText('No images')).toBeInTheDocument()
        expect(screen.getByText('6 pages')).toBeInTheDocument() // Complete book
        expect(screen.getByText('6/6 illustrated')).toBeInTheDocument()
      })
    })

    it('should show correct action buttons based on book status', async () => {
      const mockUser = createMockUser()
      const mockProjects = [
        createMockProject({ project_type: 'childrens-book', id: 'book-with-pages' }),
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockUseProjects.mockReturnValue({
        projects: mockProjects,
        isLoading: false,
        error: null,
        createProject: jest.fn(),
        deleteProject: jest.fn(),
        refreshProjects: jest.fn(),
      })

      const mockPages = createMockBookPages(3, 'book-with-pages').map(page => ({
        id: page.id,
        illustration_url: `https://example.com/img${page.page_number}.png`
      }))

      mockSupabase.from('book_pages').select().eq('project_id').mockResolvedValue({
        data: mockPages,
        error: null
      })

      render(<PortalProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('3 pages')).toBeInTheDocument()
      })

      // Should show "Read Book" button when pages exist
      expect(screen.getByText('Read Book')).toBeInTheDocument()
      expect(screen.getByText('Edit Book')).toBeInTheDocument()
      expect(screen.getByText('Project Details')).toBeInTheDocument()
    })
  })

  describe('Project Creation for Children\'s Books', () => {
    it('should create both project and book entries for children\'s books', async () => {
      const mockUser = createMockUser()
      const mockToast = jest.fn()

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockCreateProject = jest.fn().mockResolvedValue({
        id: 'new-project-id',
        title: 'New Children\'s Book',
        project_type: 'childrens-book',
        target_age: '3-5',
        book_theme: 'magical-forest',
        illustration_style: 'watercolor',
        author_style: 'dr-seuss',
        total_pages: 6,
      })

      mockUseProjects.mockReturnValue({
        projects: [],
        isLoading: false,
        error: null,
        createProject: mockCreateProject,
        deleteProject: jest.fn(),
        refreshProjects: jest.fn(),
      })

      require('@/components/portal/ui/toast').useToast.mockReturnValue(mockToast)

      // Mock book creation
      mockSupabase.from('books').insert().mockResolvedValue({
        data: {},
        error: null
      })

      render(<PortalProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('New Project')).toBeInTheDocument()
      })

      // Open create project dialog
      fireEvent.click(screen.getByText('New Project'))

      await waitFor(() => {
        expect(screen.getByText('Project Type')).toBeInTheDocument()
      })

      // Select children's book type
      const childrenBookRadio = screen.getByDisplayValue('childrens-book')
      fireEvent.click(childrenBookRadio)

      // Fill in title
      const titleInput = screen.getByPlaceholderText('The Magical Adventure')
      fireEvent.change(titleInput, { target: { value: 'Test Book' } })

      // Create project
      const createButton = screen.getByRole('button', { name: 'Create' })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(mockCreateProject).toHaveBeenCalledWith({
          title: 'Test Book',
          description: '',
          project_type: 'childrens-book'
        })
      })

      // Should also create book entry and navigate to book creator
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/portal/book-creator/new-project-id')
      })
    })

    it('should handle book creation failure gracefully', async () => {
      const mockUser = createMockUser()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockCreateProject = jest.fn().mockResolvedValue({
        id: 'new-project-id',
        title: 'New Children\'s Book',
        project_type: 'childrens-book',
      })

      mockUseProjects.mockReturnValue({
        projects: [],
        isLoading: false,
        error: null,
        createProject: mockCreateProject,
        deleteProject: jest.fn(),
        refreshProjects: jest.fn(),
      })

      // Mock book creation failure
      mockSupabase.from('books').insert().mockResolvedValue({
        data: null,
        error: new Error('Book creation failed')
      })

      render(<PortalProjectsPage />)

      fireEvent.click(screen.getByText('New Project'))
      
      await waitFor(() => {
        const childrenBookRadio = screen.getByDisplayValue('childrens-book')
        fireEvent.click(childrenBookRadio)
      })

      const titleInput = screen.getByPlaceholderText('The Magical Adventure')
      fireEvent.change(titleInput, { target: { value: 'Test Book' } })

      const createButton = screen.getByRole('button', { name: 'Create' })
      fireEvent.click(createButton)

      // Should still navigate even if book creation fails
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/portal/book-creator/new-project-id')
      })

      expect(consoleSpy).toHaveBeenCalledWith('Note: Could not create book entry:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('Project Actions and Navigation', () => {
    it('should navigate to correct routes based on project type', async () => {
      const mockUser = createMockUser()
      const mockProjects = [
        createMockProject({ 
          project_type: 'childrens-book', 
          id: 'book-id',
          default_doc_id: 'doc-id'
        }),
        createMockProject({ 
          project_type: 'manuscript', 
          id: 'manuscript-id',
          default_doc_id: 'doc-id-2'
        }),
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockUseProjects.mockReturnValue({
        projects: mockProjects,
        isLoading: false,
        error: null,
        createProject: jest.fn(),
        deleteProject: jest.fn(),
        refreshProjects: jest.fn(),
      })

      // Mock book pages for children's book
      mockSupabase.from('book_pages').select().eq('project_id').mockResolvedValue({
        data: createMockBookPages(2, 'book-id').map(page => ({ id: page.id, illustration_url: null })),
        error: null
      })

      render(<PortalProjectsPage />)

      await waitFor(() => {
        expect(screen.getAllByText('Edit Book')).toHaveLength(1)
        expect(screen.getAllByText('Open doc')).toHaveLength(1)
      })

      // Children's book should have edit book button
      const editBookLinks = screen.getAllByRole('link').filter(link => 
        link.textContent?.includes('Edit Book')
      )
      expect(editBookLinks[0]).toHaveAttribute('href', '/portal/book-creator/book-id')

      // Manuscript should have open doc link  
      const openDocLinks = screen.getAllByRole('link').filter(link => 
        link.textContent?.includes('Open doc')
      )
      expect(openDocLinks[0]).toHaveAttribute('href', '/portal/writer/doc-id-2')
    })

    it('should handle project duplication correctly', async () => {
      const mockUser = createMockUser()
      const mockProject = createMockProject()
      const mockToast = jest.fn()

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      mockUseProjects.mockReturnValue({
        projects: [mockProject],
        isLoading: false,
        error: null,
        createProject: jest.fn(),
        deleteProject: jest.fn(),
        refreshProjects: jest.fn(),
      })

      require('@/components/portal/ui/toast').useToast.mockReturnValue(mockToast)

      mockSupabase.from('book_pages').select().eq('project_id').mockResolvedValue({
        data: [],
        error: null
      })

      mockSupabase.from('projects').insert().select().single.mockResolvedValue({
        data: { ...mockProject, title: `${mockProject.title} (Copy)` },
        error: null
      })

      render(<PortalProjectsPage />)

      await waitFor(() => {
        expect(screen.getByText('Duplicate')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Duplicate'))

      await waitFor(() => {
        expect(mockSupabase.from('projects').insert).toHaveBeenCalled()
        expect(mockToast).toHaveBeenCalledWith({ 
          title: 'Duplicated', 
          description: expect.stringContaining('Copy')
        })
      })
    })
  })
})