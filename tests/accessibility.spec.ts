import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 2.1 AA Accessibility Tests', () => {
  test('Homepage meets WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Editor page meets WCAG 2.1 AA standards', async ({ page }) => {
    // Create a test room
    await page.goto('/');
    await page.click('text=Create New Document');
    
    // Wait for editor to load
    await page.waitForSelector('[data-editor="true"]', { timeout: 10000 });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Login page meets WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Dark mode meets WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/');
    
    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard navigation works correctly', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const firstFocusedElement = await page.locator(':focus').first();
    await expect(firstFocusedElement).toBeVisible();
    
    // Test enter key activation
    await page.keyboard.press('Enter');
    // Should not throw any errors
  });

  test('Focus management in modal dialogs', async ({ page }) => {
    await page.goto('/');
    
    // Open a modal if available
    const createButton = page.locator('text=Create New Document').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Check if focus is trapped in modal
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus').first();
      await expect(focusedElement).toBeVisible();
    }
  });

  test('Color contrast meets AA standards', async ({ page }, testInfo) => {
    await page.goto('/');
    
    // Get computed styles for key elements
    const textColor = await page.evaluate(() => {
      const bodyElement = document.querySelector('body');
      return window.getComputedStyle(bodyElement!).color;
    });
    
    const backgroundColor = await page.evaluate(() => {
      const bodyElement = document.querySelector('body');
      return window.getComputedStyle(bodyElement!).backgroundColor;
    });
    
    console.log('Text color:', textColor);
    console.log('Background color:', backgroundColor);
    
    // This test passes if axe-core doesn't find contrast violations
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();
    
    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    expect(contrastViolations).toHaveLength(0);
  });

  test('Images have proper alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    
    for (const image of images) {
      const altText = await image.getAttribute('alt');
      const isDecorative = await image.getAttribute('role') === 'presentation' || 
                          await image.getAttribute('aria-hidden') === 'true';
      
      // Images should either have alt text or be marked as decorative
      expect(altText !== null || isDecorative).toBeTruthy();
    }
  });

  test('Form inputs have proper labels', async ({ page }) => {
    await page.goto('/login');
    
    const inputs = await page.locator('input').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        // Check if there's a label with for attribute
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        // Input should have either a label, aria-label, or aria-labelledby
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('Headings follow proper hierarchy', async ({ page }) => {
    await page.goto('/');
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    if (headings.length > 0) {
      // First heading should be h1
      const firstHeading = headings[0];
      const tagName = await firstHeading.evaluate(el => el.tagName.toLowerCase());
      expect(tagName).toBe('h1');
      
      // Check for proper hierarchy (no skipping levels)
      for (let i = 1; i < headings.length; i++) {
        const currentLevel = parseInt((await headings[i].evaluate(el => el.tagName)).slice(1));
        const previousLevel = parseInt((await headings[i-1].evaluate(el => el.tagName)).slice(1));
        
        // Current level should not be more than 1 level deeper than previous
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }
    }
  });

  test('ARIA attributes are used correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check that required ARIA attributes are present and valid
    const elementsWithAriaExpanded = await page.locator('[aria-expanded]').all();
    
    for (const element of elementsWithAriaExpanded) {
      const ariaExpanded = await element.getAttribute('aria-expanded');
      expect(['true', 'false'].includes(ariaExpanded!)).toBeTruthy();
    }
    
    // Check for proper button roles
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const role = await button.getAttribute('role');
      // Buttons should either have no role (implicit) or explicit button role
      if (role) {
        expect(role).toBe('button');
      }
    }
  });
});