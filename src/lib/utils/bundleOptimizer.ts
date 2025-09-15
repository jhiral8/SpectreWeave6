/**
 * Bundle optimization utilities and webpack analyzer
 * Provides insights and optimizations for reducing bundle size
 */

// Bundle analysis utilities
export class BundleAnalyzer {
  private importMap = new Map<string, {
    size: number
    usage: number
    lastUsed: number
    critical: boolean
  }>()

  // Track dynamic imports
  trackImport(moduleName: string, size: number, critical = false) {
    const existing = this.importMap.get(moduleName)
    this.importMap.set(moduleName, {
      size,
      usage: existing ? existing.usage + 1 : 1,
      lastUsed: Date.now(),
      critical
    })
  }

  // Get unused modules (candidates for tree shaking)
  getUnusedModules(thresholdHours = 24): string[] {
    const threshold = Date.now() - (thresholdHours * 60 * 60 * 1000)
    
    return Array.from(this.importMap.entries())
      .filter(([_, info]) => !info.critical && info.lastUsed < threshold)
      .map(([module]) => module)
  }

  // Get heavy modules that should be optimized
  getHeavyModules(sizeThresholdKB = 50): Array<{module: string, size: number, usage: number}> {
    return Array.from(this.importMap.entries())
      .filter(([_, info]) => info.size > sizeThresholdKB)
      .map(([module, info]) => ({ module, size: info.size, usage: info.usage }))
      .sort((a, b) => b.size - a.size)
  }

  // Generate optimization report
  generateReport() {
    const totalSize = Array.from(this.importMap.values())
      .reduce((sum, info) => sum + info.size, 0)
    
    const criticalSize = Array.from(this.importMap.values())
      .filter(info => info.critical)
      .reduce((sum, info) => sum + info.size, 0)

    const unused = this.getUnusedModules()
    const heavy = this.getHeavyModules()

    return {
      totalModules: this.importMap.size,
      totalSize: Math.round(totalSize),
      criticalSize: Math.round(criticalSize),
      nonCriticalSize: Math.round(totalSize - criticalSize),
      unusedModules: unused,
      heavyModules: heavy,
      recommendations: this.generateRecommendations(unused, heavy)
    }
  }

  private generateRecommendations(unused: string[], heavy: Array<{module: string, size: number}>) {
    const recommendations: string[] = []

    if (unused.length > 0) {
      recommendations.push(`Remove ${unused.length} unused modules: ${unused.slice(0, 3).join(', ')}${unused.length > 3 ? '...' : ''}`)
    }

    if (heavy.length > 0) {
      recommendations.push(`Optimize heavy modules: ${heavy.slice(0, 2).map(h => `${h.module} (${h.size}KB)`).join(', ')}`)
    }

    const totalModules = this.importMap.size
    if (totalModules > 50) {
      recommendations.push(`Consider code splitting - you have ${totalModules} modules loaded`)
    }

    return recommendations
  }
}

// Global bundle analyzer instance
export const bundleAnalyzer = new BundleAnalyzer()

// Webpack Bundle Analyzer configuration
export const webpackBundleConfig = {
  resolve: {
    alias: {
      // Tree shake lodash
      'lodash': 'lodash-es',
      // Use ES modules for better tree shaking
      '@tiptap/core': '@tiptap/core/dist/index.es.js',
      '@tiptap/react': '@tiptap/react/dist/index.es.js',
    },
  },
  optimization: {
    sideEffects: false, // Enable aggressive tree shaking
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Separate vendor chunks
        tiptap: {
          test: /[\\/]node_modules[\\/]@tiptap/,
          name: 'tiptap',
          priority: 10,
          reuseExistingChunk: true,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 5,
          reuseExistingChunk: true,
        },
        // Editor-specific chunks
        editor: {
          test: /[\\/]src[\\/]components[\\/]BlockEditor/,
          name: 'editor',
          priority: 8,
          minSize: 20000,
          reuseExistingChunk: true,
        },
      },
    },
    usedExports: true,
    providedExports: true,
  },
}

// Dynamic import wrapper with tracking
export function trackedDynamicImport<T = any>(
  moduleGetter: () => Promise<T>,
  moduleName: string,
  estimatedSizeKB: number,
  critical = false
): Promise<T> {
  bundleAnalyzer.trackImport(moduleName, estimatedSizeKB, critical)
  
  const startTime = performance.now()
  
  return moduleGetter().then(module => {
    const loadTime = performance.now() - startTime
    
    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Loaded ${moduleName} in ${Math.round(loadTime)}ms (${estimatedSizeKB}KB)`)
    }

    return module
  }).catch(error => {
    console.error(`Failed to load ${moduleName}:`, error)
    throw error
  })
}

// Optimize TipTap extensions loading
export const optimizedTipTapImports = {
  StarterKit: () => trackedDynamicImport(
    () => import('@tiptap/starter-kit').then(m => m.StarterKit),
    'StarterKit',
    45,
    true
  ),
  
  Collaboration: () => trackedDynamicImport(
    () => import('@tiptap/extension-collaboration').then(m => m.Collaboration),
    'Collaboration',
    25
  ),
  
  CollaborationCursor: () => trackedDynamicImport(
    () => import('@tiptap/extension-collaboration-cursor').then(m => m.CollaborationCursor),
    'CollaborationCursor',
    15
  ),
  
  Table: () => trackedDynamicImport(
    () => Promise.all([
      import('@tiptap/extension-table'),
      import('@tiptap/extension-table-row'),
      import('@tiptap/extension-table-header'),
      import('@tiptap/extension-table-cell')
    ]).then(([Table, TableRow, TableHeader, TableCell]) => ({
      Table: Table.Table,
      TableRow: TableRow.TableRow,
      TableHeader: TableHeader.TableHeader,
      TableCell: TableCell.TableCell
    })),
    'Table-Bundle',
    35
  ),
  
  Image: () => trackedDynamicImport(
    () => import('@tiptap/extension-image').then(m => m.Image),
    'Image',
    20
  ),
  
  Link: () => trackedDynamicImport(
    () => import('@tiptap/extension-link').then(m => m.Link),
    'Link',
    15
  ),
}

// CSS optimization utilities
export const cssOptimizations = {
  // Remove unused CSS classes at runtime
  removeUnusedCSS() {
    if (typeof document === 'undefined') return

    const usedClasses = new Set<string>()
    const allElements = document.querySelectorAll('*')
    
    allElements.forEach(el => {
      el.classList.forEach(className => usedClasses.add(className))
    })

    // Find stylesheets and remove unused rules
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach((rule, index) => {
            if (rule instanceof CSSStyleRule) {
              const selector = rule.selectorText
              const classes = selector.match(/\.[a-zA-Z0-9_-]+/g) || []
              
              const hasUnusedClass = classes.some(cls => 
                !usedClasses.has(cls.substring(1))
              )
              
              if (hasUnusedClass && !selector.includes(':hover') && !selector.includes(':focus')) {
                // Mark for removal (don't actually remove in production)
                if (process.env.NODE_ENV === 'development') {
                  console.log(`Unused CSS rule: ${selector}`)
                }
              }
            }
          })
        }
      } catch (e) {
        // Cross-origin stylesheets can't be accessed
      }
    })

    return Array.from(usedClasses)
  },

  // Critical CSS extraction
  extractCriticalCSS() {
    const criticalSelectors = [
      '.editor-main-container',
      '.manuscript-surface',
      '.framework-surface',
      '.ProseMirror',
      '.ai-border-base',
      '.surface-switcher'
    ]

    return criticalSelectors.map(selector => {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 0) {
        return {
          selector,
          used: true,
          elements: elements.length
        }
      }
      return { selector, used: false, elements: 0 }
    })
  }
}

// Performance budget checker
export class PerformanceBudget {
  private budgets = {
    totalJS: 500, // KB
    totalCSS: 100, // KB
    tiptapBundle: 200, // KB
    editorBundle: 150, // KB
    initialLoadTime: 3000, // ms
  }

  checkBudgets(actual: Partial<typeof this.budgets>) {
    const violations: string[] = []
    
    Object.entries(actual).forEach(([key, value]) => {
      const budget = this.budgets[key as keyof typeof this.budgets]
      if (budget && value > budget) {
        violations.push(`${key}: ${value} exceeds budget of ${budget}`)
      }
    })

    return {
      passed: violations.length === 0,
      violations,
      score: Math.max(0, 100 - (violations.length * 20))
    }
  }

  setBudget(metric: keyof typeof this.budgets, value: number) {
    this.budgets[metric] = value
  }

  getBudgets() {
    return { ...this.budgets }
  }
}

export const performanceBudget = new PerformanceBudget()

// Development utilities
if (process.env.NODE_ENV === 'development') {
  // Global access for debugging
  if (typeof window !== 'undefined') {
    (window as any).bundleAnalyzer = bundleAnalyzer
    (window as any).performanceBudget = performanceBudget
    
    // Periodic bundle analysis
    setInterval(() => {
      const report = bundleAnalyzer.generateReport()
      if (report.recommendations.length > 0) {
        console.group('Bundle Optimization Recommendations')
        report.recommendations.forEach(rec => console.log('•', rec))
        console.groupEnd()
      }
    }, 60000) // Every minute
  }
}

export default bundleAnalyzer