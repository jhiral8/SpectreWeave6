// Test image generation API to verify it works after the RLS fixes
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://qcntzstoxfiartrdhysk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbnR6c3RveGZpYXJ0cmRoeXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MTk5MzAsImV4cCI6MjA2OTE5NTkzMH0.DkO_fFUEkm8p_wEbgUXM7bk2F15p2XucJq231EKuCHw'

async function testImageGeneration() {
  try {
    console.log('🧪 Testing image generation system...')
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    
    // Use an existing book for testing
    const bookId = 'cdf94b0d-fef7-46c5-9f82-e9e72ad64871'
    console.log('\n📖 Using existing test book:', bookId)
    
    // Get existing pages for this book
    const { data: existingPages } = await supabase
      .from('book_pages')
      .select('page_number, illustration_prompt, illustration_url')
      .eq('book_id', bookId)
      .order('page_number')
    
    if (!existingPages || existingPages.length === 0) {
      console.log('❌ No existing pages found for test book')
      return
    }
    
    console.log('📄 Found existing pages:', existingPages.length)
    existingPages.forEach(page => {
      console.log(`   Page ${page.page_number}: ${page.illustration_url ? 'HAS IMAGE' : 'NO IMAGE'}`)
    })
    
    
    // Now test the image generation API
    console.log('\n🎨 Testing image generation API...')
    
    const imageRequest = {
      bookId: bookId,
      action: 'generate-batch',
      pages: existingPages.map(page => ({
        pageNumber: page.page_number,
        illustrationPrompt: page.illustration_prompt || `A beautiful illustration for page ${page.page_number}`
      })),
      style: 'watercolor',
      theme: 'magical-forest',
      targetAge: '3-5'
    }
    
    const response = await fetch('http://localhost:3000/api/children-books/generate-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imageRequest)
    })
    
    const result = await response.json()
    
    console.log('📊 API Response Status:', response.status)
    console.log('📊 API Response:', JSON.stringify(result, null, 2))
    
    if (response.ok && result.success) {
      console.log('✅ Image generation successful!')
      console.log(`📸 Generated ${result.images?.length || 0} images`)
      
      // Check what URLs were actually stored
      const { data: updatedPages } = await supabase
        .from('book_pages')
        .select('page_number, illustration_url')
        .eq('book_id', bookId)
        .order('page_number')
      
      console.log('\n📋 Updated page URLs:')
      updatedPages?.forEach(page => {
        console.log(`   Page ${page.page_number}: ${page.illustration_url || '(null)'}`)
      })
      
    } else {
      console.log('❌ Image generation failed')
      if (result.error) {
        console.log('Error:', result.error)
      }
      if (result.details) {
        console.log('Details:', result.details)
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

testImageGeneration()