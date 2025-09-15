import { createClient } from '@supabase/supabase-js'

export interface MockSupabaseClient {
  from: jest.Mock
  auth: {
    getUser: jest.Mock
  }
  storage: {
    from: jest.Mock
  }
  rpc: jest.Mock
}

export interface MockQueryBuilder {
  select: jest.Mock
  insert: jest.Mock
  update: jest.Mock
  delete: jest.Mock
  eq: jest.Mock
  order: jest.Mock
  single: jest.Mock
  maybeSingle: jest.Mock
}

export interface MockStorageBucket {
  upload: jest.Mock
  getPublicUrl: jest.Mock
}

export const createMockSupabaseClient = (): MockSupabaseClient => {
  const mockQueryBuilder: MockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  }

  const mockStorageBucket: MockStorageBucket = {
    upload: jest.fn(),
    getPublicUrl: jest.fn(),
  }

  const mockClient: MockSupabaseClient = {
    from: jest.fn().mockReturnValue(mockQueryBuilder),
    auth: {
      getUser: jest.fn(),
    },
    storage: {
      from: jest.fn().mockReturnValue(mockStorageBucket),
    },
    rpc: jest.fn(),
  }

  return mockClient
}

export const setupSupabaseMock = () => {
  const mockClient = createMockSupabaseClient()
  
  // Mock the createClient functions
  jest.mocked(require('@/lib/supabase/client').createClient).mockReturnValue(mockClient)
  jest.mocked(require('@/lib/supabase/server').createClient).mockReturnValue(mockClient)
  
  return mockClient
}

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {},
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockProject = (overrides = {}) => ({
  id: 'test-project-id',
  title: 'Test Children\'s Book',
  description: 'A test book for verification',
  user_id: 'test-user-id',
  project_type: 'childrens-book',
  author_style: 'dr-seuss',
  book_theme: 'magical-forest',
  illustration_style: 'watercolor',
  target_age: '3-5',
  total_pages: 6,
  book_metadata: {
    main_character: 'Test Character',
    setting: 'Test Setting',
    conflict: 'Test Conflict',
    moral_lesson: 'Test Lesson'
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockBookPage = (overrides = {}) => ({
  id: 'test-page-id',
  project_id: 'test-project-id',
  book_id: 'test-project-id', // For backward compatibility
  page_number: 1,
  content: 'Once upon a time...',
  illustration_prompt: 'A magical forest with friendly animals',
  illustration_url: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockBookPages = (count: number, projectId: string = 'test-project-id') => {
  return Array.from({ length: count }, (_, index) => 
    createMockBookPage({
      id: `test-page-${index + 1}`,
      project_id: projectId,
      book_id: projectId,
      page_number: index + 1,
      content: `Page ${index + 1} content`,
      illustration_prompt: `Illustration prompt for page ${index + 1}`,
    })
  )
}

export const createMockGeneratedImage = (overrides = {}) => ({
  id: 'generated-image-id',
  url: 'https://example.com/test-image.png',
  base64: 'base64-encoded-image-data',
  enhancedPrompt: 'Enhanced illustration prompt',
  metadata: {
    pageNumber: 1,
    style: 'watercolor',
    theme: 'magical-forest',
  },
  ...overrides,
})