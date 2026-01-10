/**
 * Model Selector Component
 * 
 * Dropdown for selecting AI models, similar to VSCode Copilot's model picker.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIModel, FREE_MODELS, DEFAULT_MODEL } from './types';

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  models?: AIModel[];
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  models = FREE_MODELS,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs',
          'bg-[--ide-input-bg] border border-[--ide-border]',
          'hover:bg-[--ide-list-hover] transition-colors',
          'text-[--ide-foreground]'
        )}
      >
        <span className="text-sm">{selectedModel.icon || '🤖'}</span>
        <span className="font-medium">{selectedModel.name}</span>
        {selectedModel.isFree && (
          <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-medium">
            FREE
          </span>
        )}
        <ChevronDown className={cn(
          'w-3 h-3 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className={cn(
          'absolute top-full left-0 mt-1 w-72 z-50',
          'bg-[--ide-dropdown-bg] border border-[--ide-border] rounded-lg shadow-xl',
          'py-1 max-h-80 overflow-auto'
        )}>
          <div className="px-3 py-2 border-b border-[--ide-border]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[--ide-foreground-muted]">
              Select Model
            </p>
          </div>
          
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onModelChange(model);
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-3 py-2 flex items-start gap-3 text-left',
                'hover:bg-[--ide-list-hover] transition-colors',
                selectedModel.id === model.id && 'bg-[--ide-list-active]'
              )}
            >
              <span className="text-lg mt-0.5">{model.icon || '🤖'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-[--ide-foreground]">
                    {model.name}
                  </span>
                  {model.isFree && (
                    <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-medium">
                      FREE
                    </span>
                  )}
                </div>
                {model.description && (
                  <p className="text-[11px] text-[--ide-foreground-muted] truncate">
                    {model.description}
                  </p>
                )}
              </div>
              {selectedModel.id === model.id && (
                <Check className="w-4 h-4 text-[--ide-accent] mt-1" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
