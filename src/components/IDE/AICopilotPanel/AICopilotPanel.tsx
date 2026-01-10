'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Sparkles, 
  AtSign, 
  ChevronDown,
  Copy,
  Check,
  X,
  MessageSquare,
  PenTool,
  RefreshCw,
  Pencil,
  Users,
  MapPin,
  FileText,
  Hash,
  BookOpen,
  Bot,
  Wand2,
  ListTree,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { 
  AICopilotPanelProps, 
  CopilotMode,
  Message, 
  FREE_MODELS, 
  StoryCharacter, 
  StoryLocation, 
  StoryNote,
  AgentSuggestion
} from './types';
import { cn } from '@/lib/utils';

/**
 * AICopilotPanel - AI Writing Assistant
 * 
 * Four modes:
 * 1. Framework: Build story foundation (premise, characters, world, themes)
 * 2. Discuss: Conversational AI for brainstorming and questions
 * 3. Ghostwrite: AI prose generation with inline suggestions
 * 4. Agents: Run specialist agents for review (dialogue, style, plot, etc.)
 */

// Mode configurations
const MODE_CONFIG: Record<CopilotMode, { 
  icon: React.ReactNode; 
  label: string; 
  description: string;
  color: string;
}> = {
  framework: {
    icon: <BookOpen className="w-3.5 h-3.5" />,
    label: 'Framework',
    description: 'Build your story foundation',
    color: 'text-purple-400'
  },
  discuss: {
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    label: 'Discuss',
    description: 'Chat about your writing',
    color: 'text-blue-400'
  },
  ghostwrite: {
    icon: <PenTool className="w-3.5 h-3.5" />,
    label: 'Ghostwrite',
    description: 'AI writes prose for you',
    color: 'text-green-400'
  },
  agents: {
    icon: <Bot className="w-3.5 h-3.5" />,
    label: 'Agents',
    description: 'Specialist AI review',
    color: 'text-orange-400'
  }
};

// Agent definitions for the Agents mode
const AGENTS = [
  { id: 'dialogue-master', name: 'Dialogue Master', icon: '💬', description: 'Review dialogue for naturalness' },
  { id: 'style-coach', name: 'Style Coach', icon: '📝', description: 'Analyze prose style' },
  { id: 'character-keeper', name: 'Character Keeper', icon: '👤', description: 'Check character consistency' },
  { id: 'plot-analyst', name: 'Plot Analyst', icon: '📊', description: 'Analyze plot and pacing' },
  { id: 'world-builder', name: 'World Builder', icon: '🌍', description: 'Enhance setting details' },
  { id: 'editor', name: 'Editor', icon: '✂️', description: 'Line editing for clarity' },
];

// Framework interview questions
const FRAMEWORK_TOPICS = [
  { id: 'premise', label: 'Premise & Genre', icon: '📖', question: "What's your story about? What genre?" },
  { id: 'protagonist', label: 'Protagonist', icon: '👤', question: "Tell me about your main character." },
  { id: 'antagonist', label: 'Antagonist', icon: '😈', question: "Who or what opposes your protagonist?" },
  { id: 'world', label: 'World & Setting', icon: '🌍', question: "Describe the world of your story." },
  { id: 'conflict', label: 'Central Conflict', icon: '⚔️', question: "What's the main conflict or challenge?" },
  { id: 'themes', label: 'Themes', icon: '🎭', question: "What themes do you want to explore?" },
];

// Context attachment types
type ContextType = 'selection' | 'document' | 'character' | 'location' | 'note' | 'outline';

interface AttachedItem {
  type: ContextType;
  id?: string;
  name?: string;
  content?: string;
}

// Pending edit for ghostwrite mode
interface PendingEdit {
  type: 'insert' | 'replace';
  originalText: string;
  newText: string;
  explanation?: string;
}

// Pending framework element
interface PendingFrameworkElement {
  type: 'character' | 'location' | 'note' | 'premise';
  data: Record<string, unknown>;
}

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
  chapterOutlines = [],
  currentChapterOutline,
  onCreateCharacter,
  onUpdateCharacter,
  onCreateLocation,
  onCreateNote,
  onUpdateFramework,
  onCreateOutline,
  onUpdateOutline,
  onRunAgent,
  onAcceptSuggestion,
  onRejectSuggestion,
  className = ''
}: AICopilotPanelProps) {
  // Core state
  const [mode, setMode] = useState<CopilotMode>(initialMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(FREE_MODELS[0].id);
  
  // UI state
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [attachedItems, setAttachedItems] = useState<AttachedItem[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  // Mode-specific state
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null);
  const [pendingFramework, setPendingFramework] = useState<PendingFrameworkElement | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [agentResults, setAgentResults] = useState<AgentSuggestion[]>([]);
  const [frameworkTopic, setFrameworkTopic] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingEdit, pendingFramework, agentResults]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Clear mode-specific state when switching modes
  useEffect(() => {
    setPendingEdit(null);
    setPendingFramework(null);
    setAgentResults([]);
    setFrameworkTopic(null);
  }, [mode]);

  const currentModel = FREE_MODELS.find(m => m.id === selectedModel);

  // Build context string from attached items
  const buildContext = useCallback(() => {
    let context = '';
    for (const item of attachedItems) {
      switch (item.type) {
        case 'selection':
          if (selectedText) context += `\n\n**Selected Text:**\n\`\`\`\n${selectedText}\n\`\`\``;
          break;
        case 'document':
          if (documentContent) {
            const truncated = documentContent.length > 6000 
              ? documentContent.slice(0, 6000) + '\n\n[... truncated ...]'
              : documentContent;
            context += `\n\n**Document:**\n\`\`\`\n${truncated}\n\`\`\``;
          }
          break;
        case 'character':
          if (item.content) context += `\n\n**Character - ${item.name}:**\n${item.content}`;
          break;
        case 'location':
          if (item.content) context += `\n\n**Location - ${item.name}:**\n${item.content}`;
          break;
        case 'note':
          if (item.content) context += `\n\n**Note - ${item.name}:**\n${item.content}`;
          break;
      }
    }
    return context;
  }, [attachedItems, selectedText, documentContent]);

  // ==================== SEND HANDLERS ====================

  // Generic send that routes to mode-specific handler
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    switch (mode) {
      case 'framework':
        await sendFrameworkMessage();
        break;
      case 'discuss':
        await sendDiscussMessage();
        break;
      case 'ghostwrite':
        await sendGhostwriteMessage();
        break;
      case 'agents':
        await runSelectedAgents();
        break;
    }
  };

  // FRAMEWORK MODE: Build story foundation
  const sendFrameworkMessage = async () => {
    const userContent = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/framework/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userContent,
          topic: frameworkTopic,
          existingFramework: storyFramework,
          characters: characters.slice(0, 10),
          locations: locations.slice(0, 10),
          model: selectedModel,
          projectTitle
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');

      // Handle framework element creation
      if (data.type === 'framework_element' && data.element) {
        setPendingFramework({
          type: data.element.type,
          data: data.element.data
        });
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.content,
        timestamp: new Date(),
        model: currentModel?.name
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // DISCUSS MODE: Conversational
  const sendDiscussMessage = async () => {
    const context = buildContext();
    const userContent = input.trim() + context;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      context: attachedItems.length > 0 ? attachedItems.map(i => i.type).join(', ') : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedItems([]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userContent,
          systemPrompt: buildDiscussSystemPrompt(),
          model: selectedModel,
          temperature: 0.7,
          maxTokens: 1500
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text || data.content || data.data,
        timestamp: new Date(),
        model: currentModel?.name
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // GHOSTWRITE MODE: Generate prose
  const sendGhostwriteMessage = async () => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() + (selectedText ? ' (with selection)' : ''),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/ghostwrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input.trim(),
          selectedText,
          documentContent,
          cursorPosition,
          model: selectedModel,
          characters: characters.slice(0, 5),
          chapterTitle,
          projectTitle,
          currentBeat: currentChapterOutline?.beats?.[0]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');

      // Set pending edit for preview
      if (data.toolCalls?.[0] || data.content) {
        const toolCall = data.toolCalls?.[0];
        setPendingEdit({
          type: selectedText ? 'replace' : 'insert',
          originalText: selectedText || '',
          newText: toolCall?.arguments?.new_text || toolCall?.arguments?.text || data.content,
          explanation: toolCall?.arguments?.explanation
        });
        
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '📝 Review the suggested edit below',
          timestamp: new Date(),
          isToolCall: true
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // AGENTS MODE: Run specialist agents
  const runSelectedAgents = async () => {
    if (selectedAgents.length === 0) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ Please select at least one agent to run.',
        timestamp: new Date(),
        isError: true
      }]);
      return;
    }

    const content = selectedText || documentContent;
    if (!content) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ No content to review. Select text or ensure the document has content.',
        timestamp: new Date(),
        isError: true
      }]);
      return;
    }

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: `Running ${selectedAgents.length} agent(s): ${selectedAgents.map(id => AGENTS.find(a => a.id === id)?.name).join(', ')}`,
      timestamp: new Date(),
    }]);
    
    setIsLoading(true);
    setAgentResults([]);

    try {
      const response = await fetch('/api/ai/agents/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentIds: selectedAgents,
          content,
          model: selectedModel,
          chapterTitle,
          projectTitle,
          characters: characters.slice(0, 5)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');

      setAgentResults(data.suggestions || []);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `✅ Found ${data.suggestions?.length || 0} suggestions. Review them below.`,
        timestamp: new Date(),
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Build system prompt for discuss mode
  const buildDiscussSystemPrompt = () => {
    let prompt = `You are a friendly writing coach helping a fiction author. Be conversational, supportive, and specific.`;
    if (projectTitle) prompt += `\n\nProject: "${projectTitle}"`;
    if (chapterTitle) prompt += `\nChapter: "${chapterTitle}"`;
    if (characters.length > 0) {
      prompt += `\n\nCharacters:`;
      characters.slice(0, 5).forEach(c => {
        prompt += `\n- ${c.name}${c.role ? ` (${c.role})` : ''}`;
      });
    }
    return prompt;
  };

  // ==================== ACTION HANDLERS ====================

  // Accept ghostwrite edit
  const acceptEdit = useCallback(() => {
    if (!pendingEdit) return;
    if (pendingEdit.type === 'replace' && onReplaceSelection) {
      onReplaceSelection(pendingEdit.newText);
    } else if (onInsertText) {
      onInsertText(pendingEdit.newText);
    }
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: '✅ Edit applied',
      timestamp: new Date()
    }]);
    setPendingEdit(null);
  }, [pendingEdit, onReplaceSelection, onInsertText]);

  // Reject ghostwrite edit
  const rejectEdit = useCallback(() => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: '❌ Edit discarded',
      timestamp: new Date()
    }]);
    setPendingEdit(null);
  }, []);

  // Accept framework element
  const acceptFrameworkElement = useCallback(async () => {
    if (!pendingFramework) return;
    
    try {
      const { type, data } = pendingFramework;
      switch (type) {
        case 'character':
          if (onCreateCharacter) await onCreateCharacter(data as any);
          break;
        case 'location':
          if (onCreateLocation) await onCreateLocation(data as any);
          break;
        case 'note':
          if (onCreateNote) await onCreateNote(data as any);
          break;
        case 'premise':
          if (onUpdateFramework) await onUpdateFramework({ premise: data.premise as string, ...data });
          break;
      }
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ ${type} saved to framework!`,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Failed to save: ${error instanceof Error ? error.message : 'Unknown'}`,
        timestamp: new Date(),
        isError: true
      }]);
    }
    setPendingFramework(null);
  }, [pendingFramework, onCreateCharacter, onCreateLocation, onCreateNote, onUpdateFramework]);

  // Reject framework element
  const rejectFrameworkElement = useCallback(() => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: '❌ Discarded',
      timestamp: new Date()
    }]);
    setPendingFramework(null);
  }, []);

  // Copy message
  const copyMessage = (message: Message) => {
    navigator.clipboard.writeText(message.content);
    setCopiedMessageId(message.id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === '@') {
      setShowContextMenu(true);
    }
  };

  // Attach context
  const attachItem = (item: AttachedItem) => {
    setAttachedItems(prev => {
      if (prev.some(i => i.type === item.type && i.id === item.id)) return prev;
      return [...prev, item];
    });
    setShowContextMenu(false);
    inputRef.current?.focus();
  };

  const removeAttachedItem = (index: number) => {
    setAttachedItems(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle agent selection
  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  // ==================== RENDER ====================

  return (
    <div className={cn('flex flex-col h-full bg-[--ide-sidebar-bg]', className)}>
      {/* Header with mode tabs */}
      <Header 
        mode={mode} 
        setMode={setMode} 
        projectTitle={projectTitle}
      />

      {/* Mode-specific content area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Framework topic selector (Framework mode only) */}
        {mode === 'framework' && (
          <FrameworkTopicBar 
            topic={frameworkTopic} 
            setTopic={setFrameworkTopic}
            completedPhases={storyFramework?.completedPhases || []}
          />
        )}
        
        {/* Agent selector (Agents mode only) */}
        {mode === 'agents' && (
          <AgentSelector 
            selectedAgents={selectedAgents}
            toggleAgent={toggleAgent}
          />
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {messages.length === 0 ? (
            <EmptyState mode={mode} frameworkTopic={frameworkTopic} />
          ) : (
            messages.map((message) => (
              <MessageBubble 
                key={message.id}
                message={message}
                copiedId={copiedMessageId}
                onCopy={copyMessage}
              />
            ))
          )}
          
          {/* Pending Edit Preview (Ghostwrite) */}
          {pendingEdit && (
            <EditPreview 
              edit={pendingEdit}
              onAccept={acceptEdit}
              onReject={rejectEdit}
            />
          )}
          
          {/* Pending Framework Element (Framework) */}
          {pendingFramework && (
            <FrameworkPreview 
              element={pendingFramework}
              onAccept={acceptFrameworkElement}
              onReject={rejectFrameworkElement}
            />
          )}
          
          {/* Agent Results (Agents) */}
          {agentResults.length > 0 && (
            <AgentResultsList 
              suggestions={agentResults}
              onAccept={(id) => {
                setAgentResults(prev => prev.map(s => 
                  s.id === id ? { ...s, accepted: true } : s
                ));
              }}
              onReject={(id) => {
                setAgentResults(prev => prev.filter(s => s.id !== id));
              }}
            />
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 py-2">
              <RefreshCw className="w-4 h-4 text-[--ide-accent] animate-spin" />
              <span className="text-xs text-[--ide-foreground-secondary]">
                {mode === 'agents' ? 'Running agents...' : mode === 'ghostwrite' ? 'Generating...' : 'Thinking...'}
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <InputArea
          mode={mode}
          input={input}
          setInput={setInput}
          onSend={sendMessage}
          onKeyDown={handleKeyDown}
          disabled={isLoading || !!pendingEdit || !!pendingFramework}
          attachedItems={attachedItems}
          removeAttachedItem={removeAttachedItem}
          showContextMenu={showContextMenu}
          setShowContextMenu={setShowContextMenu}
          attachItem={attachItem}
          selectedText={selectedText}
          documentContent={documentContent}
          characters={characters}
          locations={locations}
          notes={notes}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          showModelDropdown={showModelDropdown}
          setShowModelDropdown={setShowModelDropdown}
          currentModel={currentModel}
          inputRef={inputRef}
          contextMenuRef={contextMenuRef}
          modelDropdownRef={modelDropdownRef}
        />
      </div>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

// Header with mode tabs
function Header({ 
  mode, 
  setMode, 
  projectTitle 
}: { 
  mode: CopilotMode; 
  setMode: (m: CopilotMode) => void;
  projectTitle?: string;
}) {
  return (
    <div className="border-b border-[--ide-border]">
      <div className="flex items-center justify-between px-3 h-[35px]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[--ide-foreground-secondary]">
          Co-Writer
        </span>
        {projectTitle && (
          <span className="text-[10px] text-[--ide-foreground-secondary] truncate max-w-[120px]">
            {projectTitle}
          </span>
        )}
      </div>
      
      {/* Mode tabs */}
      <div className="flex px-2 pb-1 gap-1">
        {(Object.keys(MODE_CONFIG) as CopilotMode[]).map((m) => {
          const config = MODE_CONFIG[m];
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded text-[10px] transition-colors',
                mode === m
                  ? `bg-[--ide-accent]/20 ${config.color}`
                  : 'text-[--ide-foreground-secondary] hover:text-[--ide-foreground] hover:bg-[--ide-hover-bg]'
              )}
              title={config.description}
            >
              {config.icon}
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Framework topic selector bar
function FrameworkTopicBar({ 
  topic, 
  setTopic,
  completedPhases 
}: { 
  topic: string | null; 
  setTopic: (t: string | null) => void;
  completedPhases: string[];
}) {
  return (
    <div className="px-3 py-2 border-b border-[--ide-border] bg-[--ide-input-bg]/30">
      <div className="text-[10px] text-[--ide-foreground-secondary] mb-2">Build your story framework:</div>
      <div className="flex flex-wrap gap-1">
        {FRAMEWORK_TOPICS.map((t) => {
          const isComplete = completedPhases.includes(t.id);
          return (
            <button
              key={t.id}
              onClick={() => setTopic(topic === t.id ? null : t.id)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors',
                topic === t.id
                  ? 'bg-purple-500/20 text-purple-400'
                  : isComplete
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-[--ide-input-bg] text-[--ide-foreground-secondary] hover:text-[--ide-foreground]'
              )}
            >
              <span>{t.icon}</span>
              {t.label}
              {isComplete && <Check className="w-3 h-3" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Agent selector for Agents mode
function AgentSelector({ 
  selectedAgents, 
  toggleAgent 
}: { 
  selectedAgents: string[]; 
  toggleAgent: (id: string) => void;
}) {
  return (
    <div className="px-3 py-2 border-b border-[--ide-border] bg-[--ide-input-bg]/30">
      <div className="text-[10px] text-[--ide-foreground-secondary] mb-2">Select agents to review your writing:</div>
      <div className="grid grid-cols-2 gap-1">
        {AGENTS.map((agent) => (
          <button
            key={agent.id}
            onClick={() => toggleAgent(agent.id)}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded text-[10px] text-left transition-colors',
              selectedAgents.includes(agent.id)
                ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30'
                : 'bg-[--ide-input-bg] text-[--ide-foreground-secondary] hover:text-[--ide-foreground]'
            )}
          >
            <span className="text-sm">{agent.icon}</span>
            <span className="truncate">{agent.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Empty state for different modes
function EmptyState({ mode, frameworkTopic }: { mode: CopilotMode; frameworkTopic: string | null }) {
  const config = MODE_CONFIG[mode];
  
  const getHint = () => {
    switch (mode) {
      case 'framework':
        if (frameworkTopic) {
          const topic = FRAMEWORK_TOPICS.find(t => t.id === frameworkTopic);
          return topic?.question || 'Tell me about this aspect of your story.';
        }
        return 'Select a topic above to start building your story framework.';
      case 'discuss':
        return 'Ask questions, brainstorm ideas, or get feedback on your writing.';
      case 'ghostwrite':
        return 'Describe what you want to write. Select text first for targeted edits.';
      case 'agents':
        return 'Select agents above, then click send to review your chapter.';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center mb-3', `bg-[--ide-input-bg]`)}>
        <span className={config.color}>{config.icon}</span>
      </div>
      <p className="text-sm text-[--ide-foreground-secondary] mb-1">{config.label} Mode</p>
      <p className="text-xs text-[--ide-foreground-secondary] opacity-60">{getHint()}</p>
      {mode !== 'agents' && (
        <p className="text-[10px] text-[--ide-foreground-secondary] opacity-40 mt-3">
          Press <kbd className="px-1 py-0.5 bg-[--ide-input-bg] rounded">@</kbd> to attach context
        </p>
      )}
    </div>
  );
}

// Message bubble component
function MessageBubble({ 
  message, 
  copiedId, 
  onCopy 
}: { 
  message: Message; 
  copiedId: string | null;
  onCopy: (m: Message) => void;
}) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn('group', isUser ? 'flex justify-end' : '')}>
      <div className={cn(
        'max-w-[90%] rounded-lg px-3 py-2 text-sm',
        isUser 
          ? 'bg-[--ide-accent] text-white' 
          : message.isError 
          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
          : 'bg-[--ide-input-bg] text-[--ide-foreground]'
      )}>
        {/* Context indicator */}
        {message.context && (
          <div className="text-[10px] opacity-60 mb-1">📎 {message.context}</div>
        )}
        
        {/* Content */}
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        
        {/* Footer */}
        {!isUser && (
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-[--ide-border]/30">
            <span className="text-[10px] opacity-40">
              {message.model || 'AI'}
            </span>
            <button
              onClick={() => onCopy(message)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[--ide-hover-bg] rounded transition-opacity"
            >
              {copiedId === message.id ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3 text-[--ide-foreground-secondary]" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Edit preview for ghostwrite mode
function EditPreview({ 
  edit, 
  onAccept, 
  onReject 
}: { 
  edit: PendingEdit;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div className="rounded-lg border border-green-500/30 overflow-hidden bg-[--ide-sidebar-bg]">
      <div className="flex items-center justify-between px-3 py-2 bg-green-500/10 border-b border-green-500/20">
        <div className="flex items-center gap-2">
          <PenTool className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-medium text-green-400">
            {edit.type === 'replace' ? 'Replace Selection' : 'Insert Text'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onReject}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400"
          >
            <X className="w-3 h-3" />
            Reject
          </button>
          <button
            onClick={onAccept}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400"
          >
            <Check className="w-3 h-3" />
            Accept
          </button>
        </div>
      </div>
      
      <div className="p-3 max-h-[250px] overflow-y-auto text-xs font-mono">
        {edit.originalText && (
          <div className="mb-2">
            {edit.originalText.split('\n').map((line, i) => (
              <div key={`old-${i}`} className="flex">
                <span className="w-5 text-red-400/60 select-none">−</span>
                <span className="flex-1 bg-red-500/10 text-red-300/80 px-1.5 rounded-sm line-through">
                  {line || '\u00A0'}
                </span>
              </div>
            ))}
          </div>
        )}
        {edit.newText.split('\n').map((line, i) => (
          <div key={`new-${i}`} className="flex">
            <span className="w-5 text-green-400/60 select-none">+</span>
            <span className="flex-1 bg-green-500/10 text-green-300 px-1.5 rounded-sm">
              {line || '\u00A0'}
            </span>
          </div>
        ))}
      </div>
      
      {edit.explanation && (
        <div className="px-3 py-2 border-t border-[--ide-border] bg-[--ide-input-bg]/50">
          <p className="text-[10px] text-[--ide-foreground-secondary] italic">{edit.explanation}</p>
        </div>
      )}
    </div>
  );
}

// Framework element preview
function FrameworkPreview({ 
  element, 
  onAccept, 
  onReject 
}: { 
  element: PendingFrameworkElement;
  onAccept: () => void;
  onReject: () => void;
}) {
  const { type, data } = element;
  
  const getIcon = () => {
    switch (type) {
      case 'character': return <Users className="w-3.5 h-3.5 text-purple-400" />;
      case 'location': return <MapPin className="w-3.5 h-3.5 text-blue-400" />;
      case 'note': return <FileText className="w-3.5 h-3.5 text-green-400" />;
      case 'premise': return <BookOpen className="w-3.5 h-3.5 text-yellow-400" />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'character': return 'purple';
      case 'location': return 'blue';
      case 'note': return 'green';
      case 'premise': return 'yellow';
    }
  };

  const color = getColor();

  return (
    <div className={`rounded-lg border border-${color}-500/30 overflow-hidden bg-[--ide-sidebar-bg]`}>
      <div className={`flex items-center justify-between px-3 py-2 bg-${color}-500/10 border-b border-${color}-500/20`}>
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className={`text-xs font-medium text-${color}-400 capitalize`}>
            Add {type}: {(data.name || data.title || data.premise)?.toString().slice(0, 30)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onReject}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400"
          >
            <X className="w-3 h-3" />
            Discard
          </button>
          <button
            onClick={onAccept}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs bg-${color}-500/20 hover:bg-${color}-500/30 text-${color}-400`}
          >
            <Check className="w-3 h-3" />
            Save
          </button>
        </div>
      </div>
      
      <div className="p-3 text-xs space-y-1">
        {Object.entries(data).map(([key, value]) => {
          if (!value) return null;
          return (
            <div key={key} className="flex gap-2">
              <span className="text-[--ide-foreground-secondary] w-20 capitalize">{key}:</span>
              <span className="text-[--ide-foreground] flex-1">
                {Array.isArray(value) ? value.join(', ') : String(value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Agent results list
function AgentResultsList({ 
  suggestions, 
  onAccept, 
  onReject 
}: { 
  suggestions: AgentSuggestion[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] text-[--ide-foreground-secondary] font-medium">
        {suggestions.length} Suggestion{suggestions.length !== 1 ? 's' : ''}
      </div>
      {suggestions.map((suggestion) => (
        <div 
          key={suggestion.id}
          className={cn(
            'rounded-lg border overflow-hidden bg-[--ide-sidebar-bg] text-xs',
            suggestion.accepted ? 'border-green-500/30' : 'border-orange-500/30'
          )}
        >
          <div className="flex items-center justify-between px-3 py-2 bg-orange-500/10 border-b border-orange-500/20">
            <div className="flex items-center gap-2">
              {suggestion.severity === 'error' ? (
                <XCircle className="w-3.5 h-3.5 text-red-400" />
              ) : suggestion.severity === 'warning' ? (
                <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="text-[--ide-foreground]">{suggestion.issue}</span>
            </div>
            {!suggestion.accepted && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onReject(suggestion.id)}
                  className="p-1 rounded hover:bg-red-500/20 text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onAccept(suggestion.id)}
                  className="p-1 rounded hover:bg-green-500/20 text-green-400"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            )}
            {suggestion.accepted && (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
          </div>
          
          <div className="p-3 space-y-2">
            {suggestion.originalText && (
              <div>
                <div className="text-[10px] text-[--ide-foreground-secondary] mb-1">Original:</div>
                <div className="bg-red-500/10 text-red-300/80 px-2 py-1 rounded line-through">
                  {suggestion.originalText}
                </div>
              </div>
            )}
            <div>
              <div className="text-[10px] text-[--ide-foreground-secondary] mb-1">Suggestion:</div>
              <div className="bg-green-500/10 text-green-300 px-2 py-1 rounded">
                {suggestion.suggestion}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Input area component
function InputArea({
  mode,
  input,
  setInput,
  onSend,
  onKeyDown,
  disabled,
  attachedItems,
  removeAttachedItem,
  showContextMenu,
  setShowContextMenu,
  attachItem,
  selectedText,
  documentContent,
  characters,
  locations,
  notes,
  selectedModel,
  setSelectedModel,
  showModelDropdown,
  setShowModelDropdown,
  currentModel,
  inputRef,
  contextMenuRef,
  modelDropdownRef
}: any) {
  const hasAttachments = attachedItems && attachedItems.length > 0;
  
  const getPlaceholder = () => {
    switch (mode) {
      case 'framework': return 'Describe your story element...';
      case 'discuss': return 'Ask about your writing...';
      case 'ghostwrite': return 'Describe what to write...';
      case 'agents': return 'Click send to run selected agents';
    }
  };
  
  return (
    <div className="p-2 border-t border-[--ide-border]">
      {/* Attached items */}
      {hasAttachments && (
        <div className="flex flex-wrap gap-1 mb-2">
          {attachedItems.map((item: AttachedItem, index: number) => (
            <div 
              key={`${item.type}-${item.id || index}`}
              className="flex items-center gap-1.5 px-2 py-1 bg-[--ide-input-bg] border border-[--ide-border] rounded text-xs"
            >
              {item.type === 'selection' && <Pencil className="w-3 h-3 text-[--ide-accent]" />}
              {item.type === 'document' && <FileText className="w-3 h-3 text-[--ide-accent]" />}
              {item.type === 'character' && <Users className="w-3 h-3 text-purple-400" />}
              {item.type === 'location' && <MapPin className="w-3 h-3 text-blue-400" />}
              {item.type === 'note' && <Hash className="w-3 h-3 text-yellow-400" />}
              <span className="text-[--ide-foreground] max-w-[100px] truncate">
                {item.name || (item.type === 'selection' ? 'Selection' : 'Document')}
              </span>
              <button onClick={() => removeAttachedItem(index)} className="p-0.5 hover:bg-[--ide-hover-bg] rounded">
                <X className="w-3 h-3 text-[--ide-foreground-secondary]" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative bg-[--ide-input-bg] rounded border border-[--ide-border] focus-within:border-[--ide-accent]">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={getPlaceholder()}
          disabled={disabled}
          rows={1}
          className="w-full px-3 py-2 bg-transparent text-sm text-[--ide-foreground] placeholder-[--ide-foreground-secondary] resize-none focus:outline-none min-h-[36px] max-h-[120px]"
        />
        
        {/* Toolbar */}
        <div className="flex items-center justify-between px-2 py-1 border-t border-[--ide-border]/50">
          {/* Context menu button */}
          <div className="relative" ref={contextMenuRef}>
            <button
              onClick={() => setShowContextMenu(!showContextMenu)}
              className={cn(
                "p-1 rounded hover:bg-[--ide-hover-bg]",
                hasAttachments ? "text-[--ide-accent]" : "text-[--ide-foreground-secondary]"
              )}
            >
              <AtSign className="w-4 h-4" />
            </button>
            
            {showContextMenu && (
              <ContextMenu 
                attachItem={attachItem}
                selectedText={selectedText}
                documentContent={documentContent}
                characters={characters}
                locations={locations}
                notes={notes}
              />
            )}
          </div>

          {/* Model selector + Send */}
          <div className="flex items-center gap-1">
            <div className="relative" ref={modelDropdownRef}>
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[--ide-hover-bg] text-[10px] text-[--ide-foreground-secondary]"
              >
                <span className="max-w-[80px] truncate">{currentModel?.name || 'Model'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showModelDropdown && (
                <div className="absolute bottom-full right-0 mb-1 w-56 bg-[--ide-sidebar-bg] border border-[--ide-border] rounded shadow-lg py-1 z-50 max-h-[250px] overflow-y-auto">
                  {FREE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelDropdown(false);
                      }}
                      className={cn(
                        'w-full px-3 py-1.5 text-left text-xs hover:bg-[--ide-hover-bg] flex items-center justify-between',
                        selectedModel === model.id ? 'text-[--ide-accent]' : 'text-[--ide-foreground]'
                      )}
                    >
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-[10px] text-[--ide-foreground-secondary]">{model.description}</div>
                      </div>
                      {selectedModel === model.id && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onSend}
              disabled={mode !== 'agents' ? !input.trim() || disabled : disabled}
              className="p-1.5 rounded bg-[--ide-accent] hover:bg-[--ide-accent-hover] text-white disabled:opacity-40"
            >
              {mode === 'agents' ? <Play className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
      
      <p className="text-[9px] text-[--ide-foreground-secondary] text-center mt-1.5 opacity-50">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}

// Context menu for attaching items
function ContextMenu({
  attachItem,
  selectedText,
  documentContent,
  characters,
  locations,
  notes
}: any) {
  const [tab, setTab] = useState<'context' | 'characters' | 'locations' | 'notes'>('context');
  
  return (
    <div className="absolute bottom-full left-0 mb-1 w-56 bg-[--ide-sidebar-bg] border border-[--ide-border] rounded shadow-lg z-50">
      {/* Tabs */}
      <div className="flex border-b border-[--ide-border]">
        {[
          { id: 'context', label: 'Context', icon: FileText },
          { id: 'characters', label: 'Characters', icon: Users },
          { id: 'locations', label: 'Locations', icon: MapPin },
          { id: 'notes', label: 'Notes', icon: Hash },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={cn(
              'flex-1 px-2 py-1.5 text-[10px] flex items-center justify-center gap-1',
              tab === t.id 
                ? 'text-[--ide-accent] border-b-2 border-[--ide-accent]' 
                : 'text-[--ide-foreground-secondary] hover:text-[--ide-foreground]'
            )}
          >
            <t.icon className="w-3 h-3" />
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="py-1 max-h-[200px] overflow-y-auto">
        {tab === 'context' && (
          <>
            <button
              onClick={() => attachItem({ type: 'selection' })}
              disabled={!selectedText}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-[--ide-hover-bg] disabled:opacity-40 flex items-center gap-2"
            >
              <Pencil className="w-3 h-3 text-[--ide-accent]" />
              <span className="text-[--ide-accent]">@selection</span>
            </button>
            <button
              onClick={() => attachItem({ type: 'document' })}
              disabled={!documentContent}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-[--ide-hover-bg] disabled:opacity-40 flex items-center gap-2"
            >
              <FileText className="w-3 h-3 text-[--ide-accent]" />
              <span className="text-[--ide-accent]">@document</span>
            </button>
          </>
        )}
        
        {tab === 'characters' && (
          characters.length > 0 ? (
            characters.map((char: StoryCharacter) => (
              <button
                key={char.id}
                onClick={() => attachItem({
                  type: 'character',
                  id: char.id,
                  name: char.name,
                  content: `${char.name}${char.role ? ` (${char.role})` : ''}: ${char.description || ''}`
                })}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[--ide-hover-bg] flex items-center gap-2"
              >
                <Users className="w-3 h-3 text-purple-400" />
                <span className="text-[--ide-foreground]">{char.name}</span>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-[--ide-foreground-secondary]">No characters</div>
          )
        )}
        
        {tab === 'locations' && (
          locations.length > 0 ? (
            locations.map((loc: StoryLocation) => (
              <button
                key={loc.id}
                onClick={() => attachItem({
                  type: 'location',
                  id: loc.id,
                  name: loc.name,
                  content: `${loc.name}${loc.type ? ` (${loc.type})` : ''}: ${loc.description || ''}`
                })}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[--ide-hover-bg] flex items-center gap-2"
              >
                <MapPin className="w-3 h-3 text-blue-400" />
                <span className="text-[--ide-foreground]">{loc.name}</span>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-[--ide-foreground-secondary]">No locations</div>
          )
        )}
        
        {tab === 'notes' && (
          notes.length > 0 ? (
            notes.map((note: StoryNote) => (
              <button
                key={note.id}
                onClick={() => attachItem({
                  type: 'note',
                  id: note.id,
                  name: note.title,
                  content: `${note.title}: ${note.content}`
                })}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[--ide-hover-bg] flex items-center gap-2"
              >
                <Hash className="w-3 h-3 text-yellow-400" />
                <span className="text-[--ide-foreground]">{note.title}</span>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-[--ide-foreground-secondary]">No notes</div>
          )
        )}
      </div>
    </div>
  );
}

export default AICopilotPanel;
