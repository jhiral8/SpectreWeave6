/**
 * AI Service Status Component
 * 
 * Displays the status of all configured AI services and their availability
 * for research and writing assistance features.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Settings, Zap } from 'lucide-react';
import { aiService } from '../../lib/services/ai';
import { deepResearchService } from '../../services/deepResearchService';
import { cn } from '../../lib/utils';

interface ServiceStatus {
  provider: string;
  available: boolean;
  lastChecked: number;
  error?: string;
}

interface ResearchStatus {
  isInitialized: boolean;
  enableWebSearch: boolean;
  enableAcademicSearch: boolean;
  hasWebSearchApi: boolean;
  hasAcademicApi: boolean;
  aiServiceAvailable: boolean;
  availableProviders: string[];
}

export const AIServiceStatus: React.FC = () => {
  const [aiStatuses, setAiStatuses] = useState<ServiceStatus[]>([]);
  const [researchStatus, setResearchStatus] = useState<ResearchStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    setIsLoading(true);
    try {
      const [aiProviders, research] = await Promise.all([
        aiService.getProviderStatus(),
        deepResearchService.getStatus()
      ]);
      
      setAiStatuses(aiProviders);
      setResearchStatus(research);
    } catch (error) {
      console.error('Failed to load AI service statuses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (available: boolean, error?: string) => {
    if (error) return <XCircle className="w-4 h-4 text-red-600" />;
    if (available) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <AlertCircle className="w-4 h-4 text-yellow-600" />;
  };

  const getStatusColor = (available: boolean, error?: string) => {
    if (error) return 'text-red-600';
    if (available) return 'text-green-600';
    return 'text-yellow-600';
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-neutral-300 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">Loading AI service status...</span>
        </div>
      </div>
    );
  }

  const availableCount = aiStatuses.filter(s => s.available).length;
  const totalCount = aiStatuses.length;

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">AI Services</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {availableCount} of {totalCount} providers available
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
            title="Toggle details"
          >
            <Settings className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Quick Status Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {aiStatuses.map((status) => (
            <div key={status.provider} className="flex items-center space-x-2">
              {getStatusIcon(status.available, status.error)}
              <span className={cn('text-sm font-medium capitalize', getStatusColor(status.available, status.error))}>
                {status.provider}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Research Service Status */}
      {researchStatus && (
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3 mb-3">
            <CheckCircle className={cn('w-5 h-5', researchStatus.aiServiceAvailable ? 'text-green-600' : 'text-yellow-600')} />
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Research Tools</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                AI-powered research with {researchStatus.availableProviders.length} providers
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Web Search:</span>
              <span className={cn('ml-2', researchStatus.hasWebSearchApi ? 'text-green-600' : 'text-yellow-600')}>
                {researchStatus.hasWebSearchApi ? 'Configured' : 'Simulated'}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Academic Search:</span>
              <span className={cn('ml-2', researchStatus.hasAcademicApi ? 'text-green-600' : 'text-yellow-600')}>
                {researchStatus.hasAcademicApi ? 'Configured' : 'Simulated'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Status */}
      {showDetails && (
        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">Provider Details</h4>
          <div className="space-y-3">
            {aiStatuses.map((status) => (
              <div key={status.provider} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(status.available, status.error)}
                  <div>
                    <div className="font-medium capitalize text-neutral-900 dark:text-neutral-100">
                      {status.provider}
                    </div>
                    {status.error && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        {status.error}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> AI services are automatically integrated with the research tools. 
              Configure API keys in your .env.local file to enable additional providers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};