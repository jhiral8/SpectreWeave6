/**
 * AI Copilot Panel
 * 
 * A VSCode-style AI assistant panel with multiple modes:
 * - Discuss: Chat about your story
 * - Ghostwrite: Get AI to write for you
 * - Framework: Build your story framework
 * - Agents: Run specialized AI agents
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Pencil,
  BookOpen,
  Bot,
  Send,
  Loader2,
  Sparkles,
  Plus,
  ChevronRight,
  AtSign,
  FileText,
  User,
  MapPin,
  StickyNote,
  X,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  ArrowRight,
} from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import {
  CopilotMode,
  AIModel,
  Message,
  AICopilotPanelProps,
  FREE_MODELS,
  DEFAULT_MODEL,
  StoryCharacter,
  StoryLocation,
  StoryNote,
} from './types';

// Mode configuration
const MODES: { id: CopilotMode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'discuss', label: 'Discuss', icon: <MessageSquare className="w-4 h-4" />, description: 'Chat about your story' },
  { id: 'ghostwrite', label: 'Ghostwrite', icon: <Pencil className="w-4 h-4" />, description: 'AI writes for you' },
  { id: 'framework', label: 'Framework', icon: <BookOpen className="w-4 h-4" />, description: 'Build story structure' },
  { id: 'agents', label: 'Agents', icon: <Bot className="w-4 h-4" />, description: 'Run specialized AI' },
];

// Context menu options
type ContextType = 'selection' | 'document' | 'character' | 'location' | 'note';

export function AICopilotPanel({
  initialMode = 'discuss',
  documentContent,
  selectedText,
  cursorPosition,
  onInsertText,
  onReplaceSelection,
  onReplaceDocument,
  characters = [],
  locations = [],
  notes = [],
  chapterTitle,
  projectTitle,
  projectId,
  storyFramework,
  onCreateCharacter,
  onCreateLocation,
  onCreateNote,
  onUpdateFramework,
  onLaunchFrameworkWizard,
  onOpenFrameworkEditor,
  hasFramework,
  className,
}: AICopilotPanelProps) {
  // State
  const [mode, setMode] = useState<CopilotMode>(initialMode);
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [includedContext, setIncludedContext] = useState<{
    type: ContextType;
    label: string;
    content: string;
  } | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle @ mention for context
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '@') {
      setShowContextMenu(true);
    } else if (e.key === 'Escape') {
      setShowContextMenu(false);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build context for API call
  const buildContext = useCallback(() => {
    const contextParts: string[] = [];
    
    // Always include selected text if available
    if (selectedText) {
      contextParts.push(`Selected text:\n"${selectedText}"`);
    }
    
    // Always include document content if available
    if (documentContent) {
      contextParts.push(`Document content:\n${documentContent.slice(0, 2000)}${documentContent.length > 2000 ? '...' : ''}`);
    }
    
    // Include additional context from @ menu
    if (includedContext) {
      contextParts.push(`${includedContext.label}:\n${includedContext.content}`);
    }
    
    // Include chapter/project context
    if (chapterTitle) contextParts.push(`Current chapter: ${chapterTitle}`);
    if (projectTitle) contextParts.push(`Project: ${projectTitle}`);
    
    return contextParts.join('\n\n');
  }, [selectedText, documentContent, includedContext, chapterTitle, projectTitle]);

  // Add context from @ menu
  const addContext = (type: ContextType, id?: string) => {
    let contextData: { type: ContextType; label: string; content: string } | null = null;
    
    switch (type) {
      case 'selection':
        if (selectedText) {
          contextData = {
            type: 'selection',
            label: 'Selected Text',
            content: selectedText,
          };
        }
        break;
      case 'document':
        if (documentContent) {
          contextData = {
            type: 'document',
            label: 'Full Document',
            content: documentContent.slice(0, 3000),
          };
        }
        break;
      case 'character':
        const char = characters.find(c => c.id === id);
        if (char) {
          contextData = {
            type: 'character',
            label: `Character: ${char.name}`,
            content: `Name: ${char.name}\nRole: ${char.role || 'N/A'}\nDescription: ${char.description || 'N/A'}\nTraits: ${char.traits?.join(', ') || 'N/A'}`,
          };
        }
        break;
      case 'location':
        const loc = locations.find(l => l.id === id);
        if (loc) {
          contextData = {
            type: 'location',
            label: `Location: ${loc.name}`,
            content: `Name: ${loc.name}\nType: ${loc.type || 'N/A'}\nDescription: ${loc.description || 'N/A'}`,
          };
        }
        break;
      case 'note':
        const note = notes.find(n => n.id === id);
        if (note) {
          contextData = {
            type: 'note',
            label: `Note: ${note.title}`,
            content: note.content,
          };
        }
        break;
    }
    
    if (contextData) {
      setIncludedContext(contextData);
    }
    setShowContextMenu(false);
  };

  // Send message to AI
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      context: includedContext?.type,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIncludedContext(null);
    setIsLoading(true);

    try {
      const context = buildContext();
      const systemPrompt = getSystemPrompt(mode, context);
      
      const response = await fetch('/api/ai/framework/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: inputValue },
          ],
          model: selectedModel.id,
          selectedText,
          documentContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.content || data.message || 'No response received',
        timestamp: new Date(),
        model: selectedModel.name,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get system prompt based on mode
  const getSystemPrompt = (mode: CopilotMode, context: string): string => {
    const basePrompt = `You are a creative writing assistant helping an author with their story.`;
    
    switch (mode) {
      case 'discuss':
        return `${basePrompt} Engage in helpful discussion about their work. Ask clarifying questions, offer suggestions, and help them think through problems. Be conversational but focused on craft.\n\nContext:\n${context}`;
      case 'ghostwrite':
        return `${basePrompt} Write prose that matches the author's style. When asked to write, produce polished, publication-ready text. Match the tone and voice of any provided context. Output ONLY the prose - no explanations or meta-commentary.\n\nContext:\n${context}`;
      case 'framework':
        return `${basePrompt} Help build and refine their story framework - characters, plot, themes, world-building. Provide structured, actionable suggestions for story development.\n\nContext:\n${context}`;
      case 'agents':
        return `${basePrompt} You are acting as a specialist agent. Provide detailed analysis and specific, actionable feedback.\n\nContext:\n${context}`;
      default:
        return `${basePrompt}\n\nContext:\n${context}`;
    }
  };

  // Insert AI response into editor
  const handleInsertResponse = (content: string) => {
    if (mode === 'ghostwrite' && onInsertText) {
      onInsertText(content);
    }
  };

  // Replace selection with AI response
  const handleReplaceWithResponse = (content: string) => {
    if (onReplaceSelection) {
      onReplaceSelection(content);
    }
  };

  return (
    <div className={cn('interactive-session', className)}>
      {/* Header toolbar with mode tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[--vsc-panel-border] bg-[--vsc-sideBar-background]">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
              mode === m.id
                ? 'bg-[--vsc-button-bg] text-[--vsc-button-fg]'
                : 'text-[--vsc-foreground] opacity-70 hover:opacity-100 hover:bg-[--vsc-list-hoverBackground]'
            )}
            title={m.description}
          >
            {m.icon}
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        ))}
        
        {/* Framework Wizard button */}
        {!hasFramework && onLaunchFrameworkWizard && (
          <button
            onClick={onLaunchFrameworkWizard}
            className="ml-auto flex items-center gap-1.5 px-2 py-1 text-xs bg-[--vsc-button-bg] text-[--vsc-button-fg] rounded hover:bg-[--vsc-button-hoverBackground] transition-colors"
            title="Launch Framework Wizard"
          >
            <Wand2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Chat Welcome View Container - VS Code pattern */}
      {messages.length === 0 ? (
        <div className="chat-welcome-view-container">
          <div className="chat-welcome-view">
            <div className="chat-welcome-view-icon">
              <Sparkles className="w-10 h-10 text-[--vsc-textLink-foreground] opacity-80" />
            </div>
            <h2 className="chat-welcome-view-title">
              {mode === 'discuss' && 'Ask Copilot'}
              {mode === 'ghostwrite' && 'Ghostwrite'}
              {mode === 'framework' && 'Framework Builder'}
              {mode === 'agents' && 'AI Agents'}
            </h2>
            <p className="chat-welcome-view-message">
              {mode === 'discuss' && 'Ask questions about your story, characters, or writing.'}
              {mode === 'ghostwrite' && 'Describe what you want me to write for you.'}
              {mode === 'framework' && 'Build your story structure step by step.'}
              {mode === 'agents' && 'Run specialized agents for analysis.'}
            </p>
            {!hasFramework && onLaunchFrameworkWizard && (
              <button
                onClick={onLaunchFrameworkWizard}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-[--vsc-button-bg] text-[--vsc-button-fg] rounded text-sm font-medium hover:bg-[--vsc-button-hoverBackground] transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                Start Framework Wizard
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="interactive-list">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onInsert={mode === 'ghostwrite' ? handleInsertResponse : undefined}
              onReplace={selectedText ? handleReplaceWithResponse : undefined}
            />
          ))}
          {isLoading && (
            <div className="interactive-item-container">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Interactive Input Part */}
      <div className="interactive-input-part">
        {/* Model selector */}
        <div className="px-4 py-2">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
        
        {/* Included context pill */}
        {includedContext && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-[--vsc-badge-background] text-[--vsc-badge-foreground] w-fit">
              <AtSign className="w-3 h-3" />
              <span>{includedContext.label}</span>
              <button onClick={() => setIncludedContext(null)} className="ml-1 opacity-70 hover:opacity-100">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
        
        {/* Context menu */}
        {showContextMenu && (
          <div
            ref={contextMenuRef}
            className="absolute bottom-full left-4 right-4 mb-2 bg-[--vsc-quickInput-background] border border-[--vsc-widget-border] rounded-lg shadow-xl overflow-hidden z-50"
          >
            <div className="p-2 border-b border-[--vsc-widget-border]">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">Include Context</p>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {selectedText && (
                <button
                  onClick={() => {
                    setIncludedContext({ type: 'selection', label: 'Selection', content: selectedText });
                    setShowContextMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[--vsc-list-hoverBackground] text-left"
                >
                  <FileText className="w-4 h-4" />
                  <div className="flex-1">
                    <div className="text-sm">Selection</div>
                    <div className="text-xs opacity-60 truncate">{selectedText.slice(0, 50)}...</div>
                  </div>
                </button>
              )}
              {documentContent && (
                <button
                  onClick={() => {
                    setIncludedContext({ type: 'document', label: 'Document', content: documentContent });
                    setShowContextMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[--vsc-list-hoverBackground] text-left"
                >
                  <FileText className="w-4 h-4" />
                  <div className="flex-1">
                    <div className="text-sm">Document</div>
                    <div className="text-xs opacity-60">{chapterTitle || 'Current document'}</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Chat Input Container */}
        <div className="chat-input-container">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'discuss' ? 'Ask about your story...' :
              mode === 'ghostwrite' ? 'Describe what you want written...' :
              mode === 'framework' ? 'Build your story framework...' :
              'Select an agent to run...'
            }
            className="interactive-input-editor w-full px-3 py-2 text-sm resize-none"
            rows={3}
          />
          <div className="flex items-center justify-between px-3 py-2 border-t border-[--vsc-input-border]">
            <span className="text-[10px] opacity-60">Type @ for context</span>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                'px-3 py-1 rounded text-xs font-medium transition-colors',
                inputValue.trim() && !isLoading
                  ? 'bg-[--vsc-button-bg] text-[--vsc-button-fg] hover:bg-[--vsc-button-hoverBackground]'
                  : 'opacity-50 cursor-not-allowed'
              )}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Message bubble component
interface MessageBubbleProps {
  message: Message;
  onInsert?: (content: string) => void;
  onReplace?: (content: string) => void;
}

function MessageBubble({ message, onInsert, onReplace }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';
  
  return (
    <div className={cn('interactive-item-container', isUser ? 'interactive-request' : 'interactive-response')}>
      <div className="header">
        <div className="avatar-container">
          <div className="avatar">
            {isUser ? <User className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
          </div>
        </div>
        <span className="username">{isUser ? 'You' : message.model || 'Copilot'}</span>
        {message.context && (
          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-[--vsc-badge-background] text-[--vsc-badge-foreground]">
            @{message.context}
          </span>
        )}
      </div>
      <div className="value">
        <p className={cn('whitespace-pre-wrap text-sm', message.isError && 'text-[--vsc-errorForeground]')}>
          {message.content}
        </p>
      </div>
      {!isUser && !message.isError && (
        <div className="chat-footer-toolbar">
          <button onClick={handleCopy} className="p-1 rounded hover:bg-[--vsc-toolbar-hoverBackground]" title="Copy">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {onInsert && (
            <button onClick={() => onInsert(message.content)} className="p-1 rounded hover:bg-[--vsc-toolbar-hoverBackground]" title="Insert">
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          {onReplace && (
            <button onClick={() => onReplace(message.content)} className="p-1 rounded hover:bg-[--vsc-toolbar-hoverBackground]" title="Replace">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default AICopilotPanel;
