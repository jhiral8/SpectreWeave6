'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  User, 
  Users, 
  MapPin, 
  Swords, 
  Sparkles,
  ChevronRight,
  Check,
  Loader2,
  MessageSquare,
  Plus,
  Save
} from 'lucide-react';
import { ModelSelector } from '../AICopilotPanel/ModelSelector';
import { AIModel, DEFAULT_MODEL } from '../AICopilotPanel/types';

/**
 * FrameworkBuilder - Guided wizard for creating story framework
 * 
 * Topics covered:
 * 1. Premise - Core concept, genre, tone
 * 2. Protagonist - Main character development
 * 3. Antagonist - Opposition development
 * 4. World - Setting and world-building
 * 5. Conflict - Central conflict and stakes
 * 6. Themes - Thematic elements
 */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  element?: {
    type: 'premise' | 'character' | 'location' | 'note';
    data: Record<string, unknown>;
  };
}

interface FrameworkBuilderProps {
  projectId: string;
  projectTitle: string;
  existingFramework?: {
    premise?: string;
    genre?: string;
    tone?: string;
    hook?: string;
  };
  characters?: Array<{ id: string; name: string; role?: string; description?: string; traits?: string[] }>;
  locations?: Array<{ id: string; name: string; type?: string; description?: string }>;
  onCreateCharacter?: (data: any) => Promise<void>;
  onCreateLocation?: (data: any) => Promise<void>;
  onCreateNote?: (data: any) => Promise<void>;
  onUpdateFramework?: (data: any) => Promise<void>;
  className?: string;
}

const TOPICS = [
  { id: 'premise', label: 'Story Premise', icon: BookOpen, description: 'Core concept, genre, tone' },
  { id: 'protagonist', label: 'Protagonist', icon: User, description: 'Main character' },
  { id: 'antagonist', label: 'Antagonist', icon: Users, description: 'Opposition' },
  { id: 'world', label: 'World Building', icon: MapPin, description: 'Settings & locations' },
  { id: 'conflict', label: 'Central Conflict', icon: Swords, description: 'Stakes & obstacles' },
  { id: 'themes', label: 'Themes', icon: Sparkles, description: 'Meaning & messages' },
] as const;

type TopicId = typeof TOPICS[number]['id'];

export function FrameworkBuilder({
  projectId,
  projectTitle,
  existingFramework,
  characters = [],
  locations = [],
  onCreateCharacter,
  onCreateLocation,
  onCreateNote,
  onUpdateFramework,
  className
}: FrameworkBuilderProps) {
  const [currentTopic, setCurrentTopic] = useState<TopicId>('premise');
  const [completedTopics, setCompletedTopics] = useState<Set<TopicId>>(new Set());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
  const [pendingElements, setPendingElements] = useState<Message['element'][]>([]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize with welcome message when topic changes
  useEffect(() => {
    const topic = TOPICS.find(t => t.id === currentTopic);
    if (topic && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: getWelcomeMessage(currentTopic, projectTitle)
      }]);
    }
  }, [currentTopic, projectTitle]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/framework/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input.trim(),
          topic: currentTopic,
          existingFramework,
          characters,
          locations,
          model: selectedModel.id,
          projectTitle
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        element: data.element
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If there's a framework element, add to pending
      if (data.element) {
        setPendingElements(prev => [...prev, data.element]);
      }
    } catch (error) {
      console.error('Framework chat error:', error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, currentTopic, existingFramework, characters, locations, selectedModel, projectTitle]);

  const handleSaveElement = useCallback(async (element: Message['element']) => {
    if (!element) return;

    try {
      switch (element.type) {
        case 'premise':
          await onUpdateFramework?.(element.data);
          break;
        case 'character':
          await onCreateCharacter?.(element.data);
          break;
        case 'location':
          await onCreateLocation?.(element.data);
          break;
        case 'note':
          await onCreateNote?.(element.data);
          break;
      }
      // Remove from pending
      setPendingElements(prev => prev.filter(e => e !== element));
    } catch (error) {
      console.error('Failed to save element:', error);
    }
  }, [onUpdateFramework, onCreateCharacter, onCreateLocation, onCreateNote]);

  const handleTopicChange = useCallback((topicId: TopicId) => {
    setCurrentTopic(topicId);
    setMessages([]); // Clear messages for new topic
  }, []);

  const markTopicComplete = useCallback(() => {
    setCompletedTopics(prev => new Set([...prev, currentTopic]));
    // Move to next incomplete topic
    const currentIndex = TOPICS.findIndex(t => t.id === currentTopic);
    const nextTopic = TOPICS.slice(currentIndex + 1).find(t => !completedTopics.has(t.id));
    if (nextTopic) {
      handleTopicChange(nextTopic.id);
    }
  }, [currentTopic, completedTopics, handleTopicChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <div className={cn("flex flex-col h-full bg-neutral-900", className)}>
      {/* Topic Navigation */}
      <div className="flex-shrink-0 border-b border-neutral-700 p-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {TOPICS.map((topic, index) => {
            const Icon = topic.icon;
            const isActive = currentTopic === topic.id;
            const isCompleted = completedTopics.has(topic.id);
            
            return (
              <React.Fragment key={topic.id}>
                <button
                  onClick={() => handleTopicChange(topic.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                    isActive 
                      ? "bg-purple-600 text-white" 
                      : isCompleted
                        ? "bg-green-800/30 text-green-400 hover:bg-green-800/50"
                        : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                  {topic.label}
                </button>
                {index < TOPICS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Model Selector */}
      <div className="flex-shrink-0 border-b border-neutral-700 px-3 py-2">
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>

      {/* Chat Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2",
                message.role === 'user'
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-800 text-neutral-200"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {/* Framework Element Preview */}
              {message.element && (
                <div className="mt-3 p-3 bg-neutral-700/50 rounded-md border border-neutral-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-purple-400 uppercase">
                      {message.element.type}
                    </span>
                    <button
                      onClick={() => handleSaveElement(message.element)}
                      className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-medium transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Save to Framework
                    </button>
                  </div>
                  <pre className="text-xs text-neutral-300 overflow-x-auto">
                    {JSON.stringify(message.element.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="bg-neutral-800 rounded-lg px-4 py-2">
              <p className="text-sm text-neutral-400">Thinking...</p>
            </div>
          </div>
        )}
      </div>

      {/* Pending Elements Bar */}
      {pendingElements.length > 0 && (
        <div className="flex-shrink-0 border-t border-neutral-700 p-2 bg-neutral-800/50">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>{pendingElements.length} unsaved element(s)</span>
            <button
              onClick={() => pendingElements.forEach(handleSaveElement)}
              className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded font-medium transition-colors"
            >
              <Save className="w-3 h-3" />
              Save All
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-neutral-700 p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Describe your ${TOPICS.find(t => t.id === currentTopic)?.label.toLowerCase()}...`}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Send
            </button>
            <button
              onClick={markTopicComplete}
              className="px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getWelcomeMessage(topic: TopicId, projectTitle: string): string {
  const messages: Record<TopicId, string> = {
    premise: `Let's develop the premise for "${projectTitle}"! 

Tell me about your story idea. What's the core concept? What genre are you thinking? What kind of tone do you want - dark and gritty, light and fun, epic and sweeping?

Just describe your vision and I'll help you refine it.`,
    protagonist: `Now let's create your protagonist!

Who is the main character of your story? Tell me about them - their name, what they want, what's holding them back. What makes them interesting?`,
    antagonist: `Time to develop your antagonist!

Who or what stands in your protagonist's way? Remember, the best antagonists believe they're doing the right thing. Tell me about the opposition in your story.`,
    world: `Let's build your world!

Where and when does your story take place? Describe the setting, the atmosphere, any special rules (magic systems, technology, society). What locations are important to the story?`,
    conflict: `Now let's define the central conflict!

What's at stake? What must your protagonist overcome? What happens if they fail? What obstacles will they face along the way?`,
    themes: `Finally, let's explore your themes!

What deeper questions does your story explore? What truth or message do you want readers to take away? How will these themes manifest through your characters' journeys?`
  };
  
  return messages[topic];
}

export default FrameworkBuilder;
