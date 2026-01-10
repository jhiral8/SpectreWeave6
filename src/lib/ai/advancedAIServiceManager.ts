'use client';

/**
 * Advanced AI Service Manager
 * 
 * Manages multiple AI service providers with failover, load balancing,
 * and advanced routing capabilities.
 */

import { AIProvider, AIRequest, AIResponse } from './types';

export interface ServiceHealth {
  provider: AIProvider;
  isHealthy: boolean;
  latency: number;
  lastChecked: Date;
  errorCount: number;
}

export interface ServiceConfig {
  provider: AIProvider;
  priority: number;
  maxRetries: number;
  timeout: number;
  enabled: boolean;
}

/**
 * Advanced AI Service Manager
 * 
 * Provides intelligent routing across multiple AI providers with:
 * - Health monitoring
 * - Automatic failover
 * - Load balancing
 * - Cost optimization
 */
export class AdvancedAIServiceManager {
  private services: Map<AIProvider, ServiceConfig> = new Map();
  private healthStatus: Map<AIProvider, ServiceHealth> = new Map();
  
  constructor() {
    // Initialize with default providers
    this.initializeDefaultServices();
  }
  
  private initializeDefaultServices(): void {
    const defaultProviders: AIProvider[] = ['openrouter', 'anthropic', 'openai', 'gemini'];
    
    defaultProviders.forEach((provider, index) => {
      this.services.set(provider, {
        provider,
        priority: index,
        maxRetries: 3,
        timeout: 30000,
        enabled: true,
      });
      
      this.healthStatus.set(provider, {
        provider,
        isHealthy: true,
        latency: 0,
        lastChecked: new Date(),
        errorCount: 0,
      });
    });
  }
  
  /**
   * Get the best available provider based on health and priority
   */
  getBestProvider(): AIProvider {
    const healthyServices = Array.from(this.services.entries())
      .filter(([provider]) => {
        const health = this.healthStatus.get(provider);
        return health?.isHealthy && this.services.get(provider)?.enabled;
      })
      .sort((a, b) => a[1].priority - b[1].priority);
    
    if (healthyServices.length === 0) {
      return 'openrouter'; // Default fallback
    }
    
    return healthyServices[0][0];
  }
  
  /**
   * Check if a provider is healthy
   */
  isProviderHealthy(provider: AIProvider): boolean {
    return this.healthStatus.get(provider)?.isHealthy ?? false;
  }
  
  /**
   * Update provider health status
   */
  updateHealth(provider: AIProvider, isHealthy: boolean, latency?: number): void {
    const current = this.healthStatus.get(provider);
    if (current) {
      this.healthStatus.set(provider, {
        ...current,
        isHealthy,
        latency: latency ?? current.latency,
        lastChecked: new Date(),
        errorCount: isHealthy ? 0 : current.errorCount + 1,
      });
    }
  }
  
  /**
   * Get all service health statuses
   */
  getAllHealth(): ServiceHealth[] {
    return Array.from(this.healthStatus.values());
  }
  
  /**
   * Enable or disable a provider
   */
  setProviderEnabled(provider: AIProvider, enabled: boolean): void {
    const config = this.services.get(provider);
    if (config) {
      this.services.set(provider, { ...config, enabled });
    }
  }
  
  /**
   * Get service configuration
   */
  getServiceConfig(provider: AIProvider): ServiceConfig | undefined {
    return this.services.get(provider);
  }
}

// Singleton instance
export const advancedAIServiceManager = new AdvancedAIServiceManager();

export default AdvancedAIServiceManager;
