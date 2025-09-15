import { test, expect, Page } from '@playwright/test'

/**
 * End-to-End Tests for Children's Book Image Generation Workflow
 * 
 * These tests verify the complete workflow from book creation to image generation,
 * ensuring the database schema fixes work correctly in real user scenarios.
 */

// Test data
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
}

const TEST_BOOK = {
  title: 'The Magical Forest Adventure',
  description: 'A story about friendship and magic',
  mainCharacter: 'Luna the wise owl',
  setting: 'A mystical forest filled with glowing fireflies and ancient trees',
  conflict: 'The forest\'s magic is fading and all the creatures are losing their special abilities',
  moralLesson: 'Working together and believing in yourself can overcome any challenge'
}

test.describe('Children\'s Book Image Generation Workflow', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    
    // Mock authentication for testing
    await page.goto('/portal/login')
    
    // In a real test environment, you would implement proper authentication
    // For now, we'll assume the user is authenticated and proceed to the portal
    await page.goto('/portal/projects')
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('should create a new children\'s book project', async () => {
    // Navigate to projects page
    await expect(page.locator('h1')).toContainText('Projects')

    // Click "New Project" button
    await page.click('button:has-text("New Project")')

    // Select children's book type
    await page.click('input[value="childrens-book"]')
    
    // Fill in project details
    await page.fill('input[placeholder*="Magical Adventure"]', TEST_BOOK.title)
    await page.fill('textarea[placeholder*="story about friendship"]', TEST_BOOK.description)

    // Create the project
    await page.click('button:has-text("Create")')

    // Should redirect to book creator
    await expect(page).toHaveURL(/\/portal\/book-creator\//)
    await expect(page.locator('h1')).toContainText(TEST_BOOK.title)
  })

  test('should navigate through book creation wizard steps', async () => {
    // Assume we already have a book project created
    await page.goto('/portal/book-creator/test-book-id')
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Test Book')

    // Verify we're on step 1 (Story Setup)
    await expect(page.locator('h3')).toContainText('Tell Your Story')

    // Fill in story setup fields
    await page.fill('textarea[placeholder*="curious young rabbit"]', TEST_BOOK.mainCharacter)
    await page.fill('textarea[placeholder*="magical forest"]', TEST_BOOK.setting)
    await page.fill('textarea[placeholder*="forest\'s magic is fading"]', TEST_BOOK.conflict)
    await page.fill('textarea[placeholder*="Friendship and kindness"]', TEST_BOOK.moralLesson)

    // Click Next to proceed to Characters step
    await page.click('button:has-text("Next")')
    await expect(page.locator('h3')).toContainText('Character Management')

    // Continue through remaining steps
    await page.click('button:has-text("Next")') // Author Style
    await expect(page.locator('h3')).toContainText('Choose Your Writing Style')

    await page.click('button:has-text("Next")') // Visual Style
    await expect(page.locator('h3')).toContainText('Choose Your Visual Style')

    await page.click('button:has-text("Next")') // Video Options
    await expect(page.locator('h3')).toContainText('Multimedia Features')

    await page.click('button:has-text("Next")') // Final Settings
    await expect(page.locator('h3')).toContainText('Final Book Configuration')

    // Should show completion button on final step
    await expect(page.locator('button')).toContainText('Complete Book')
  })

  test('should generate story and then images in complete workflow', async () => {
    await page.goto('/portal/book-creator/test-book-id')
    
    // Fill in required fields and navigate to final step
    await page.fill('textarea[placeholder*="curious young rabbit"]', TEST_BOOK.mainCharacter)
    await page.fill('textarea[placeholder*="magical forest"]', TEST_BOOK.setting)
    await page.fill('textarea[placeholder*="forest\'s magic is fading"]', TEST_BOOK.conflict)

    // Navigate through all steps to completion
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Next")')
      await page.waitForTimeout(500) // Brief pause for navigation
    }

    // Mock the API responses for testing
    await page.route('/api/children-books/generate-story', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          story: {
            pages: [
              { page_number: 1, content: 'Once upon a time...', illustration_prompt: 'Luna the owl in the forest' },
              { page_number: 2, content: 'The forest was losing its magic...', illustration_prompt: 'Fading magical lights' },
              { page_number: 3, content: 'Luna gathered her friends...', illustration_prompt: 'Animals working together' }
            ]
          }
        })
      })
    })

    await page.route('/api/children-books/generate-images', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          images: [
            { id: 'img1', url: 'https://example.com/img1.png' },
            { id: 'img2', url: 'https://example.com/img2.png' },
            { id: 'img3', url: 'https://example.com/img3.png' }
          ],
          metadata: { totalGenerated: 3, totalErrors: 0 }
        })
      })
    })

    // Click Complete Book button
    await page.click('button:has-text("Complete Book")')

    // Wait for completion process
    await expect(page.locator('text=Generating your story')).toBeVisible()
    await expect(page.locator('text=Creating illustrations')).toBeVisible()
    await expect(page.locator('text=Finalizing your book')).toBeVisible()

    // Should show success message
    await expect(page.locator('text=Congratulations')).toBeVisible()
  })

  test('should display book status correctly in projects page', async () => {
    // Mock book pages data for status display
    await page.route('**/book_pages*', async route => {
      if (route.request().url().includes('project_id')) {
        // Return empty for project_id query to test fallback
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], error: null })
        })
      } else if (route.request().url().includes('book_id')) {
        // Return data for book_id fallback
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              { id: 'page1', illustration_url: 'https://example.com/img1.png' },
              { id: 'page2', illustration_url: 'https://example.com/img2.png' },
              { id: 'page3', illustration_url: null },
              { id: 'page4', illustration_url: null }
            ],
            error: null
          })
        })
      }
    })

    await page.goto('/portal/projects')

    // Wait for page to load and status to be calculated
    await expect(page.locator('h1')).toContainText('Projects')

    // Should show correct status badges
    await expect(page.locator('text=4 pages')).toBeVisible()
    await expect(page.locator('text=2/4 illustrated')).toBeVisible()

    // Should show appropriate action buttons
    await expect(page.locator('a:has-text("Edit Book")')).toBeVisible()
    await expect(page.locator('a:has-text("Read Book")')).toBeVisible()
    await expect(page.locator('a:has-text("Project Details")')).toBeVisible()
  })

  test('should handle database schema compatibility in book pages queries', async () => {
    let projectIdQueryCount = 0
    let bookIdQueryCount = 0

    // Track which queries are made
    await page.route('**/book_pages*', async route => {
      const url = route.request().url()
      
      if (url.includes('project_id')) {
        projectIdQueryCount++
        if (projectIdQueryCount === 1) {
          // First query returns empty (simulating new schema not populated)
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: [], error: null })
          })
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [
                { page_number: 1, illustration_prompt: 'Test prompt 1' },
                { page_number: 2, illustration_prompt: 'Test prompt 2' }
              ],
              error: null
            })
          })
        }
      } else if (url.includes('book_id')) {
        bookIdQueryCount++
        // Fallback query returns data
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              { page_number: 1, illustration_prompt: 'Test prompt 1' },
              { page_number: 2, illustration_prompt: 'Test prompt 2' }
            ],
            error: null
          })
        })
      }
    })

    // Navigate to book creator to trigger page queries
    await page.goto('/portal/book-creator/test-book-id')
    await expect(page.locator('h1')).toContainText('Test Book')

    // Navigate through form to trigger image generation
    await page.fill('textarea[placeholder*="curious young rabbit"]', TEST_BOOK.mainCharacter)
    await page.fill('textarea[placeholder*="magical forest"]', TEST_BOOK.setting)
    await page.fill('textarea[placeholder*="forest\'s magic is fading"]', TEST_BOOK.conflict)

    // Try to generate images to test query fallback
    await page.click('button:has-text("Generate Images")') // If such button exists

    // Verify both query types were attempted
    expect(projectIdQueryCount).toBeGreaterThan(0)
    expect(bookIdQueryCount).toBeGreaterThan(0)
  })

  test('should handle API errors gracefully', async () => {
    await page.goto('/portal/book-creator/test-book-id')

    // Fill form and navigate to final step
    await page.fill('textarea[placeholder*="curious young rabbit"]', TEST_BOOK.mainCharacter)
    await page.fill('textarea[placeholder*="magical forest"]', TEST_BOOK.setting)
    await page.fill('textarea[placeholder*="forest\'s magic is fading"]', TEST_BOOK.conflict)

    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Next")')
      await page.waitForTimeout(500)
    }

    // Mock API error
    await page.route('/api/children-books/generate-story', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'No story pages found. Please generate a story first.'
        })
      })
    })

    // Set up dialog handler for error messages
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('No story pages found')
      await dialog.accept()
    })

    // Attempt completion - should show error
    await page.click('button:has-text("Complete Book")')

    // Error should be handled gracefully without crashing the app
    await expect(page.locator('h1')).toContainText(TEST_BOOK.title) // Page should still be functional
  })

  test('should maintain book state across browser refresh', async () => {
    await page.goto('/portal/book-creator/test-book-id')

    // Fill in some form data
    await page.fill('textarea[placeholder*="curious young rabbit"]', TEST_BOOK.mainCharacter)
    await page.fill('textarea[placeholder*="magical forest"]', TEST_BOOK.setting)

    // Save the form
    await page.click('button:has-text("Save")')
    await page.waitForTimeout(1000)

    // Refresh the page
    await page.reload()

    // Data should be preserved
    await expect(page.locator(`textarea[value*="${TEST_BOOK.mainCharacter}"]`)).toBeVisible()
    await expect(page.locator(`textarea[value*="${TEST_BOOK.setting}"]`)).toBeVisible()
  })

  test('should correctly route between different project types', async () => {
    await page.goto('/portal/projects')

    // Test navigation for children's book
    await page.click('a:has-text("Edit Book")')
    await expect(page).toHaveURL(/\/portal\/book-creator\//)

    await page.goBack()

    // Test navigation for regular project
    await page.click('a:has-text("Open doc")')
    await expect(page).toHaveURL(/\/portal\/writer\//)
  })

  test('should show image generation progress and results', async () => {
    await page.goto('/portal/book-creator/test-book-id')

    // Mock pages data
    await page.route('**/book_pages*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { page_number: 1, illustration_prompt: 'Test prompt 1' },
            { page_number: 2, illustration_prompt: 'Test prompt 2' }
          ],
          error: null
        })
      })
    })

    // Mock slow image generation to test progress
    await page.route('/api/children-books/generate-images', async route => {
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          images: [
            { id: 'img1', url: 'https://example.com/img1.png' },
            { id: 'img2', url: 'https://example.com/img2.png' }
          ],
          metadata: { totalGenerated: 2, totalErrors: 0 }
        })
      })
    })

    // Fill form and try image generation
    await page.fill('textarea[placeholder*="curious young rabbit"]', TEST_BOOK.mainCharacter)

    // Trigger image generation (if there's a direct button)
    await page.click('button:has-text("Generate Images")')

    // Should show generating state
    await expect(page.locator('text=Generating')).toBeVisible()

    // Should eventually show success
    await expect(page.locator('text=Successfully generated')).toBeVisible({ timeout: 5000 })
  })
})