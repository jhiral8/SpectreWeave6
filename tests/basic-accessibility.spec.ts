import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Basic Accessibility Tests', () => {
  test('Homepage accessibility scan', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:');
      accessibilityScanResults.violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.id}: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Help: ${violation.help}`);
        violation.nodes.forEach((node, nodeIndex) => {
          console.log(`   Node ${nodeIndex + 1}: ${node.target}`);
        });
        console.log('---');
      });
    }
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Basic keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test that Tab key works
    await page.keyboard.press('Tab');
    
    // Check if something got focus
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeAttached();
  });

  test('Dark mode toggle accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if dark mode class can be toggled
    await page.evaluate(() => {
      document.documentElement.classList.toggle('dark');
    });
    
    // Check if page is still accessible in dark mode
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});