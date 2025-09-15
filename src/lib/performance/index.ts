/**
 * Performance optimization utilities for SpectreWeave5
 */

// Debounce utility for expensive operations
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

// Throttle utility for high-frequency events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  }

  return new IntersectionObserver(callback, defaultOptions)
}

// Web Workers for heavy computations
export const createWebWorker = (workerFunction: Function): Worker => {
  const workerBlob = new Blob([`(${workerFunction.toString()})()`], {
    type: 'application/javascript'
  })
  
  return new Worker(URL.createObjectURL(workerBlob))
}

// Request Idle Callback polyfill for non-critical tasks
export const requestIdleCallback = (
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options)
  }
  
  // Fallback for browsers that don't support requestIdleCallback
  return setTimeout(() => {
    const start = Date.now()
    callback({
      didTimeout: false,
      timeRemaining() {
        return Math.max(0, 50 - (Date.now() - start))
      }
    })
  }, 1) as unknown as number
}

// Memory management utilities
export const createObjectPool = <T>(
  createFn: () => T,
  resetFn: (obj: T) => void,
  initialSize: number = 10
) => {
  const pool: T[] = []
  
  // Initialize pool
  for (let i = 0; i < initialSize; i++) {
    pool.push(createFn())
  }
  
  return {
    acquire(): T {
      return pool.pop() || createFn()
    },
    
    release(obj: T): void {
      resetFn(obj)
      pool.push(obj)
    },
    
    size(): number {
      return pool.length
    }
  }
}

// Virtual scrolling utility for large lists
export const calculateVirtualItems = (
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  scrollTop: number,
  overscan: number = 5
) => {
  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    totalItems - 1
  )
  
  const start = Math.max(0, visibleStart - overscan)
  const end = Math.min(totalItems - 1, visibleEnd + overscan)
  
  const items = []
  for (let i = start; i <= end; i++) {
    items.push({
      index: i,
      offsetTop: i * itemHeight,
      height: itemHeight
    })
  }
  
  return {
    items,
    totalHeight: totalItems * itemHeight,
    startIndex: start,
    endIndex: end
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  
  startTiming(name: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      
      if (!this.metrics.has(name)) {
        this.metrics.set(name, [])
      }
      
      this.metrics.get(name)!.push(duration)
    }
  }
  
  getAverageTime(name: string): number {
    const times = this.metrics.get(name) || []
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  }
  
  getMetrics(): Record<string, { average: number; samples: number }> {
    const result: Record<string, { average: number; samples: number }> = {}
    
    for (const [name, times] of this.metrics) {
      result[name] = {
        average: this.getAverageTime(name),
        samples: times.length
      }
    }
    
    return result
  }
  
  reset(): void {
    this.metrics.clear()
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Bundle splitting utilities
export const loadChunk = async (chunkName: string): Promise<any> => {
  try {
    switch (chunkName) {
      case 'ai-features':
        return await import('@/components/editor/AIWritingAssistant')
      case 'advanced-formatting':
        return await import('@/components/editor/AdvancedFormatting')
      case 'analytics':
        return await import('@/components/editor/WritingAnalytics')
      default:
        throw new Error(`Unknown chunk: ${chunkName}`)
    }
  } catch (error) {
    console.error(`Failed to load chunk ${chunkName}:`, error)
    throw error
  }
}

// Resource hints for better loading performance
export const addResourceHints = () => {
  const head = document.head
  
  // Preload critical chunks
  const criticalChunks = [
    '/chunks/ai-features.js',
    '/chunks/advanced-formatting.js',
    '/chunks/analytics.js'
  ]
  
  criticalChunks.forEach(chunk => {
    const link = document.createElement('link')
    link.rel = 'modulepreload'
    link.href = chunk
    head.appendChild(link)
  })
}

// Initialize performance optimizations
export const initializePerformanceOptimizations = () => {
  // Add resource hints
  if (typeof window !== 'undefined') {
    addResourceHints()
    
    // Monitor Core Web Vitals if available
    if ('web-vital' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log)
        getFID(console.log)
        getFCP(console.log)
        getLCP(console.log)
        getTTFB(console.log)
      })
    }
  }
}