import { test, expect } from '@playwright/test'

test.describe('Ghost completion: accept + undo/redo', () => {
  test('accepts ghost suggestion with Tab, undo and redo work', async ({ page }) => {
    // Navigate to writer page with non-UUID id to avoid auth/db coupling
    await page.goto('/portal/writer/e2e-ghost-test')

    // Wait for editor to load
    const editor = page.locator('.ProseMirror')
    await editor.first().waitFor({ state: 'visible' })

    // Inject deterministic test ghost suggestion
    await page.evaluate(() => {
      ;(window as any).__sw_test_ghost = {
        completion: ' and he smiled softly.',
        plan: ['Continue reaction', 'Add a beat']
      }
    })

    // Type content to trigger punctuation-based suggestion
    await editor.click()
    await page.keyboard.type('He looked at the horizon.')

    // Wait for ghost suggestion decoration to render
    const ghost = page.locator('.ghost-completion')
    await ghost.waitFor({ state: 'visible' })

    // Accept with Tab
    await page.keyboard.press('Tab')

    // Confirm text now includes the suggestion
    await expect(editor).toContainText('He looked at the horizon. and he smiled softly.')

    // Undo
    await page.keyboard.press('Control+z')
    await expect(editor).not.toContainText(' and he smiled softly.')

    // Redo (Ctrl+Shift+Z is common; TipTap History supports both)
    await page.keyboard.press('Control+Shift+z')
    // Fallback redo binding for some environments
    if (!(await editor.textContent())?.includes(' and he smiled softly.')) {
      await page.keyboard.press('Control+y')
    }

    await expect(editor).toContainText('He looked at the horizon. and he smiled softly.')
  })
})


