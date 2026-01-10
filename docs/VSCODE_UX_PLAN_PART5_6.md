# Part 5: AI Chat Panel (Right Panel) + Part 6: Command System

> **Purpose**: Create a VS Code Copilot-style AI assistant panel and comprehensive command palette system.

---

## 5.1 AI Chat Panel Overview

The right panel serves as the primary AI interaction surface - similar to GitHub Copilot Chat in VS Code. It provides:

- Conversational AI assistance
- Context-aware suggestions
- Writing style coaching
- Plot/character development help
- Ghost-writing capabilities

```
┌─────────────────────────────────────┐
│ 🤖 Ghost Writer            [⚙️] [×] │
├─────────────────────────────────────┤
│ 📌 Context: Chapter 3, Scene 2      │
│    Characters: Alice, Bob           │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ You: Help me write a tense      │ │
│ │ dialogue between Alice and Bob  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 Here's a tense exchange:     │ │
│ │                                 │ │
│ │ "I know what you did," Alice    │ │
│ │ said, her voice barely above    │ │
│ │ a whisper...                    │ │
│ │                                 │ │
│ │ [Insert] [Copy] [Regenerate]    │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ Quick Actions:                      │
│ [Continue] [Rephrase] [Expand]      │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Ask the Ghost Writer...     [⏎] │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 5.2 AI Chat Panel Component

```typescript
// src/components/IDE/RightPanel/AIChatPanel.tsx

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import {
  Bot,
  Settings,
  X,
  Send,
  Copy,
  Check,
  RefreshCw,
  FileInput,
  Sparkles,
  Wand2,
  MessageSquare,
  Lightbulb,
  PenTool,
  Zap,
} from 'lucide-react';
import { ChatMessage, ChatContext } from './types';
import { MessageBubble } from './components/MessageBubble';
import { ContextBar } from './components/ContextBar';
import { QuickActions } from './components/QuickActions';
import { useChatHistory } from './hooks/useChatHistory';
import { useAIChat } from './hooks/useAIChat';
import { useEditorContext } from '@/components/BlockEditor/context/UnifiedEditorContext';

interface AIChatPanelProps {
  className?: string;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  className,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { manuscriptEditor, frameworkEditor, activeEditor } = useEditorContext();
  
  // Chat history and state
  const {
    messages,
    addMessage,
    updateMessage,
    clearHistory,
  } = useChatHistory();
  
  // AI chat functionality
  const {
    sendMessage,
    isGenerating,
    currentContext,
    updateContext,
    cancelGeneration,
  } = useAIChat({
    manuscriptEditor,
    frameworkEditor,
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-update context based on cursor position
  useEffect(() => {
    if (!activeEditor) return;
    
    const handleSelectionUpdate = () => {
      updateContext(activeEditor);
    };
    
    activeEditor.on('selectionUpdate', handleSelectionUpdate);
    return () => {
      activeEditor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [activeEditor, updateContext]);

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isGenerating) return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      context: currentContext,
    };
    
    addMessage(userMessage);
    setInputValue('');
    
    // Generate AI response
    const aiMessageId = `ai-${Date.now()}`;
    addMessage({
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isGenerating: true,
    });
    
    try {
      await sendMessage(userMessage.content, (chunk) => {
        updateMessage(aiMessageId, (prev) => ({
          ...prev,
          content: prev.content + chunk,
        }));
      });
      
      updateMessage(aiMessageId, (prev) => ({
        ...prev,
        isGenerating: false,
      }));
    } catch (error) {
      updateMessage(aiMessageId, (prev) => ({
        ...prev,
        content: 'Sorry, I encountered an error. Please try again.',
        isGenerating: false,
        isError: true,
      }));
    }
  }, [inputValue, isGenerating, currentContext, addMessage, sendMessage, updateMessage]);

  // Handle quick action
  const handleQuickAction = useCallback((action: string) => {
    const quickPrompts: Record<string, string> = {
      continue: 'Continue writing from where I left off, maintaining the same voice and style.',
      rephrase: 'Rephrase the selected text to be more engaging while keeping the same meaning.',
      expand: 'Expand on this section with more detail and description.',
      dialogue: 'Help me write dialogue for this scene.',
      describe: 'Add sensory description to this passage.',
      conflict: 'Suggest ways to increase tension or conflict in this scene.',
    };
    
    const prompt = quickPrompts[action];
    if (prompt) {
      setInputValue(prompt);
      inputRef.current?.focus();
    }
  }, []);

  // Handle insert into editor
  const handleInsert = useCallback((content: string) => {
    if (!activeEditor) return;
    
    activeEditor.chain()
      .focus()
      .insertContent(content)
      .run();
  }, [activeEditor]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className={cn(
      'ai-chat-panel flex flex-col h-full',
      'bg-[--ide-sidebar-bg] text-[--ide-foreground]',
      className
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-3 py-2',
        'border-b border-[--ide-border]'
      )}>
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[--ide-activitybar-badge]" />
          <span className="font-medium text-sm">Ghost Writer</span>
          {isGenerating && (
            <span className="flex items-center gap-1 text-xs text-[--ide-info]">
              <Sparkles className="w-3 h-3 animate-pulse" />
              Writing...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearHistory}
            className={cn(
              'p-1.5 rounded',
              'text-[--ide-activitybar-inactive] hover:text-[--ide-foreground]',
              'hover:bg-[--ide-list-hover-bg] transition-colors'
            )}
            title="Clear chat"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            className={cn(
              'p-1.5 rounded',
              'text-[--ide-activitybar-inactive] hover:text-[--ide-foreground]',
              'hover:bg-[--ide-list-hover-bg] transition-colors'
            )}
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* Context Bar */}
      <ContextBar context={currentContext} />
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.length === 0 ? (
          <WelcomeMessage onQuickAction={handleQuickAction} />
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onInsert={handleInsert}
              onRegenerate={() => {/* TODO: Implement regenerate */}}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick Actions */}
      <QuickActions
        onAction={handleQuickAction}
        disabled={isGenerating}
      />
      
      {/* Input Area */}
      <div className={cn(
        'border-t border-[--ide-border] p-3'
      )}>
        <div className={cn(
          'flex items-end gap-2 rounded-lg',
          'bg-[--ide-input-bg] border border-[--ide-input-border]',
          'focus-within:border-[--ide-input-focus-border]'
        )}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the Ghost Writer..."
            className={cn(
              'flex-1 bg-transparent px-3 py-2 text-sm resize-none',
              'text-[--ide-input-fg] placeholder:text-[--ide-activitybar-inactive]',
              'focus:outline-none',
              'min-h-[40px] max-h-[120px]'
            )}
            rows={1}
            disabled={isGenerating}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isGenerating}
            className={cn(
              'p-2 m-1 rounded',
              'bg-[--ide-activitybar-badge] text-white',
              'hover:opacity-90 transition-opacity',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* Keyboard hint */}
        <p className="text-[10px] text-[--ide-activitybar-inactive] mt-1 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

// Welcome message component
const WelcomeMessage: React.FC<{ onQuickAction: (action: string) => void }> = ({
  onQuickAction,
}) => (
  <div className="flex flex-col items-center text-center p-4">
    <Bot className="w-12 h-12 text-[--ide-activitybar-badge] mb-3" />
    <h3 className="text-sm font-medium text-[--ide-foreground] mb-1">
      Ghost Writer
    </h3>
    <p className="text-xs text-[--ide-activitybar-inactive] mb-4">
      Your AI writing assistant. Ask me to help with dialogue,
      descriptions, plot development, or continue your story.
    </p>
    
    <div className="grid grid-cols-2 gap-2 w-full">
      {[
        { id: 'continue', label: 'Continue Story', icon: PenTool },
        { id: 'dialogue', label: 'Write Dialogue', icon: MessageSquare },
        { id: 'describe', label: 'Add Description', icon: Lightbulb },
        { id: 'conflict', label: 'Add Tension', icon: Zap },
      ].map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => onQuickAction(action.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded text-xs',
              'bg-[--ide-input-bg] border border-[--ide-border]',
              'hover:bg-[--ide-list-hover-bg] transition-colors',
              'text-[--ide-foreground]'
            )}
          >
            <Icon className="w-3.5 h-3.5 text-[--ide-activitybar-badge]" />
            {action.label}
          </button>
        );
      })}
    </div>
  </div>
);
```

---

## 5.3 Message Bubble Component

```typescript
// src/components/IDE/RightPanel/components/MessageBubble.tsx

'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  User,
  Bot,
  Copy,
  Check,
  FileInput,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  onInsert: (content: string) => void;
  onRegenerate: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onInsert,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const isUser = message.role === 'user';
  const Icon = isUser ? User : Bot;
  
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);
  
  const handleInsert = useCallback(() => {
    onInsert(message.content);
  }, [message.content, onInsert]);
  
  // Extract code blocks for special rendering
  const renderContent = (content: string) => {
    // Simple markdown-like rendering
    const parts = content.split(/(```[\s\S]*?```|"[^"]+"|'[^']+')/g);
    
    return parts.map((part, index) => {
      // Code block
      if (part.startsWith('```')) {
        const code = part.replace(/```\w*\n?/g, '').trim();
        return (
          <pre
            key={index}
            className={cn(
              'my-2 p-2 rounded text-xs overflow-x-auto',
              'bg-[--ide-input-bg] border border-[--ide-border]'
            )}
          >
            <code>{code}</code>
          </pre>
        );
      }
      
      // Dialogue (quoted text)
      if ((part.startsWith('"') && part.endsWith('"')) || 
          (part.startsWith("'") && part.endsWith("'"))) {
        return (
          <span key={index} className="text-[--ide-info]">
            {part}
          </span>
        );
      }
      
      // Regular text
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={cn(
      'message-bubble group',
      isUser ? 'flex justify-end' : 'flex justify-start'
    )}>
      <div className={cn(
        'flex gap-2 max-w-[90%]',
        isUser && 'flex-row-reverse'
      )}>
        {/* Avatar */}
        <div className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
          isUser 
            ? 'bg-[--ide-activitybar-badge]' 
            : 'bg-[--ide-input-bg] border border-[--ide-border]'
        )}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        
        {/* Message Content */}
        <div className={cn(
          'rounded-lg px-3 py-2',
          isUser
            ? 'bg-[--ide-activitybar-badge] text-white'
            : 'bg-[--ide-input-bg] border border-[--ide-border]',
          message.isError && 'border-[--ide-error]'
        )}>
          {/* Context indicator */}
          {message.context && !isUser && (
            <div className={cn(
              'text-[10px] mb-1 pb-1 border-b',
              'text-[--ide-activitybar-inactive] border-[--ide-border]'
            )}>
              Context: {message.context.chapter} {message.context.scene && `> ${message.context.scene}`}
            </div>
          )}
          
          {/* Message text */}
          <div className={cn(
            'text-sm whitespace-pre-wrap',
            message.isGenerating && 'animate-pulse'
          )}>
            {message.isGenerating && !message.content ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Thinking...
              </span>
            ) : (
              renderContent(message.content)
            )}
          </div>
          
          {/* Timestamp */}
          <div className={cn(
            'text-[10px] mt-1 opacity-50',
            isUser ? 'text-white' : 'text-[--ide-activitybar-inactive]'
          )}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
          
          {/* Actions (for AI messages) */}
          {!isUser && !message.isGenerating && (
            <div className={cn(
              'flex items-center gap-1 mt-2 pt-2 border-t border-[--ide-border]',
              'opacity-0 group-hover:opacity-100 transition-opacity'
            )}>
              <button
                onClick={handleCopy}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 text-[10px] rounded',
                  'hover:bg-[--ide-list-hover-bg] transition-colors'
                )}
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-[--ide-success]" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              
              <button
                onClick={handleInsert}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 text-[10px] rounded',
                  'bg-[--ide-activitybar-badge] text-white',
                  'hover:opacity-90 transition-opacity'
                )}
                title="Insert into editor"
              >
                <FileInput className="w-3 h-3" />
                Insert
              </button>
              
              <button
                onClick={onRegenerate}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 text-[10px] rounded',
                  'hover:bg-[--ide-list-hover-bg] transition-colors'
                )}
                title="Regenerate response"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

## 5.4 Chat Types and Hooks

```typescript
// src/components/IDE/RightPanel/types.ts

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: ChatContext;
  isGenerating?: boolean;
  isError?: boolean;
}

export interface ChatContext {
  chapter?: string;
  scene?: string;
  characters?: string[];
  selectedText?: string;
  cursorPosition?: number;
  wordCount?: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
}
```

```typescript
// src/components/IDE/RightPanel/hooks/useAIChat.ts

import { useState, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { ChatContext } from '../types';
import { useAI } from '@/hooks/useAI';

interface UseAIChatConfig {
  manuscriptEditor: Editor | null;
  frameworkEditor: Editor | null;
}

interface UseAIChatReturn {
  sendMessage: (message: string, onChunk: (chunk: string) => void) => Promise<void>;
  isGenerating: boolean;
  currentContext: ChatContext;
  updateContext: (editor: Editor) => void;
  cancelGeneration: () => void;
}

export const useAIChat = ({
  manuscriptEditor,
  frameworkEditor,
}: UseAIChatConfig): UseAIChatReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentContext, setCurrentContext] = useState<ChatContext>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { generateTextStream } = useAI({ provider: 'gemini' });

  // Update context from editor state
  const updateContext = useCallback((editor: Editor) => {
    if (!editor) return;
    
    const { selection, doc } = editor.state;
    const { $from, $to } = selection;
    const selectedText = doc.textBetween($from.pos, $to.pos);
    
    // Find current chapter/scene
    let chapter = '';
    let scene = '';
    
    doc.descendants((node, pos) => {
      if (pos > $from.pos) return false;
      
      if (node.type.name === 'heading') {
        if (node.attrs.level === 2) {
          chapter = node.textContent || 'Untitled Chapter';
        } else if (node.attrs.level === 3) {
          scene = node.textContent || 'Untitled Scene';
        }
      }
    });
    
    // Extract character names from framework
    const characters: string[] = [];
    if (frameworkEditor) {
      const frameworkText = frameworkEditor.getText();
      const nameMatches = frameworkText.match(/Character:\s*([^\n]+)/gi);
      if (nameMatches) {
        nameMatches.forEach(match => {
          const name = match.replace(/Character:\s*/i, '').trim();
          characters.push(name);
        });
      }
    }
    
    setCurrentContext({
      chapter,
      scene,
      characters,
      selectedText: selectedText.slice(0, 500), // Limit selected text
      cursorPosition: $from.pos,
      wordCount: doc.textContent.split(/\s+/).length,
    });
  }, [frameworkEditor]);

  // Build system prompt with context
  const buildSystemPrompt = useCallback((context: ChatContext): string => {
    let prompt = `You are Ghost Writer, an expert fiction writing assistant. You help authors with their creative writing.

Your capabilities:
- Continue stories in the author's voice and style
- Write dialogue that feels natural and character-appropriate
- Add sensory descriptions and atmospheric details
- Develop plot points and resolve story issues
- Maintain consistency with established characters and world-building

Guidelines:
- Write in the same tense and POV as the existing text
- Keep character voices distinct and consistent
- Show don't tell - use action and dialogue over exposition
- Match the tone and genre of the work
`;

    if (context.chapter) {
      prompt += `\nCurrent location: ${context.chapter}`;
      if (context.scene) {
        prompt += ` > ${context.scene}`;
      }
    }
    
    if (context.characters && context.characters.length > 0) {
      prompt += `\nEstablished characters: ${context.characters.join(', ')}`;
    }
    
    if (context.selectedText) {
      prompt += `\n\nSelected text for reference:\n"${context.selectedText}"`;
    }
    
    return prompt;
  }, []);

  // Send message and stream response
  const sendMessage = useCallback(async (
    message: string,
    onChunk: (chunk: string) => void
  ) => {
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();
    
    try {
      const systemPrompt = buildSystemPrompt(currentContext);
      
      // Get surrounding context from manuscript
      let manuscriptContext = '';
      if (manuscriptEditor) {
        const doc = manuscriptEditor.state.doc;
        const pos = currentContext.cursorPosition || 0;
        
        // Get ~500 chars before and after cursor
        const textBefore = doc.textBetween(Math.max(0, pos - 500), pos);
        const textAfter = doc.textBetween(pos, Math.min(doc.nodeSize - 2, pos + 500));
        
        manuscriptContext = `\n\n--- Recent manuscript context ---\n...${textBefore}\n[CURSOR]\n${textAfter}...`;
      }
      
      const fullPrompt = `${systemPrompt}${manuscriptContext}\n\nUser request: ${message}`;
      
      await generateTextStream(fullPrompt, {
        maxTokens: 1500,
        temperature: 0.7,
        onChunk,
        signal: abortControllerRef.current.signal,
      });
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [currentContext, manuscriptEditor, buildSystemPrompt, generateTextStream]);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  }, []);

  return {
    sendMessage,
    isGenerating,
    currentContext,
    updateContext,
    cancelGeneration,
  };
};
```

---

# Part 6: Command System & Shortcuts

## 6.1 Command Palette Overview

The Command Palette is the keyboard-driven power user interface - press `Cmd+Shift+P` (or `Cmd+K`) to access all commands.

```
┌─────────────────────────────────────────────────────────────┐
│ > Format selection                                      [×] │
├─────────────────────────────────────────────────────────────┤
│ 📝 Format: Bold                              Cmd+B          │
│ 📝 Format: Italic                            Cmd+I          │
│ 📝 Format: Underline                         Cmd+U          │
│ ─────────────────────────────────────────────────────────── │
│ 🤖 AI: Continue Writing                      Cmd+Shift+C    │
│ 🤖 AI: Rephrase Selection                    Cmd+Shift+R    │
│ 🤖 AI: Analyze Selection                     Cmd+Shift+A    │
│ ─────────────────────────────────────────────────────────── │
│ 📖 Navigate: Go to Chapter...                Cmd+G          │
│ 📖 Navigate: Go to Scene...                  Cmd+Shift+G    │
│ 👤 Character: Insert Reference               Cmd+Shift+@    │
└─────────────────────────────────────────────────────────────┘
```

---

## 6.2 Command Registry

```typescript
// src/components/IDE/CommandPalette/CommandRegistry.ts

export interface Command {
  id: string;
  label: string;
  category: 'editor' | 'ai' | 'navigation' | 'character' | 'view' | 'file';
  icon?: string;
  shortcut?: string;
  keywords?: string[]; // For fuzzy search
  execute: (context: CommandContext) => void | Promise<void>;
  isEnabled?: (context: CommandContext) => boolean;
  isVisible?: (context: CommandContext) => boolean;
}

export interface CommandContext {
  manuscriptEditor: Editor | null;
  frameworkEditor: Editor | null;
  activeEditor: Editor | null;
  selection: string;
  cursorPosition: number;
  currentChapter: string | null;
  currentScene: string | null;
}

class CommandRegistryImpl {
  private commands: Map<string, Command> = new Map();
  private listeners: Set<() => void> = new Set();

  register(command: Command): void {
    this.commands.set(command.id, command);
    this.notifyListeners();
  }

  unregister(id: string): void {
    this.commands.delete(id);
    this.notifyListeners();
  }

  get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  getByCategory(category: string): Command[] {
    return this.getAll().filter(cmd => cmd.category === category);
  }

  search(query: string, context: CommandContext): Command[] {
    const lowerQuery = query.toLowerCase();
    
    return this.getAll()
      .filter(cmd => {
        // Check visibility
        if (cmd.isVisible && !cmd.isVisible(context)) return false;
        
        // Match against label, id, keywords
        const searchTargets = [
          cmd.label.toLowerCase(),
          cmd.id.toLowerCase(),
          ...(cmd.keywords || []).map(k => k.toLowerCase()),
        ];
        
        return searchTargets.some(target => target.includes(lowerQuery));
      })
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.label.toLowerCase().startsWith(lowerQuery);
        const bExact = b.label.toLowerCase().startsWith(lowerQuery);
        if (aExact && !bExact) return -1;
        if (bExact && !aExact) return 1;
        return a.label.localeCompare(b.label);
      });
  }

  execute(id: string, context: CommandContext): void {
    const command = this.get(id);
    if (command) {
      if (command.isEnabled && !command.isEnabled(context)) {
        console.warn(`Command ${id} is not enabled in current context`);
        return;
      }
      command.execute(context);
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const commandRegistry = new CommandRegistryImpl();
```

---

## 6.3 Default Commands

```typescript
// src/components/IDE/CommandPalette/commands/editorCommands.ts

import { Command } from '../CommandRegistry';

export const editorCommands: Command[] = [
  // Formatting
  {
    id: 'editor.bold',
    label: 'Format: Bold',
    category: 'editor',
    icon: '📝',
    shortcut: 'Cmd+B',
    keywords: ['bold', 'strong', 'format'],
    execute: ({ activeEditor }) => {
      activeEditor?.chain().focus().toggleBold().run();
    },
    isEnabled: ({ activeEditor }) => !!activeEditor,
  },
  {
    id: 'editor.italic',
    label: 'Format: Italic',
    category: 'editor',
    icon: '📝',
    shortcut: 'Cmd+I',
    keywords: ['italic', 'emphasis', 'format'],
    execute: ({ activeEditor }) => {
      activeEditor?.chain().focus().toggleItalic().run();
    },
    isEnabled: ({ activeEditor }) => !!activeEditor,
  },
  {
    id: 'editor.heading2',
    label: 'Format: Chapter Heading',
    category: 'editor',
    icon: '📝',
    shortcut: 'Cmd+2',
    keywords: ['heading', 'chapter', 'h2'],
    execute: ({ activeEditor }) => {
      activeEditor?.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    id: 'editor.heading3',
    label: 'Format: Scene Heading',
    category: 'editor',
    icon: '📝',
    shortcut: 'Cmd+3',
    keywords: ['heading', 'scene', 'h3'],
    execute: ({ activeEditor }) => {
      activeEditor?.chain().focus().toggleHeading({ level: 3 }).run();
    },
  },
  
  // Selection
  {
    id: 'editor.selectAll',
    label: 'Select All',
    category: 'editor',
    shortcut: 'Cmd+A',
    execute: ({ activeEditor }) => {
      activeEditor?.chain().focus().selectAll().run();
    },
  },
  {
    id: 'editor.selectParagraph',
    label: 'Select Current Paragraph',
    category: 'editor',
    shortcut: 'Cmd+L',
    execute: ({ activeEditor }) => {
      if (!activeEditor) return;
      const { $from } = activeEditor.state.selection;
      const start = $from.start();
      const end = $from.end();
      activeEditor.commands.setTextSelection({ from: start, to: end });
    },
  },
  
  // Navigation
  {
    id: 'editor.goToLine',
    label: 'Go to Line...',
    category: 'navigation',
    shortcut: 'Cmd+G',
    execute: () => {
      // Show line number input dialog
      window.dispatchEvent(new CustomEvent('sw:show-goto-line'));
    },
  },
];
```

```typescript
// src/components/IDE/CommandPalette/commands/aiCommands.ts

import { Command } from '../CommandRegistry';

export const aiCommands: Command[] = [
  {
    id: 'ai.continue',
    label: 'AI: Continue Writing',
    category: 'ai',
    icon: '🤖',
    shortcut: 'Cmd+Shift+C',
    keywords: ['continue', 'write', 'generate', 'ghost'],
    execute: () => {
      window.dispatchEvent(new CustomEvent('sw:ai-continue'));
    },
  },
  {
    id: 'ai.rephrase',
    label: 'AI: Rephrase Selection',
    category: 'ai',
    icon: '🤖',
    shortcut: 'Cmd+Shift+R',
    keywords: ['rephrase', 'rewrite', 'improve'],
    execute: ({ selection }) => {
      if (!selection) {
        alert('Please select text to rephrase');
        return;
      }
      window.dispatchEvent(new CustomEvent('sw:ai-rephrase', { 
        detail: { text: selection } 
      }));
    },
    isEnabled: ({ selection }) => !!selection,
  },
  {
    id: 'ai.expand',
    label: 'AI: Expand Selection',
    category: 'ai',
    icon: '🤖',
    shortcut: 'Cmd+Shift+E',
    keywords: ['expand', 'elaborate', 'detail'],
    execute: ({ selection }) => {
      window.dispatchEvent(new CustomEvent('sw:ai-expand', { 
        detail: { text: selection } 
      }));
    },
  },
  {
    id: 'ai.analyze',
    label: 'AI: Analyze Writing',
    category: 'ai',
    icon: '🤖',
    shortcut: 'Cmd+Shift+A',
    keywords: ['analyze', 'feedback', 'critique'],
    execute: () => {
      window.dispatchEvent(new CustomEvent('sw:analyze-writing'));
    },
  },
  {
    id: 'ai.dialogue',
    label: 'AI: Generate Dialogue',
    category: 'ai',
    icon: '🤖',
    keywords: ['dialogue', 'conversation', 'talk'],
    execute: () => {
      window.dispatchEvent(new CustomEvent('sw:ai-dialogue'));
    },
  },
  {
    id: 'ai.describe',
    label: 'AI: Add Description',
    category: 'ai',
    icon: '🤖',
    keywords: ['describe', 'description', 'sensory'],
    execute: () => {
      window.dispatchEvent(new CustomEvent('sw:ai-describe'));
    },
  },
  {
    id: 'ai.openChat',
    label: 'AI: Open Ghost Writer Chat',
    category: 'ai',
    icon: '🤖',
    shortcut: 'Cmd+Shift+G',
    keywords: ['chat', 'ghost', 'assistant'],
    execute: () => {
      window.dispatchEvent(new CustomEvent('sw:toggle-ai-chat'));
    },
  },
];
```

```typescript
// src/components/IDE/CommandPalette/commands/navigationCommands.ts

import { Command } from '../CommandRegistry';

export const navigationCommands: Command[] = [
  {
    id: 'nav.goToChapter',
    label: 'Go to Chapter...',
    category: 'navigation',
    icon: '📖',
    shortcut: 'Cmd+P',
    keywords: ['chapter', 'jump', 'navigate'],
    execute: () => {
      window.dispatchEvent(new CustomEvent('sw:show-chapter-picker'));
    },
  },
  {
    id: 'nav.goToScene',
    label: 'Go to Scene...',
    category: 'navigation',
    icon: '📖',
    shortcut: 'Cmd+Shift+P',
    keywords: ['scene', 'jump', 'navigate'],
    execute: () => {
      window.dispatchEvent(new CustomEvent('sw:show-scene-picker'));
    },
  },
  {
    id: 'nav.goToCharacter',
    label: 'Go to Character...',
    category: 'navigation',
    icon: '👤',
    shortcut: 'Cmd+Shift+@',
    keywords: ['character', 'person', 'profile'],
    execute: () => {
      window.dispatchEvent(new CustomEvent('sw:show-character-picker'));
    },
  },
  {
    id: 'nav.nextChapter',
    label: 'Navigate: Next Chapter',
    category: 'navigation',
    shortcut: 'Cmd+]',
    execute: () => {
      window.dispatchEvent(new CustomEvent('sw:nav-next-chapter'));
    },
  },
  {
    id: 'nav.prevChapter',
    label: 'Navigate: Previous Chapter',
    category: 'navigation',
    shortcut: 'Cmd+[',
    execute: () => {
      window.dispatchEvent(new CustomEvent('sw:nav-prev-chapter'));
    },
  },
  {
    id: 'nav.toggleExplorer',
    label: 'View: Toggle Story Explorer',
    category: 'view',
    shortcut: 'Cmd+B',
    execute: () => {
      window.dispatchEvent(new CustomEvent('sw:toggle-explorer'));
    },
  },
  {
    id: 'nav.toggleProblems',
    label: 'View: Toggle Problems Panel',
    category: 'view',
    shortcut: 'Cmd+Shift+M',
    execute: () => {
      window.dispatchEvent(new CustomEvent('sw:toggle-problems'));
    },
  },
];
```

---

## 6.4 Command Palette Component

```typescript
// src/components/IDE/CommandPalette/CommandPalette.tsx

'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Search, Command as CommandIcon } from 'lucide-react';
import { commandRegistry, Command, CommandContext } from './CommandRegistry';
import { useEditorContext } from '@/components/BlockEditor/context/UnifiedEditorContext';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  const { manuscriptEditor, frameworkEditor, activeEditor } = useEditorContext();

  // Build command context
  const context: CommandContext = useMemo(() => {
    const selection = activeEditor 
      ? activeEditor.state.doc.textBetween(
          activeEditor.state.selection.$from.pos,
          activeEditor.state.selection.$to.pos
        )
      : '';
    
    return {
      manuscriptEditor,
      frameworkEditor,
      activeEditor,
      selection,
      cursorPosition: activeEditor?.state.selection.$from.pos || 0,
      currentChapter: null, // Would extract from editor
      currentScene: null,
    };
  }, [manuscriptEditor, frameworkEditor, activeEditor]);

  // Get filtered commands
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return commandRegistry.getAll().filter(cmd => 
        !cmd.isVisible || cmd.isVisible(context)
      );
    }
    return commandRegistry.search(query, context);
  }, [query, context]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    
    return groups;
  }, [filteredCommands]);

  // Keyboard shortcut to open palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Shift+P or Cmd+K
      if ((e.metaKey || e.ctrlKey) && (
        (e.shiftKey && e.key === 'p') || 
        e.key === 'k'
      )) {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const flatCommands = filteredCommands;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, flatCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          executeCommand(flatCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  }, [filteredCommands, selectedIndex]);

  // Execute command
  const executeCommand = useCallback((command: Command) => {
    setIsOpen(false);
    commandRegistry.execute(command.id, context);
  }, [context]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Palette */}
      <div className={cn(
        'fixed top-[20%] left-1/2 -translate-x-1/2 z-50',
        'w-[600px] max-w-[90vw] max-h-[60vh]',
        'bg-[--ide-sidebar-bg] border border-[--ide-border]',
        'rounded-lg shadow-2xl overflow-hidden',
        'flex flex-col'
      )}>
        {/* Search Input */}
        <div className={cn(
          'flex items-center gap-2 px-4 py-3',
          'border-b border-[--ide-border]'
        )}>
          <Search className="w-4 h-4 text-[--ide-activitybar-inactive]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className={cn(
              'flex-1 bg-transparent text-sm',
              'text-[--ide-foreground] placeholder:text-[--ide-activitybar-inactive]',
              'focus:outline-none'
            )}
          />
          <kbd className="px-2 py-0.5 text-xs bg-[--ide-input-bg] rounded">
            esc
          </kbd>
        </div>
        
        {/* Commands List */}
        <div 
          ref={listRef}
          className="flex-1 overflow-y-auto py-2"
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[--ide-activitybar-inactive]">
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category}>
                {/* Category Header */}
                <div className={cn(
                  'px-4 py-1 text-[10px] font-medium uppercase',
                  'text-[--ide-activitybar-inactive]'
                )}>
                  {category}
                </div>
                
                {/* Commands */}
                {commands.map((command) => {
                  const globalIndex = filteredCommands.indexOf(command);
                  const isSelected = globalIndex === selectedIndex;
                  const isEnabled = !command.isEnabled || command.isEnabled(context);
                  
                  return (
                    <button
                      key={command.id}
                      data-index={globalIndex}
                      onClick={() => isEnabled && executeCommand(command)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2 text-left',
                        'transition-colors',
                        isSelected && 'bg-[--ide-list-active-bg]',
                        !isSelected && 'hover:bg-[--ide-list-hover-bg]',
                        !isEnabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {/* Icon */}
                      <span className="text-sm">{command.icon || '▸'}</span>
                      
                      {/* Label */}
                      <span className={cn(
                        'flex-1 text-sm',
                        isSelected ? 'text-[--ide-foreground]' : 'text-[--ide-sidebar-fg]'
                      )}>
                        {command.label}
                      </span>
                      
                      {/* Shortcut */}
                      {command.shortcut && (
                        <kbd className={cn(
                          'px-1.5 py-0.5 text-[10px] rounded',
                          'bg-[--ide-input-bg] text-[--ide-activitybar-inactive]'
                        )}>
                          {command.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        
        {/* Footer hint */}
        <div className={cn(
          'px-4 py-2 text-[10px] text-[--ide-activitybar-inactive]',
          'border-t border-[--ide-border] flex items-center gap-4'
        )}>
          <span>↑↓ to navigate</span>
          <span>↵ to select</span>
          <span>esc to close</span>
        </div>
      </div>
    </>
  );
};
```

---

## Part 5 & 6 Summary

### AI Chat Panel Features:
1. **Conversational Interface** - Natural chat with Ghost Writer
2. **Context Awareness** - Shows current chapter/scene/characters
3. **Streaming Responses** - Real-time generation display
4. **Quick Actions** - One-click common writing tasks
5. **Insert to Editor** - Direct content insertion
6. **Message History** - Persistent conversation

### Command System Features:
1. **Command Palette** - VS Code-style Cmd+Shift+P
2. **Categorized Commands** - Editor, AI, Navigation, View
3. **Keyboard Shortcuts** - Full shortcut support
4. **Fuzzy Search** - Find commands by keywords
5. **Context Awareness** - Commands enabled/disabled by state
6. **Extensible Registry** - Easy to add new commands

---

*Continue to Parts 7-10 for Activity Bar, Status Bar, AI Agents, Timeline, and Migration Strategy...*
