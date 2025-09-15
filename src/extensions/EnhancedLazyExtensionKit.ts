/**
 * Enhanced Lazy Extension Kit with Priority Loading and Service Worker Caching
 * Optimizes extension loading based on user behavior and usage patterns
 */
'use client'

import { Extension } from '@tiptap/core'

// Extension priority levels
export type ExtensionPriority = 'critical' | 'high' | 'medium' | 'low'

// Extension loading strategy
export type LoadingStrategy = 'immediate' | 'idle' | 'interaction' | 'viewport'

interface ExtensionDefinition {
  name: string
  loader: () => Promise<Extension>
  priority: ExtensionPriority
  strategy: LoadingStrategy
  dependencies?: string[]
  size?: number // estimated bundle size in KB
}

// Extension registry with metadata
const extensionRegistry = new Map<string, ExtensionDefinition>()

// Loading state tracking
const loadingStates = new Map<string, 'pending' | 'loading' | 'loaded' | 'error'>()
const loadedExtensions = new Map<string, Extension>()

// Performance monitoring
interface LoadingMetrics {
  startTime: number
  endTime?: number
  size?: number
  priority: ExtensionPriority
  strategy: LoadingStrategy
}
const loadingMetrics = new Map<string, LoadingMetrics>()

/**
 * Register extensions with metadata
 */
export function registerExtension(definition: ExtensionDefinition) {
  extensionRegistry.set(definition.name, definition)
  loadingStates.set(definition.name, 'pending')
}

/**
 * Enhanced Extension Loader with priority and strategy handling
 */
export class EnhancedExtensionLoader {
  private static instance: EnhancedExtensionLoader
  private loadingQueue: string[] = []
  private idleCallback: number | null = null
  private intersectionObserver: IntersectionObserver | null = null
  
  static getInstance(): EnhancedExtensionLoader {
    if (!EnhancedExtensionLoader.instance) {
      EnhancedExtensionLoader.instance = new EnhancedExtensionLoader()
    }
    return EnhancedExtensionLoader.instance
  }
  
  private constructor() {
    this.initializeServiceWorker()
    this.setupIntersectionObserver()
  }
  
  /**
   * Initialize Service Worker for caching extensions
   */
  private async initializeServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }
    
    try {
      const registration = await navigator.serviceWorker.register('/sw-extensions.js', {
        scope: '/',
      })
      console.log('Extension Service Worker registered:', registration)
    } catch (error) {
      console.warn('Extension Service Worker registration failed:', error)
    }
  }
  
  /**
   * Setup Intersection Observer for viewport-based loading
   */
  private setupIntersectionObserver() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return
    }
    
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const extensionName = entry.target.getAttribute('data-extension')
            if (extensionName) {
              this.loadExtension(extensionName)
            }
          }
        })
      },
      { threshold: 0.1 }
    )
  }
  
  /**
   * Load extension based on priority and strategy
   */
  async loadExtension(name: string): Promise<Extension | null> {
    const definition = extensionRegistry.get(name)
    if (!definition) {
      console.warn(`Extension ${name} not found in registry`)
      return null
    }
    
    const currentState = loadingStates.get(name)
    if (currentState === 'loaded') {
      return loadedExtensions.get(name) || null
    }
    
    if (currentState === 'loading') {
      // Wait for existing load
      return this.waitForLoad(name)
    }
    
    loadingStates.set(name, 'loading')
    
    // Start performance tracking
    loadingMetrics.set(name, {
      startTime: performance.now(),
      priority: definition.priority,
      strategy: definition.strategy
    })
    
    try {
      // Load dependencies first
      if (definition.dependencies) {
        await Promise.all(
          definition.dependencies.map(dep => this.loadExtension(dep))
        )
      }
      
      // Apply loading strategy
      const extension = await this.applyLoadingStrategy(definition)
      
      loadedExtensions.set(name, extension)
      loadingStates.set(name, 'loaded')
      
      // Complete performance tracking
      const metrics = loadingMetrics.get(name)
      if (metrics) {
        metrics.endTime = performance.now()
        metrics.size = definition.size
      }
      
      return extension
    } catch (error) {
      console.error(`Failed to load extension ${name}:`, error)
      loadingStates.set(name, 'error')
      return null
    }
  }
  
  /**
   * Apply loading strategy
   */
  private async applyLoadingStrategy(definition: ExtensionDefinition): Promise<Extension> {
    switch (definition.strategy) {
      case 'immediate':
        return await definition.loader()
        
      case 'idle':
        return new Promise((resolve, reject) => {
          const loadWhenIdle = () => {
            definition.loader().then(resolve).catch(reject)
          }
          
          if ('requestIdleCallback' in window) {
            requestIdleCallback(loadWhenIdle, { timeout: 5000 })
          } else {
            setTimeout(loadWhenIdle, 0)
          }
        })
        
      case 'interaction':
        // Load on first user interaction
        return new Promise((resolve, reject) => {
          const loadOnInteraction = () => {
            definition.loader().then(resolve).catch(reject)
            document.removeEventListener('click', loadOnInteraction, { once: true })
            document.removeEventListener('keydown', loadOnInteraction, { once: true })
          }
          
          document.addEventListener('click', loadOnInteraction, { once: true })
          document.addEventListener('keydown', loadOnInteraction, { once: true })
          
          // Fallback timeout
          setTimeout(() => {
            document.removeEventListener('click', loadOnInteraction)
            document.removeEventListener('keydown', loadOnInteraction)
            definition.loader().then(resolve).catch(reject)
          }, 10000)
        })
        
      case 'viewport':
        // Already handled by intersection observer
        return await definition.loader()
        
      default:
        return await definition.loader()
    }
  }
  
  /**
   * Wait for extension to load
   */
  private async waitForLoad(name: string): Promise<Extension | null> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const state = loadingStates.get(name)
        if (state === 'loaded') {
          clearInterval(checkInterval)
          resolve(loadedExtensions.get(name) || null)
        } else if (state === 'error') {
          clearInterval(checkInterval)
          resolve(null)
        }
      }, 50)
      
      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        resolve(null)
      }, 30000)
    })
  }
  
  /**
   * Load extensions by priority
   */
  async loadByPriority(priority: ExtensionPriority): Promise<Extension[]> {
    const extensions = Array.from(extensionRegistry.entries())
      .filter(([, def]) => def.priority === priority)
      .map(([name]) => name)
    
    const results = await Promise.all(
      extensions.map(name => this.loadExtension(name))
    )
    
    return results.filter((ext): ext is Extension => ext !== null)
  }
  
  /**
   * Get loading performance metrics
   */
  getPerformanceMetrics(): Map<string, LoadingMetrics> {
    return new Map(loadingMetrics)
  }
  
  /**
   * Preload critical extensions
   */
  async preloadCritical(): Promise<void> {
    await this.loadByPriority('critical')
  }
  
  /**
   * Get loaded extensions
   */
  getLoadedExtensions(): Extension[] {
    return Array.from(loadedExtensions.values())
  }
  
  /**
   * Clear cache and reset
   */
  reset(): void {
    loadingStates.clear()
    loadedExtensions.clear()
    loadingMetrics.clear()
    this.loadingQueue = []
  }
}

// Export singleton instance
export const extensionLoader = EnhancedExtensionLoader.getInstance()

// Register common extensions with priorities
registerExtension({
  name: 'StarterKit',
  loader: async () => {
    const { StarterKit } = await import('@tiptap/starter-kit')
    return StarterKit.configure({
      history: false, // Handled by collaboration
      heading: { levels: [1, 2, 3, 4, 5, 6] },
    })
  },
  priority: 'critical',
  strategy: 'immediate',
  size: 45
})

registerExtension({
  name: 'Placeholder',
  loader: async () => {
    const { Placeholder } = await import('@tiptap/extension-placeholder')
    return Placeholder.configure({
      placeholder: 'Start writing...',
      showOnlyWhenEditable: true,
    })
  },
  priority: 'critical',
  strategy: 'immediate',
  size: 8
})

registerExtension({
  name: 'TextAlign',
  loader: async () => {
    const { TextAlign } = await import('@tiptap/extension-text-align')
    return TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    })
  },
  priority: 'high',
  strategy: 'interaction',
  size: 12
})

registerExtension({
  name: 'Typography',
  loader: async () => {
    const { Typography } = await import('@tiptap/extension-typography')
    return Typography.configure({
      openDoubleQuote: '"',
      closeDoubleQuote: '"',
      ellipsis: '…',
      emDash: '—',
    })
  },
  priority: 'medium',
  strategy: 'idle',
  size: 15
})

registerExtension({
  name: 'Table',
  loader: async () => {
    const [
      { Table },
      { TableRow },
      { TableHeader },
      { TableCell }
    ] = await Promise.all([
      import('@tiptap/extension-table'),
      import('@tiptap/extension-table-row'),
      import('@tiptap/extension-table-header'),
      import('@tiptap/extension-table-cell')
    ])
    
    return [
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell
    ]
  },
  priority: 'medium',
  strategy: 'interaction',
  size: 35
})

/**
 * Enhanced Extension Kit Factory
 */
export const EnhancedExtensionKit = async (options: {
  priority?: ExtensionPriority
  preload?: boolean
  collaboration?: boolean
  ydoc?: any
  provider?: any
  user?: any
} = {}) => {
  const { priority = 'high', preload = true } = options
  
  // Preload critical extensions if requested
  if (preload) {
    await extensionLoader.preloadCritical()
  }
  
  // Load extensions by priority
  let extensions: Extension[] = []
  
  switch (priority) {
    case 'critical':
      extensions = await extensionLoader.loadByPriority('critical')
      break
    case 'high':
      const critical = await extensionLoader.loadByPriority('critical')
      const high = await extensionLoader.loadByPriority('high')
      extensions = [...critical, ...high]
      break
    case 'medium':
      const criticalMed = await extensionLoader.loadByPriority('critical')
      const highMed = await extensionLoader.loadByPriority('high')
      const medium = await extensionLoader.loadByPriority('medium')
      extensions = [...criticalMed, ...highMed, ...medium]
      break
    case 'low':
      extensions = extensionLoader.getLoadedExtensions()
      break
  }
  
  // Add collaboration extensions if needed
  if (options.collaboration && options.ydoc && options.provider) {
    const [{ Collaboration }, { CollaborationCursor }] = await Promise.all([
      import('@tiptap/extension-collaboration'),
      import('@tiptap/extension-collaboration-cursor')
    ])
    
    extensions.push(
      Collaboration.configure({ document: options.ydoc }),
      CollaborationCursor.configure({
        provider: options.provider,
        user: options.user || { name: 'Anonymous', color: '#f783ac' }
      })
    )
  }
  
  return extensions.flat()
}

export default EnhancedExtensionKit