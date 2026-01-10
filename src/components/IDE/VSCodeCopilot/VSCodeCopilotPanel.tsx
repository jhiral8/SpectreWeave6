'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CopilotHeader } from './CopilotHeader';
import { ContextChips } from './ContextChips';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import type { 
  VSCodeCopilotPanelProps, 
  ChatMessageData, 
  CopilotTab, 
  AgentOption,
  ContextChip,
  DEFAULT_AGENTS 
} from './types';

/**
 * VS Code Copilot Panel
 * 
 * Full VS Code Copilot Chat-style panel.
 * 
 * ┌──────────────────────────────────────────────────┐
 * │ [+] Chat │ Edits │           [Agent ▾]          │  Header
 * ├──────────────────────────────────────────────────┤
 * │ [@file] [@selection] [@character]        [+]    │  Context Chips
 * ├──────────────────────────────────────────────────┤
 * │                                                  │
 * │   User message bubble                            │
 * │                                                  │  Messages
 * │   AI response bubble                             │
 * │   - Code blocks with copy/insert                 │
 * │                                                  │
 * ├──────────────────────────────────────────────────┤
 * │ [📎] Ask Copilot...                      [▶]    │  Input
 * └──────────────────────────────────────────────────┘
 */

const DEFAULT_AGENT_LIST: AgentOption[] = [
  {
    id: 'copilot',
    name: 'Copilot',
    description: 'General writing assistant',
    icon: 'Sparkles',
  },
  {
    id: 'story-architect',
    name: 'Story Architect',
    description: 'Plot and structure expert',
    icon: 'Building',
  },
  {
    id: 'character-coach',
    name: 'Character Coach',
    description: 'Character development specialist',
    icon: 'Users',
  },
  {
    id: 'prose-polish',
    name: 'Prose Polish',
    description: 'Style and prose refinement',
    icon: 'Wand2',
  },
];

export const VSCodeCopilotPanel: React.FC<VSCodeCopilotPanelProps> = ({
  initialMessages = [],
  contextChips = [],
  agents = DEFAULT_AGENT_LIST,
  onSendMessage,
  onInsertCode,
  onNewChat,
  className,
}) => {
  // State
  const [activeTab, setActiveTab] = useState<CopilotTab>('chat');
  const [selectedAgent, setSelectedAgent] = useState<AgentOption>(agents[0]);
  const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sync messages when initialMessages changes (for controlled mode)
  React.useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Handle tab change
  const handleTabChange = useCallback((tab: CopilotTab) => {
    setActiveTab(tab);
  }, []);

  // Handle agent change
  const handleAgentChange = useCallback((agent: AgentOption) => {
    setSelectedAgent(agent);
  }, []);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setInputValue('');
    setSelectedChips([]);
    onNewChat?.();
  }, [onNewChat]);

  // Handle chip toggle
  const handleToggleChip = useCallback((chipId: string) => {
    setSelectedChips(prev => 
      prev.includes(chipId)
        ? prev.filter(id => id !== chipId)
        : [...prev, chipId]
    );
  }, []);

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;

    const selectedContext = contextChips.filter(chip => selectedChips.includes(chip.id));

    // Add user message
    const userMessage: ChatMessageData = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      context: selectedContext,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Call external handler
    onSendMessage?.(inputValue, selectedContext);

    // Simulate AI response (in real app, this would come from the API)
    setTimeout(() => {
      const assistantMessage: ChatMessageData = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `I understand you want help with: "${inputValue}"\n\nHere's a suggestion based on the context provided...`,
        timestamp: new Date(),
        agent: selectedAgent.name,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  }, [inputValue, contextChips, selectedChips, selectedAgent, onSendMessage]);

  // Handle copy
  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  // Handle regenerate
  const handleRegenerate = useCallback((messageId: string) => {
    console.log('[VSCodeCopilotPanel] Regenerate:', messageId);
    // In real app, would re-send the prompt
  }, []);

  return (
    <div
      className={cn(
        'vscode-copilot-panel',
        'flex flex-col h-full',
        'bg-[var(--ide-bg,#252526)]',
        className
      )}
    >
      {/* Header */}
      <CopilotHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedAgent={selectedAgent}
        agents={agents}
        onAgentChange={handleAgentChange}
        onNewChat={handleNewChat}
      />

      {/* Context Chips */}
      {contextChips.length > 0 && (
        <ContextChips
          chips={contextChips}
          selectedChips={selectedChips}
          onToggleChip={handleToggleChip}
        />
      )}

      {/* Messages */}
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        onCopy={handleCopy}
        onRegenerate={handleRegenerate}
        onInsertCode={onInsertCode}
      />

      {/* Input */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSendMessage}
        isLoading={isLoading}
        agents={agents}
        selectedAgent={selectedAgent}
        onAgentChange={handleAgentChange}
      />
    </div>
  );
};

export default VSCodeCopilotPanel;
