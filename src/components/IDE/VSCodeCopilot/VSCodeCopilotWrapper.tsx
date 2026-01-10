'use client';

/**
 * VSCode-style AI Copilot Wrapper
 * 
 * This component wraps the new VSCodeCopilotPanel UI while connecting
 * it to the existing AICopilotPanel business logic.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { VSCodeCopilotPanel } from '../VSCodeCopilot';
import type { 
  ChatMessageData, 
  ContextChip, 
  AgentOption,
  DEFAULT_AGENTS 
} from '../VSCodeCopilot/types';

interface VSCodeCopilotWrapperProps {
  /** Document content for context */
  documentContent?: string;
  /** Selected text */
  selectedText?: string;
  /** Current chapter title */
  chapterTitle?: string;
  /** Project title */
  projectTitle?: string;
  /** Characters for context */
  characters?: Array<{ id: string; name: string; role?: string; description?: string }>;
  /** Locations for context */
  locations?: Array<{ id: string; name: string; type?: string; description?: string }>;
  /** Notes for context */
  notes?: Array<{ id: string; title: string; content?: string; category?: string }>;
  /** Insert text callback */
  onInsertText?: (text: string) => void;
  /** Replace selection callback */
  onReplaceSelection?: (text: string) => void;
  /** Create character callback */
  onCreateCharacter?: (data: any) => Promise<any>;
  /** Create location callback */
  onCreateLocation?: (data: any) => Promise<any>;
  /** Create note callback */
  onCreateNote?: (data: any) => Promise<any>;
  /** Launch framework wizard */
  onLaunchFrameworkWizard?: () => void;
  /** Open framework editor */
  onOpenFrameworkEditor?: () => void;
  /** Whether framework exists */
  hasFramework?: boolean;
}

/**
 * Default agents for fiction writing
 */
const WRITING_AGENTS: AgentOption[] = [
  {
    id: 'copilot',
    name: 'Copilot',
    description: 'General writing assistant',
    icon: 'Sparkles',
    capabilities: ['chat', 'edit', 'explain'],
  },
  {
    id: 'story-architect',
    name: 'Story Architect',
    description: 'Plot and structure expert',
    icon: 'Building',
    capabilities: ['framework', 'outline', 'pacing'],
  },
  {
    id: 'character-coach',
    name: 'Character Coach',
    description: 'Character development specialist',
    icon: 'Users',
    capabilities: ['dialogue', 'motivation', 'arc'],
  },
  {
    id: 'prose-polish',
    name: 'Prose Polish',
    description: 'Style and prose refinement',
    icon: 'Wand2',
    capabilities: ['style', 'voice', 'flow'],
  },
];

export const VSCodeCopilotWrapper: React.FC<VSCodeCopilotWrapperProps> = ({
  documentContent,
  selectedText,
  chapterTitle,
  projectTitle,
  characters = [],
  locations = [],
  notes = [],
  onInsertText,
  onReplaceSelection,
  onCreateCharacter,
  onCreateLocation,
  onCreateNote,
  onLaunchFrameworkWizard,
  onOpenFrameworkEditor,
  hasFramework,
}) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to SpectreWeave AI! I'm your writing assistant. I can help you with:\n\n• **Drafting** - Continue your story or write new scenes\n• **Characters** - Develop compelling characters\n• **Plot** - Structure your narrative\n• **Editing** - Polish your prose\n\nHow can I help you today?`,
      timestamp: new Date(),
    },
  ]);

  // Build context chips from available data
  const contextChips = useMemo<ContextChip[]>(() => {
    const chips: ContextChip[] = [];

    // Current chapter
    if (chapterTitle) {
      chips.push({
        id: 'chapter',
        type: 'chapter',
        label: chapterTitle,
        content: documentContent || '',
        icon: 'BookOpen',
      });
    }

    // Selected text
    if (selectedText) {
      chips.push({
        id: 'selection',
        type: 'selection',
        label: `Selection (${selectedText.length} chars)`,
        content: selectedText,
        icon: 'TextSelect',
      });
    }

    // Characters
    characters.slice(0, 3).forEach(char => {
      chips.push({
        id: `char-${char.id}`,
        type: 'character',
        label: char.name,
        content: char.description || `${char.name} - ${char.role || 'character'}`,
        icon: 'User',
      });
    });

    return chips;
  }, [chapterTitle, documentContent, selectedText, characters]);

  // Handle sending a message
  const handleSendMessage = useCallback(async (content: string, context: ContextChip[]) => {
    // Add user message
    const userMessage: ChatMessageData = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      context,
    };
    setMessages(prev => [...prev, userMessage]);

    // Add assistant message (streaming placeholder)
    const assistantMessage: ChatMessageData = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Call AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content },
          ],
          context: {
            documentContent,
            selectedText,
            chapterTitle,
            projectTitle,
            characters,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Update with actual response
      setMessages(prev => 
        prev.map(m => 
          m.id === assistantMessage.id 
            ? { ...m, content: data.content || 'I can help you with your writing!', isStreaming: false }
            : m
        )
      );
    } catch (error) {
      // Update with error
      setMessages(prev => 
        prev.map(m => 
          m.id === assistantMessage.id 
            ? { 
                ...m, 
                content: "I'm having trouble connecting. Please check your connection and try again.", 
                isStreaming: false,
                error: 'Connection failed' 
              }
            : m
        )
      );
    }
  }, [messages, documentContent, selectedText, chapterTitle, projectTitle, characters]);

  // Handle inserting code
  const handleInsertCode = useCallback((code: string) => {
    if (onInsertText) {
      onInsertText(code);
    }
  }, [onInsertText]);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: 'Starting a new conversation. How can I help you with your writing?',
      timestamp: new Date(),
    }]);
  }, []);

  return (
    <VSCodeCopilotPanel
      initialMessages={messages}
      contextChips={contextChips}
      agents={WRITING_AGENTS}
      onSendMessage={handleSendMessage}
      onInsertCode={handleInsertCode}
      onNewChat={handleNewChat}
    />
  );
};

export default VSCodeCopilotWrapper;
