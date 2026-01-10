'use client';

import { useState, useCallback, useMemo } from 'react';
import type { ChatMessage, UseChatHistoryReturn } from '../types';

/**
 * Generate a unique ID for messages
 */
function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Hook for managing chat message history
 *
 * Provides CRUD operations for messages with immutable state updates.
 * Messages are stored in session only (not persisted).
 */
export function useChatHistory(): UseChatHistoryReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  /**
   * Add a new message to the history
   * @returns The generated message ID
   */
  const addMessage = useCallback(
    (message: Omit<ChatMessage, 'id' | 'timestamp'>): string => {
      const id = generateId();
      const newMessage: ChatMessage = {
        ...message,
        id,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);
      return id;
    },
    []
  );

  /**
   * Update an existing message by ID
   */
  const updateMessage = useCallback(
    (id: string, update: Partial<ChatMessage>): void => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, ...update } : msg))
      );
    },
    []
  );

  /**
   * Remove a message by ID
   */
  const removeMessage = useCallback((id: string): void => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  /**
   * Clear all messages
   */
  const clearHistory = useCallback((): void => {
    setMessages([]);
  }, []);

  /**
   * Get a message by ID
   */
  const getMessage = useCallback(
    (id: string): ChatMessage | undefined => {
      return messages.find((msg) => msg.id === id);
    },
    [messages]
  );

  return useMemo(
    () => ({
      messages,
      addMessage,
      updateMessage,
      removeMessage,
      clearHistory,
      getMessage,
    }),
    [messages, addMessage, updateMessage, removeMessage, clearHistory, getMessage]
  );
}
