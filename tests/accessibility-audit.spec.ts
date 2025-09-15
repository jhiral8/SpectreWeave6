import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Comprehensive Accessibility Audit', () => {
  test('Homepage - Full WCAG 2.1 AA Compliance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    // Generate detailed report
    const report = {
      url: page.url(),
      violations: accessibilityScanResults.violations.map(violation => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.length
      })),
      passes: accessibilityScanResults.passes.length,
      incomplete: accessibilityScanResults.incomplete.length,
      inapplicable: accessibilityScanResults.inapplicable.length
    };
    
    console.log('Accessibility Audit Report:', JSON.stringify(report, null, 2));
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Color contrast verification', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test color contrast specifically
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Focus management', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test focus-related rules
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['focus-order-semantics', 'focusable-content'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Semantic structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test semantic HTML structure
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['heading-order', 'landmark-one-main', 'page-has-heading-one'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Mobile accessibility', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Screen reader compatibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test ARIA and screen reader related rules
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules([
        'aria-allowed-attr',
        'aria-required-attr',
        'aria-valid-attr-value',
        'aria-roles',
        'label',
        'button-name'
      ])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});