/**
 * Live API Testing Utility for Children's Book Image Generation
 * 
 * This utility tests the actual running API server at localhost:3006
 * Use this to verify the complete workflow against your running application
 */

import { createClient } from '@/lib/supabase/client'

interface TestResult {
  test: string
  passed: boolean
  message: string
  details?: any
}

class ImageGenerationTester {
  private supabase = createClient()
  private baseUrl = 'http://localhost:3006'
  private results: TestResult[] = []

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Live API Test Suite for Image Generation')
    console.log(`🌐 Testing against: ${this.baseUrl}`)
    console.log('=' .repeat(60))

    this.results = []

    // Run tests in sequence
    await this.testServerHealth()
    await this.testAuthentication()
    await this.testDatabaseConnection()
    await this.testImageGenerationAPI()
    await this.testEndToEndWorkflow()

    console.log('=' .repeat(60))
    this.printSummary()
    return this.results
  }

  private async testServerHealth() {
    console.log('🏥 Testing Server Health...')
    
    try {
      const response = await fetch(`${this.baseUrl}/api/bridge/health`)
      const isHealthy = response.ok
      
      this.addResult('Server Health Check', isHealthy, 
        isHealthy ? 'Server is responding' : `Server returned ${response.status}`)
    } catch (error) {
      this.addResult('Server Health Check', false, 
        `Server is not responding: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async testAuthentication() {
    console.log('🔐 Testing Authentication...')
    
    try {
      const response = await fetch(`${this.baseUrl}/api/children-books/generate-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: 'test-id',
          action: 'generate-single'
        })
      })

      const data = await response.json()
      const authWorks = response.status === 401 && data.error === 'Authentication required'
      
      this.addResult('Authentication Validation', authWorks, 
        authWorks ? 'Authentication properly rejected unauthenticated requests' : 
        `Unexpected response: ${response.status} - ${JSON.stringify(data)}`)
    } catch (error) {
      this.addResult('Authentication Validation', false, 
        `Auth test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async testDatabaseConnection() {
    console.log('🗄️  Testing Database Connection...')
    
    try {
      // Test if we can connect to Supabase
      const { data: tables, error } = await this.supabase
        .rpc('ping')
        .single()

      if (error && error.code !== '42883') { // function doesn't exist, but connection works
        this.addResult('Database Connection', false, `Database error: ${error.message}`)
        return
      }

      // Test critical tables
      const { data: projects, error: projectError } = await this.supabase
        .from('projects')
        .select('id')
        .limit(1)

      const { data: bookPages, error: pagesError } = await this.supabase
        .from('book_pages')
        .select('id')
        .limit(1)

      if (projectError || pagesError) {
        this.addResult('Database Connection', false, 
          `Table access failed: ${projectError?.message || pagesError?.message}`)
      } else {
        this.addResult('Database Connection', true, 'Successfully connected to database')
      }
    } catch (error) {
      this.addResult('Database Connection', false, 
        `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async testImageGenerationAPI() {
    console.log('🎨 Testing Image Generation API...')
    
    try {
      // Get current user session
      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (!session) {
        this.addResult('Image Generation API', false, 
          'No authenticated session available for API testing')
        return
      }

      // Test API with authentication
      const response = await fetch(`${this.baseUrl}/api/children-books/generate-images`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          bookId: 'non-existent-book-id',
          action: 'generate-single',
          pageNumber: 1,
          illustrationPrompt: 'Test prompt',
          style: 'watercolor',
          theme: 'test',
          targetAge: '3-5'
        })
      })

      const data = await response.json()
      
      // Should get 404 (book not found) not 401 (auth error)
      const authPassed = response.status !== 401
      const expectedError = response.status === 404 && 
        (data.error?.includes('not found') || data.error?.includes('access denied'))
      
      this.addResult('Image Generation API', authPassed, 
        authPassed ? 
          (expectedError ? 'API properly handles authenticated requests' : 
           `Unexpected response: ${response.status} - ${data.error}`) :
          'API still returning authentication errors')
    } catch (error) {
      this.addResult('Image Generation API', false, 
        `API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async testEndToEndWorkflow() {
    console.log('🔄 Testing End-to-End Workflow...')
    
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        this.addResult('End-to-End Workflow', false, 
          'No authenticated user for E2E testing')
        return
      }

      // Check for existing projects
      const { data: projects, error: projectError } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_type', 'childrens-book')
        .limit(1)

      if (projectError) {
        this.addResult('End-to-End Workflow', false, 
          `Project query failed: ${projectError.message}`)
        return
      }

      if (!projects || projects.length === 0) {
        this.addResult('End-to-End Workflow', false, 
          'No children\'s book projects found. Create a test project first.')
        return
      }

      const project = projects[0]

      // Check for book pages
      const { data: pages, error: pagesError } = await this.supabase
        .from('book_pages')
        .select('*')
        .eq('project_id', project.id)
        .limit(1)

      if (pagesError) {
        this.addResult('End-to-End Workflow', false, 
          `Book pages query failed: ${pagesError.message}`)
        return
      }

      if (!pages || pages.length === 0) {
        this.addResult('End-to-End Workflow', false, 
          'Project has no book pages. Generate story content first.')
        return
      }

      // Test database function
      const { data: updateResult, error: updateError } = await this.supabase
        .rpc('update_book_page_illustration', {
          p_book_id: project.id,
          p_page_number: pages[0].page_number,
          p_illustration_url: `https://test.example.com/test-${Date.now()}.png`,
          p_illustration_prompt: pages[0].illustration_prompt || 'Test prompt',
          p_user_id: user.id
        })

      if (updateError) {
        this.addResult('End-to-End Workflow', false, 
          `Database function failed: ${updateError.message}`, {
            project: project.title,
            pages: pages.length,
            error: updateError
          })
      } else {
        this.addResult('End-to-End Workflow', true, 
          'Complete workflow verified successfully', {
            project: project.title,
            pages: pages.length,
            updateResult
          })
      }
    } catch (error) {
      this.addResult('End-to-End Workflow', false, 
        `E2E test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private addResult(test: string, passed: boolean, message: string, details?: any) {
    const result = { test, passed, message, details }
    this.results.push(result)
    
    const icon = passed ? '✅' : '❌'
    console.log(`${icon} ${test}: ${message}`)
    
    if (details && !passed) {
      console.log(`   Details:`, details)
    }
  }

  private printSummary() {
    const passed = this.results.filter(r => r.passed).length
    const total = this.results.length
    
    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`)
    
    if (passed === total) {
      console.log('🎉 All tests passed! Image generation workflow is ready.')
    } else {
      console.log('⚠️  Some tests failed. Review the issues above.')
      
      const failed = this.results.filter(r => !r.passed)
      console.log('\n🔍 Failed Tests:')
      failed.forEach(result => {
        console.log(`   • ${result.test}: ${result.message}`)
      })
      
      console.log('\n💡 Suggested Actions:')
      this.printSuggestions(failed)
    }
  }

  private printSuggestions(failedTests: TestResult[]) {
    const suggestions = new Set<string>()

    failedTests.forEach(test => {
      if (test.test.includes('Server Health')) {
        suggestions.add('• Start the development server: npm run dev')
      }
      if (test.test.includes('Authentication')) {
        suggestions.add('• Check Supabase configuration in .env.local')
        suggestions.add('• Verify SUPABASE_URL and SUPABASE_ANON_KEY are set')
      }
      if (test.test.includes('Database')) {
        suggestions.add('• Run database migrations: npm run db:migrate')
        suggestions.add('• Verify RLS policies are correctly configured')
      }
      if (test.test.includes('API') || test.test.includes('End-to-End')) {
        suggestions.add('• Sign in with a test user account')
        suggestions.add('• Create a test children\'s book project')
        suggestions.add('• Generate story content for the project')
      }
    })

    suggestions.forEach(suggestion => console.log(suggestion))
  }
}

// Export for use in tests or direct execution
export { ImageGenerationTester }

// Allow direct execution
if (require.main === module) {
  const tester = new ImageGenerationTester()
  tester.runAllTests()
    .then(results => {
      const passed = results.filter(r => r.passed).length
      process.exit(passed === results.length ? 0 : 1)
    })
    .catch(error => {
      console.error('Test runner failed:', error)
      process.exit(1)
    })
}