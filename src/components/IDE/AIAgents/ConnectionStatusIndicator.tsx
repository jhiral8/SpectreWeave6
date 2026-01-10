/**
 * AI Connection Status Indicator
 * 
 * Visual indicator for AI API connection status with
 * reconnection controls and status details.
 */

'use client';

import React from 'react';
import { useProductionAgents, ConnectionStatus } from './ProductionAgentProvider';
import { Wifi, WifiOff, Loader2, AlertCircle, RefreshCw, Check } from 'lucide-react';

interface ConnectionStatusIndicatorProps {
  /** Show full status text */
  showText?: boolean;
  /** Compact mode for status bar */
  compact?: boolean;
  /** Show last check time */
  showLastCheck?: boolean;
  /** Custom class name */
  className?: string;
}

const statusConfig: Record<ConnectionStatus, {
  icon: typeof Wifi;
  color: string;
  text: string;
  bgColor: string;
}> = {
  connected: {
    icon: Wifi,
    color: 'text-green-500',
    text: 'Connected',
    bgColor: 'bg-green-500/10',
  },
  disconnected: {
    icon: WifiOff,
    color: 'text-red-500',
    text: 'Disconnected',
    bgColor: 'bg-red-500/10',
  },
  checking: {
    icon: Loader2,
    color: 'text-yellow-500',
    text: 'Checking...',
    bgColor: 'bg-yellow-500/10',
  },
  error: {
    icon: AlertCircle,
    color: 'text-orange-500',
    text: 'Error',
    bgColor: 'bg-orange-500/10',
  },
};

export function ConnectionStatusIndicator({
  showText = true,
  compact = false,
  showLastCheck = false,
  className = '',
}: ConnectionStatusIndicatorProps) {
  const { connectionStatus, lastHealthCheck, checkConnection, provider } = useProductionAgents();
  const config = statusConfig[connectionStatus];
  const Icon = config.icon;
  
  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (compact) {
    return (
      <button
        onClick={checkConnection}
        className={`
          flex items-center gap-1.5 px-2 py-1 rounded text-xs
          ${config.color} ${config.bgColor}
          hover:opacity-80 transition-opacity cursor-pointer
          ${className}
        `}
        title={`AI Status: ${config.text} (${provider})`}
      >
        <Icon className={`w-3 h-3 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} />
        {showText && <span>{config.text}</span>}
      </button>
    );
  }
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`
        flex items-center gap-2 px-3 py-1.5 rounded-md
        ${config.bgColor} border border-current/10
      `}>
        <Icon 
          className={`
            w-4 h-4 ${config.color}
            ${connectionStatus === 'checking' ? 'animate-spin' : ''}
          `}
        />
        
        {showText && (
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${config.color}`}>
              {config.text}
            </span>
            {showLastCheck && lastHealthCheck && (
              <span className="text-xs text-muted-foreground">
                Last check: {formatTime(lastHealthCheck)}
              </span>
            )}
          </div>
        )}
        
        <button
          onClick={checkConnection}
          disabled={connectionStatus === 'checking'}
          className={`
            p-1 rounded hover:bg-white/10 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          title="Check connection"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Provider badge */}
      <div className="px-2 py-1 rounded bg-muted text-xs text-muted-foreground">
        {provider.charAt(0).toUpperCase() + provider.slice(1)}
      </div>
    </div>
  );
}

/**
 * Status bar item for connection status
 */
export function StatusBarConnectionStatus() {
  return (
    <ConnectionStatusIndicator
      compact
      showText={false}
    />
  );
}

/**
 * Detailed connection status panel
 */
export function ConnectionStatusPanel() {
  const { 
    connectionStatus, 
    lastHealthCheck, 
    checkConnection, 
    provider,
    setProvider,
    activeTasks,
    taskHistory,
  } = useProductionAgents();
  
  const config = statusConfig[connectionStatus];
  const Icon = config.icon;
  
  const providers: { id: 'gemini' | 'databricks' | 'azure' | 'openai'; name: string }[] = [
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'databricks', name: 'Databricks' },
    { id: 'azure', name: 'Azure OpenAI' },
    { id: 'openai', name: 'OpenAI' },
  ];
  
  return (
    <div className="p-4 space-y-4">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon 
            className={`
              w-5 h-5 ${config.color}
              ${connectionStatus === 'checking' ? 'animate-spin' : ''}
            `}
          />
          <span className={`font-medium ${config.color}`}>{config.text}</span>
        </div>
        
        <button
          onClick={checkConnection}
          disabled={connectionStatus === 'checking'}
          className="
            flex items-center gap-1.5 px-3 py-1.5 rounded-md
            bg-primary/10 text-primary text-sm
            hover:bg-primary/20 transition-colors
            disabled:opacity-50
          "
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Check
        </button>
      </div>
      
      {/* Last check time */}
      {lastHealthCheck && (
        <p className="text-xs text-muted-foreground">
          Last checked: {lastHealthCheck.toLocaleString()}
        </p>
      )}
      
      {/* Provider selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">AI Provider</label>
        <div className="grid grid-cols-2 gap-2">
          {providers.map(p => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`
                px-3 py-2 rounded-md text-sm border transition-colors
                ${provider === p.id 
                  ? 'bg-primary/10 border-primary text-primary' 
                  : 'border-border hover:bg-muted'
                }
              `}
            >
              <div className="flex items-center gap-2">
                {provider === p.id && <Check className="w-3.5 h-3.5" />}
                {p.name}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Active Tasks</p>
          <p className="text-lg font-semibold">{activeTasks.length}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Tasks</p>
          <p className="text-lg font-semibold">{taskHistory.length}</p>
        </div>
      </div>
    </div>
  );
}

export default ConnectionStatusIndicator;
