'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Paperclip, 
  Send, 
  Loader2, 
  ChevronDown,
  Wrench,
} from 'lucide-react';
import type { ChatInputProps, AIModelOption } from './types';

/** Default models */
const DEFAULT_MODELS: AIModelOption[] = [
  { id: 'claude-sonnet', name: 'Claude Sonnet 4.5', provider: 'Anthropic' },
  { id: 'claude-opus', name: 'Claude Opus 4.5', provider: 'Anthropic' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
];

/** Mode options */
const MODE_OPTIONS = [
  { id: 'agent', label: 'Agent' },
  { id: 'chat', label: 'Chat' },
];

/**
 * Chat Input Component - VS Code Copilot style
 * 
 * Target Layout:
 * ┌─────────────────────────────────────────────────────┐
 * │ [📎 Add Context...]                                 │
 * │                                                     │
 * │ Ask the Ghost Writer...                             │
 * │                                                     │
 * │ Agent ▾   Claude Opus 4.5 ▾              🔧   ▷ ▾  │
 * └─────────────────────────────────────────────────────┘
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  onAttach,
  placeholder,
  isLoading = false,
  disabled = false,
  models = DEFAULT_MODELS,
  selectedModel,
  onModelChange,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [selectedMode, setSelectedMode] = useState('agent');
  
  const currentModel = selectedModel || models[0];

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '24px';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSubmit();
      }
    }
  }, [value, isLoading, disabled, onSubmit]);

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowModelMenu(false);
      setShowModeMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const canSubmit = value.trim().length > 0 && !isLoading && !disabled;
  const dynamicPlaceholder = placeholder || 'Ask the Ghost Writer...';

  return (
    <div
      className={cn(
        "flex flex-col mx-3 mb-3 rounded overflow-hidden",
        "border border-[var(--ide-border)]",
        "bg-[var(--ide-bg)]"
      )}
    >
      {/* Row 1: Add Context Button */}
      <div className="px-2.5 pt-2.5 pb-1">
        <button
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5",
            "rounded border border-[var(--ide-border)]",
            "text-[11px] text-[var(--ide-foreground-muted)]",
            "hover:bg-[var(--ide-hover-bg)]",
            "transition-colors"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onAttach?.();
          }}
          disabled={disabled}
        >
          <Paperclip className="w-3.5 h-3.5" />
          <span>Add Context...</span>
        </button>
      </div>

      {/* Row 2: Textarea */}
      <div className="px-2.5 py-1.5">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dynamicPlaceholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "w-full bg-transparent resize-none outline-none",
            "text-[12px] leading-relaxed",
            "text-[var(--ide-foreground)]",
            "placeholder:text-[var(--ide-foreground-muted)]"
          )}
          style={{
            minHeight: '20px',
            maxHeight: '100px',
          }}
        />
      </div>

      {/* Row 3: Bottom Bar - Mode | Model | (spacer) | Tools | Send */}
      <div className="flex items-center justify-between px-2.5 pb-2.5 pt-1">
        {/* Left: Mode + Model selectors */}
        <div className="flex items-center gap-3">
          {/* Mode Selector (Agent / Chat) */}
          <div className="relative">
            <button
              className={cn(
                "flex items-center gap-0.5",
                "text-[11px] text-[var(--ide-foreground-muted)]",
                "hover:text-[var(--ide-foreground)]"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setShowModeMenu(!showModeMenu);
              }}
            >
              <span>{selectedMode === 'agent' ? 'Agent' : 'Chat'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showModeMenu && (
              <div 
                className={cn(
                  "absolute bottom-full left-0 mb-1 min-w-[80px]",
                  "bg-[var(--ide-bg)] border border-[var(--ide-border)]",
                  "rounded shadow-lg py-0.5 z-50"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {MODE_OPTIONS.map((mode) => (
                  <button
                    key={mode.id}
                    className={cn(
                      "w-full px-2.5 py-1 text-left text-[11px]",
                      "text-[var(--ide-foreground)]",
                      "hover:bg-[var(--ide-hover-bg)]",
                      selectedMode === mode.id && "bg-[var(--ide-hover-bg)]"
                    )}
                    onClick={() => {
                      setSelectedMode(mode.id);
                      setShowModeMenu(false);
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model Selector */}
          <div className="relative">
            <button
              className={cn(
                "flex items-center gap-0.5",
                "text-[11px] text-[var(--ide-foreground-muted)]",
                "hover:text-[var(--ide-foreground)]"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setShowModelMenu(!showModelMenu);
              }}
            >
              <span>{currentModel.name}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showModelMenu && (
              <div 
                className={cn(
                  "absolute bottom-full left-0 mb-1 min-w-[160px]",
                  "bg-[var(--ide-bg)] border border-[var(--ide-border)]",
                  "rounded shadow-lg py-0.5 z-50"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {models.map((model) => (
                  <button
                    key={model.id}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1 text-left",
                      "text-[11px] text-[var(--ide-foreground)]",
                      "hover:bg-[var(--ide-hover-bg)]",
                      currentModel.id === model.id && "bg-[var(--ide-hover-bg)]"
                    )}
                    onClick={() => {
                      onModelChange?.(model);
                      setShowModelMenu(false);
                    }}
                  >
                    <span>{model.name}</span>
                    <span className="text-[10px] text-[var(--ide-foreground-muted)]">
                      {model.provider}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Tools + Send */}
        <div className="flex items-center gap-1">
          {/* Tools button */}
          <button
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded",
              "text-[var(--ide-foreground-muted)]",
              "hover:bg-[var(--ide-hover-bg)]",
              "hover:text-[var(--ide-foreground)]"
            )}
            title="Tools"
          >
            <Wrench className="w-4 h-4" />
          </button>

          {/* Send button with dropdown */}
          <button
            className={cn(
              "flex items-center gap-0.5 px-1 h-6 rounded",
              canSubmit
                ? "text-[var(--ide-foreground)] hover:bg-[var(--ide-hover-bg)]"
                : "text-[var(--ide-foreground-muted)] opacity-50 cursor-not-allowed"
            )}
            onClick={() => canSubmit && onSubmit()}
            disabled={!canSubmit}
            title={isLoading ? 'Sending...' : 'Send message'}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" style={{ transform: 'rotate(-25deg)' }} />
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
