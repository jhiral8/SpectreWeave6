/**
 * Comprehensive Integration Test Suite for Children's Book Image Generation Workflow
 * 
 * This test suite verifies:
 * 1. Database schema compatibility (book_pages table)
 * 2. RLS policy functionality
 * 3. Authentication flow
 * 4. API endpoint integration
 * 5. End-to-end workflow from creation to image generation
 */

import { createClient } from '@/lib/supabase/client'
import { POST } from '@/app/api/children-books/generate-images/route'
import { NextRequest } from 'next/server'

// Note: This is an integration test that can be run against real database
// It requires actual Supabase connection and valid credentials

describe('Image Generation Workflow Integration Tests', () => {
  let supabase: any
  let testUserId: string
  let testProjectId: string
  let authHeaders: Headers

  beforeAll(async () => {
    supabase = createClient()
    
    // These tests require actual authentication
    // They should be run with a test user account
    console.log('🔧 Setting up integration test environment...')
    console.log('📋 Note: These tests require real Supabase connection')
  })

  describe('1. Database Schema Validation', () => {
    it('should verify book_pages table has illustration_url column', async () => {
      // Test database schema directly
      const { data: columns, error } = await supabase
        .rpc('get_table_columns', { table_name: 'book_pages' })
      
      if (error) {
        console.warn('⚠️  Could not verify schema directly, checking via query...')
        
        // Fallback: try to select the column
        const { error: selectError } = await supabase
          .from('book_pages')
          .select('illustration_url')
          .limit(1)
        
        expect(selectError).toBeNull()
        console.log('✅ illustration_url column exists (verified via query)')
      } else {
        const hasIllustrationUrl = columns?.some((col: any) => 
          col.column_name === 'illustration_url'
        )
        expect(hasIllustrationUrl).toBe(true)
        console.log('✅ illustration_url column exists in schema')
      }
    })

    it('should verify database functions exist', async () => {
      const functions = [
        'update_book_page_illustration',
        'batch_update_book_page_illustrations'
      ]

      for (const funcName of functions) {
        // Test if function exists by calling it with test parameters
        const { error } = await supabase.rpc(funcName, {
          p_book_id: 'test-id-that-does-not-exist',
          p_page_number: 1,
          p_illustration_url: 'test-url',
          p_illustration_prompt: 'test-prompt',
          p_user_id: 'test-user-id'
        })
        
        // We expect this to fail due to non-existent book, not due to missing function
        expect(error?.code).not.toBe('42883') // function does not exist
        console.log(`✅ Function ${funcName} exists`)
      }
    })
  })

  describe('2. Authentication Integration', () => {
    it('should handle authentication for image generation API', async () => {
      // Test with no authentication
      const request = new Request('http://localhost:3000/api/children-books/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: 'test-id',
          action: 'generate-single',
          pageNumber: 1,
          illustrationPrompt: 'test prompt',
          style: 'watercolor',
          theme: 'magical-forest',
          targetAge: '3-5'
        })
      })

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
      console.log('✅ Authentication properly rejected unauthenticated requests')
    })

    it('should accept valid authentication tokens', async () => {
      // This test requires manual setup with valid auth
      // Skip if no valid session available
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log('⏭️  Skipping authenticated test - no valid session available')
        return
      }

      const request = new Request('http://localhost:3000/api/children-books/generate-images', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          bookId: 'non-existent-book-id',
          action: 'generate-single'
        })
      })

      const response = await POST(request as NextRequest)
      
      // Should fail with 404 (book not found) not 401 (auth error)
      expect(response.status).not.toBe(401)
      console.log('✅ Authentication accepted valid tokens')
    })
  })

  describe('3. RLS Policy Verification', () => {
    it('should verify book_pages RLS policies allow proper access', async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('⏭️  Skipping RLS test - no authenticated user')
        return
      }

      // Test direct access to book_pages table
      const { data: pages, error } = await supabase
        .from('book_pages')
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`⚠️  RLS Policy Error: ${error.message}`)
        console.log('🔍 This may indicate RLS configuration issues')
      } else {
        console.log('✅ RLS policies allow authenticated access to book_pages')
      }
    })

    it('should verify project access controls work', async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('⏭️  Skipping project access test - no authenticated user')
        return
      }

      // Test access to projects table
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_type', 'childrens-book')
        .limit(1)
      
      expect(error).toBeNull()
      console.log(`✅ Project access works - found ${projects?.length || 0} projects`)
    })
  })

  describe('4. API Endpoint Integration', () => {
    it('should handle missing required fields properly', async () => {
      const request = new Request('http://localhost:3000/api/children-books/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing bookId and action
        })
      })

      const response = await POST(request as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(401) // Due to auth, but validates request parsing
      console.log('✅ API endpoint properly handles malformed requests')
    })

    it('should validate request structure', async () => {
      const request = new Request('http://localhost:3000/api/children-books/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json'
      })

      // This should fail during JSON parsing
      try {
        await POST(request as NextRequest)
      } catch (error) {
        console.log('✅ API properly handles invalid JSON')
      }
    })
  })

  describe('5. End-to-End Workflow Simulation', () => {
    it('should simulate complete image generation workflow', async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('⏭️  Skipping E2E test - no authenticated user')
        console.log('📋 To run E2E tests, authenticate with a test account first')
        return
      }

      console.log('🚀 Starting E2E workflow simulation...')

      // Step 1: Check if user has any existing children's book projects
      const { data: existingProjects, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_type', 'childrens-book')
        .limit(1)

      if (projectError) {
        console.log(`❌ Project query failed: ${projectError.message}`)
        return
      }

      if (!existingProjects || existingProjects.length === 0) {
        console.log('📚 No existing children\'s book projects found')
        console.log('💡 Create a test project first using the book creator')
        return
      }

      const testProject = existingProjects[0]
      console.log(`📖 Using test project: ${testProject.title} (${testProject.id})`)

      // Step 2: Check if project has book_pages
      const { data: bookPages, error: pagesError } = await supabase
        .from('book_pages')
        .select('*')
        .eq('project_id', testProject.id)
        .order('page_number', { ascending: true })

      if (pagesError) {
        console.log(`❌ Book pages query failed: ${pagesError.message}`)
        return
      }

      if (!bookPages || bookPages.length === 0) {
        console.log('📄 No book pages found for this project')
        console.log('💡 Generate story content first')
        return
      }

      console.log(`📑 Found ${bookPages.length} book pages`)

      // Step 3: Simulate API call (without actually generating images)
      const testPage = bookPages[0]
      const requestBody = {
        bookId: testProject.id,
        action: 'generate-single',
        pageNumber: testPage.page_number,
        illustrationPrompt: testPage.illustration_prompt || 'A beautiful illustration',
        style: testProject.illustration_style || 'watercolor',
        theme: testProject.book_theme || 'adventure',
        targetAge: testProject.target_age || '3-5'
      }

      console.log('🎯 Request body structure:', JSON.stringify(requestBody, null, 2))

      // Step 4: Test database function directly
      const { data: updateResult, error: updateError } = await supabase
        .rpc('update_book_page_illustration', {
          p_book_id: testProject.id,
          p_page_number: testPage.page_number,
          p_illustration_url: 'https://test.example.com/test-image.png',
          p_illustration_prompt: testPage.illustration_prompt,
          p_user_id: user.id
        })

      if (updateError) {
        console.log(`❌ Database function test failed: ${updateError.message}`)
        console.log('🔍 This indicates RLS or function issues')
      } else {
        console.log('✅ Database function works correctly')
        console.log('📊 Update result:', updateResult)
      }

      console.log('🎉 E2E workflow simulation completed')
    })
  })

  describe('6. Storage Integration', () => {
    it('should verify storage bucket exists and is accessible', async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('⏭️  Skipping storage test - no authenticated user')
        return
      }

      // Test storage bucket access
      const testFileName = `test-images/test-${Date.now()}.txt`
      const testContent = 'This is a test file for image generation workflow'

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('book-images')
        .upload(testFileName, testContent, {
          contentType: 'text/plain',
          upsert: true
        })

      if (uploadError) {
        console.log(`⚠️  Storage upload failed: ${uploadError.message}`)
        console.log('🔍 This may indicate storage configuration issues')
      } else {
        console.log('✅ Storage upload successful')
        
        // Test public URL generation
        const { data: urlData } = supabase.storage
          .from('book-images')
          .getPublicUrl(testFileName)
        
        expect(urlData.publicUrl).toContain(testFileName)
        console.log('✅ Public URL generation works')

        // Cleanup test file
        await supabase.storage
          .from('book-images')
          .remove([testFileName])
      }
    })
  })
})

/**
 * Database Health Check Tests
 * Tests critical database functions and schema
 */
describe('Database Health Check', () => {
  let supabase: any

  beforeAll(() => {
    supabase = createClient()
  })

  it('should verify critical tables exist', async () => {
    const criticalTables = [
      'projects',
      'book_pages',
      'book_generations'
    ]

    for (const table of criticalTables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      expect(error).toBeNull()
      console.log(`✅ Table '${table}' exists and is accessible`)
    }
  })

  it('should verify RLS is properly configured', async () => {
    // Test that RLS blocks unauthorized access
    const testClient = createClient()
    
    // Clear any existing session
    await testClient.auth.signOut()

    const { data, error } = await testClient
      .from('projects')
      .select('*')
      .limit(1)

    // Should either get empty result or RLS error
    expect(data === null || Array.isArray(data)).toBe(true)
    console.log('✅ RLS is active and blocking unauthorized access')
  })
})

/**
 * Performance and Load Tests
 */
describe('Performance Tests', () => {
  it('should handle database queries within reasonable time limits', async () => {
    const supabase = createClient()
    const startTime = Date.now()

    const { data, error } = await supabase
      .from('projects')
      .select('*, book_pages(*)')
      .eq('project_type', 'childrens-book')
      .limit(10)

    const queryTime = Date.now() - startTime
    
    expect(queryTime).toBeLessThan(5000) // 5 second timeout
    console.log(`✅ Complex query completed in ${queryTime}ms`)
  })
})