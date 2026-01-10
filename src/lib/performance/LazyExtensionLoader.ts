/**
 * Lazy Extension Loader
 * 
 * Dynamically loads TipTap extensions to reduce initial bundle size
 * and improve editor startup time.
 */

import { Extension } from '@tiptap/core';

export type ExtensionLoader<T extends Extension = Extension> = () => Promise<{ default: T } | T>;

interface LazyExtensionConfig {
  name: string;
  load: ExtensionLoader;
  priority?: 'critical' | 'high' | 'normal' | 'low';
  preload?: boolean;
}

class LazyExtensionManager {
  private loadedExtensions: Map<string, Extension> = new Map();
  private loadingPromises: Map<string, Promise<Extension>> = new Map();
  private preloadQueue: LazyExtensionConfig[] = [];

  /**
   * Register an extension for lazy loading
   */
  register(config: LazyExtensionConfig): void {
    if (config.preload) {
      this.preloadQueue.push(config);
    }
  }

  /**
   * Load an extension by name
   */
  async load(name: string, loader: ExtensionLoader): Promise<Extension> {
    // Return cached extension if already loaded
    if (this.loadedExtensions.has(name)) {
      return this.loadedExtensions.get(name)!;
    }

    // Return existing promise if currently loading
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name)!;
    }

    // Create loading promise
    const loadPromise = (async () => {
      try {
        const module = await loader();
        const extension = 'default' in module ? module.default : module;
        this.loadedExtensions.set(name, extension as Extension);
        this.loadingPromises.delete(name);
        return extension as Extension;
      } catch (error) {
        this.loadingPromises.delete(name);
        console.error(`Failed to load extension "${name}":`, error);
        throw error;
      }
    })();

    this.loadingPromises.set(name, loadPromise);
    return loadPromise;
  }

  /**
   * Preload registered extensions in order of priority
   */
  async preloadExtensions(): Promise<void> {
    // Sort by priority
    const sorted = [...this.preloadQueue].sort((a, b) => {
      const priorities = { critical: 0, high: 1, normal: 2, low: 3 };
      return (priorities[a.priority || 'normal'] || 2) - (priorities[b.priority || 'normal'] || 2);
    });

    // Load critical and high priority first
    const criticalAndHigh = sorted.filter(c => c.priority === 'critical' || c.priority === 'high');
    await Promise.all(criticalAndHigh.map(c => this.load(c.name, c.load)));

    // Load rest in background
    const rest = sorted.filter(c => c.priority !== 'critical' && c.priority !== 'high');
    setTimeout(() => {
      rest.forEach(c => this.load(c.name, c.load));
    }, 100);
  }

  /**
   * Check if an extension is loaded
   */
  isLoaded(name: string): boolean {
    return this.loadedExtensions.has(name);
  }

  /**
   * Get a loaded extension
   */
  get(name: string): Extension | undefined {
    return this.loadedExtensions.get(name);
  }

  /**
   * Clear all loaded extensions
   */
  clear(): void {
    this.loadedExtensions.clear();
    this.loadingPromises.clear();
    this.preloadQueue = [];
  }
}

// Singleton instance
export const lazyExtensionManager = new LazyExtensionManager();

/**
 * Create a lazy-loadable extension configuration
 */
export function createLazyExtension<T extends Extension>(
  name: string,
  loader: ExtensionLoader<T>,
  options: { priority?: 'critical' | 'high' | 'normal' | 'low'; preload?: boolean } = {}
): LazyExtensionConfig {
  const config: LazyExtensionConfig = {
    name,
    load: loader,
    ...options,
  };
  
  lazyExtensionManager.register(config);
  
  return config;
}

// Pre-configured lazy extensions
export const LAZY_EXTENSIONS = {
  // Critical - needed immediately
  starterKit: createLazyExtension(
    'starterKit',
    () => import('@tiptap/starter-kit').then(m => m.StarterKit),
    { priority: 'critical', preload: true }
  ),
  
  // High - needed for basic editing
  placeholder: createLazyExtension(
    'placeholder',
    () => import('@tiptap/extension-placeholder').then(m => m.Placeholder),
    { priority: 'high', preload: true }
  ),
  
  // Normal - AI features
  ghostText: createLazyExtension(
    'ghostText',
    () => import('@/extensions/GhostText').then(m => m.GhostTextExtension),
    { priority: 'normal' }
  ),
  
  slashCommands: createLazyExtension(
    'slashCommands',
    () => import('@/extensions/AISlashCommands').then(m => m.AISlashCommands),
    { priority: 'normal' }
  ),
  
  writingAnalysis: createLazyExtension(
    'writingAnalysis',
    () => import('@/extensions/WritingAnalysis').then(m => m.WritingAnalysis),
    { priority: 'low' }
  ),
};

export default lazyExtensionManager;
