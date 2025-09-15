/**
 * Diagnostic Test for Current 401 Error in Image Generation API
 * 
 * This test focuses specifically on diagnosing the 401 authentication error
 * that's currently preventing image generation from working.
 */

import { createClient } from '@/lib/supabase/server'
import { POST } from '@/app/api/children-books/generate-images/route'
import { NextRequest } from 'next/server'

// Mock the AI service to isolate auth issues
jest.mock('@/lib/ai/childrensBookImages', () => ({
  childrensBookImageService: {
    generateIllustration: jest.fn().mockResolvedValue({
      id: 'mock-id',
      url: 'https://mock.url/image.png',
      base64: 'mock-base64',
      enhancedPrompt: 'Mock enhanced prompt'
    }),
    generateBookIllustrations: jest.fn().mockResolvedValue([])
  }
}))

describe('401 Error Diagnosis for Image Generation API', () => {
  describe('Authentication Layer Analysis', () => {
    it('should diagnose why authentication is failing', async () => {
      // Test 1: Basic request structure
      const basicRequest = new Request('http://localhost:3006/api/children-books/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: 'test-book-id',
          action: 'generate-single',
          pageNumber: 1,
          illustrationPrompt: 'Test illustration',
          style: 'watercolor',
          theme: 'adventure',
          targetAge: '3-5'
        })
      })

      console.log('🔍 Testing basic request without authentication...')
      const basicResponse = await POST(basicRequest as NextRequest)
      const basicData = await basicResponse.json()

      expect(basicResponse.status).toBe(401)
      expect(basicData.error).toBe('Authentication required')
      console.log('✅ Confirmed: API correctly rejects unauthenticated requests')

      // Test 2: Request with invalid auth header
      const invalidAuthRequest = new Request('http://localhost:3006/api/children-books/generate-images', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        },
        body: JSON.stringify({
          bookId: 'test-book-id',
          action: 'generate-single',
          pageNumber: 1,
          illustrationPrompt: 'Test illustration',
          style: 'watercolor',
          theme: 'adventure',
          targetAge: '3-5'
        })
      })

      console.log('🔍 Testing request with invalid auth token...')
      const invalidAuthResponse = await POST(invalidAuthRequest as NextRequest)
      const invalidAuthData = await invalidAuthResponse.json()

      expect(invalidAuthResponse.status).toBe(401)
      console.log('✅ Confirmed: API rejects invalid authentication tokens')
    })

    it('should test Supabase client authentication mechanism', async () => {
      // This test examines the authentication flow in the API
      console.log('🔍 Testing Supabase server client authentication...')

      // Mock a request to test the auth flow
      const mockRequest = {
        headers: new Map([
          ['content-type', 'application/json'],
          ['cookie', 'test-session=mock-value'] // Simulated session cookie
        ]),
        json: async () => ({
          bookId: 'test-book-id',
          action: 'generate-single',
          pageNumber: 1,
          illustrationPrompt: 'Test illustration',
          style: 'watercolor',
          theme: 'adventure',
          targetAge: '3-5'
        })
      } as any

      // The API uses createClient() from @/lib/supabase/server
      // Let's test if this is working correctly
      try {
        const supabase = createClient()
        console.log('✅ Supabase server client created successfully')

        // Test getUser call (this is what fails in the API)
        const { data, error } = await supabase.auth.getUser()
        
        if (error) {
          console.log(`❌ Auth error: ${error.message}`)
          console.log('🔍 This is likely the root cause of the 401 error')
        } else if (!data.user) {
          console.log('⚠️  No user session found (expected in test environment)')
          console.log('🔍 In production, this would be the 401 error cause')
        } else {
          console.log('✅ User authentication successful')
        }
      } catch (error) {
        console.log(`❌ Supabase client creation failed: ${error}`)
      }
    })
  })

  describe('Request Flow Analysis', () => {
    it('should trace the exact request flow causing 401', async () => {
      console.log('🔍 Analyzing request flow that causes 401 error...')

      const testRequest = new Request('http://localhost:3006/api/children-books/generate-images', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // No authentication headers - simulating real client request
        },
        body: JSON.stringify({
          bookId: 'existing-book-id',
          action: 'generate-single',
          pageNumber: 1,
          illustrationPrompt: 'A magical forest scene',
          style: 'watercolor',
          theme: 'magical-forest',
          targetAge: '3-5'
        })
      })

      console.log('📝 Request details:')
      console.log('   Method:', testRequest.method)
      console.log('   URL:', testRequest.url)
      console.log('   Headers:', Object.fromEntries(testRequest.headers.entries()))
      console.log('   Body:', await testRequest.clone().text())

      const response = await POST(testRequest as NextRequest)
      const data = await response.json()

      console.log('📤 Response details:')
      console.log('   Status:', response.status)
      console.log('   Headers:', Object.fromEntries(response.headers.entries()))
      console.log('   Body:', data)

      // Analyze the specific failure point
      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')

      console.log('🎯 Root Cause Analysis:')
      console.log('   • The API is correctly identifying lack of authentication')
      console.log('   • The issue is in the client-side authentication setup')
      console.log('   • Need to verify how the client is sending auth headers')
    })
  })

  describe('Client-Server Auth Mismatch Diagnosis', () => {
    it('should identify authentication token transmission issues', () => {
      console.log('🔍 Diagnosing client-server authentication mismatch...')
      
      // Common issues:
      console.log('📋 Common authentication issues to check:')
      console.log('   1. Frontend not sending Authorization header')
      console.log('   2. Session cookies not being transmitted')
      console.log('   3. Supabase client configuration mismatch')
      console.log('   4. CORS issues preventing auth headers')
      console.log('   5. Middleware intercepting/modifying requests')
      
      // Check environment variables
      const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ]
      
      console.log('🔧 Environment variables check:')
      requiredEnvVars.forEach(envVar => {
        const value = process.env[envVar]
        console.log(`   ${envVar}: ${value ? '✅ Set' : '❌ Missing'}`)
      })
    })

    it('should provide debugging steps for 401 resolution', () => {
      console.log('🛠️  Steps to resolve 401 authentication error:')
      console.log('')
      console.log('1. **Client-side checks:**')
      console.log('   • Verify user is logged in before making API calls')
      console.log('   • Check if session is being properly maintained')
      console.log('   • Ensure auth headers are being sent with requests')
      console.log('')
      console.log('2. **Server-side checks:**')
      console.log('   • Verify Supabase server client configuration')
      console.log('   • Check if middleware is affecting auth headers')
      console.log('   • Validate RLS policies are not blocking access')
      console.log('')
      console.log('3. **Network checks:**')
      console.log('   • Inspect browser network tab for actual request headers')
      console.log('   • Check for CORS issues in browser console')
      console.log('   • Verify cookies are being transmitted')
      console.log('')
      console.log('4. **Testing approach:**')
      console.log('   • Test with a known valid session token')
      console.log('   • Use curl to test API directly with auth headers')
      console.log('   • Check Supabase auth logs for failed attempts')
    })
  })

  describe('Immediate Action Items', () => {
    it('should provide actionable next steps', () => {
      console.log('🎯 Immediate action items to fix 401 error:')
      console.log('')
      console.log('1. **Frontend Debug (High Priority):**')
      console.log('   • Add console.log to see what auth headers are being sent')
      console.log('   • Verify session state before API calls')
      console.log('   • Check if user authentication is working in other parts of app')
      console.log('')
      console.log('2. **API Debug (High Priority):**')
      console.log('   • Add detailed logging to API route authentication section')
      console.log('   • Log the exact error from supabase.auth.getUser()')
      console.log('   • Verify createClient() is using correct configuration')
      console.log('')
      console.log('3. **Quick Test (Immediate):**')
      console.log('   • Use browser dev tools to manually add auth header to request')
      console.log('   • Test API with Postman/curl with valid session token')
      console.log('   • Check if other authenticated API endpoints are working')
      console.log('')
      console.log('4. **Environment Check (Immediate):**')
      console.log('   • Verify .env.local has all required Supabase keys')
      console.log('   • Check if Supabase project is active and accessible')
      console.log('   • Validate RLS policies allow the intended operations')
      
      // This test always passes - it's informational
      expect(true).toBe(true)
    })
  })
})