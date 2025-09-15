import { NextRequest, NextResponse } from 'next/server'

export interface MockRequest {
  json: jest.Mock
  headers: Headers
  method: string
  url: string
}

export const createMockRequest = (overrides: Partial<MockRequest> = {}): MockRequest => ({
  json: jest.fn(),
  headers: new Headers(),
  method: 'POST',
  url: 'http://localhost:3000/api/test',
  ...overrides,
})

export const mockNextResponse = () => {
  const jsonSpy = jest.fn()
  
  // Mock NextResponse.json
  const nextResponseJsonSpy = jest.spyOn(NextResponse, 'json').mockImplementation(jsonSpy)
  
  return {
    json: jsonSpy,
    nextResponseJson: nextResponseJsonSpy,
    cleanup: () => {
      nextResponseJsonSpy.mockRestore()
    }
  }
}

export const createImageGenerationRequest = (overrides = {}) => ({
  bookId: 'test-project-id',
  action: 'generate-single',
  pageNumber: 1,
  illustrationPrompt: 'A friendly rabbit in a magical forest',
  style: 'watercolor',
  theme: 'magical-forest',
  targetAge: '3-5',
  ...overrides,
})

export const createBatchImageGenerationRequest = (overrides = {}) => ({
  bookId: 'test-project-id',
  action: 'generate-batch',
  pages: [
    { pageNumber: 1, illustrationPrompt: 'Page 1 illustration' },
    { pageNumber: 2, illustrationPrompt: 'Page 2 illustration' },
  ],
  style: 'watercolor',
  theme: 'magical-forest',
  targetAge: '3-5',
  ...overrides,
})