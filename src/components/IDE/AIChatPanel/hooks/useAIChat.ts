'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { useAI } from '@/hooks/useAI';
import type {
  ChatContext,
  UseAIChatOptions,
  UseAIChatReturn,
  UseChatHistoryReturn,
} from '../types';

/**
 * Build a prompt with context for the AI
 */
function buildPromptWithContext(content: string, context?: ChatContext): string {
  const contextParts: string[] = [];

  if (context?.chapter) {
    contextParts.push(`Current chapter: ${context.chapter}`);
  }

  if (context?.scene) {
    contextParts.push(`Current scene: ${context.scene}`);
  }

  if (context?.characters && context.characters.length > 0) {
    contextParts.push(`Characters in scene: ${context.characters.join(', ')}`);
  }

  if (context?.selectedText) {
    contextParts.push(`Selected text: "${context.selectedText}"`);
  }

  if (contextParts.length === 0) {
    return content;
  }

  const contextString = contextParts.join('\n');
  return `[Context]\n${contextString}\n\n[User Request]\n${content}`;
}

interface UseAIChatProps extends UseAIChatOptions {
  /** Chat history instance to use */
  chatHistory: UseChatHistoryReturn;
}

/**
 * Hook for AI chat interactions with streaming support
 *
 * Wraps the base useAI hook with chat-specific logic including:
 * - Message history integration
 * - Context injection
 * - Streaming response handling
 * - Regeneration support
 */
export function useAIChat({
  chatHistory,
  onError,
  onComplete,
}: UseAIChatProps): UseAIChatReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);

  const { streamText } = useAI({
    provider: 'gemini',
    enableStreaming: true,
    onError: (error: Error | unknown) => {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    },
  });

  const { addMessage, updateMessage, getMessage } = chatHistory;

  /**
   * Process a streaming response and update the message
   */
  const processStream = useCallback(
    async (stream: ReadableStream<Uint8Array>, messageId: string) => {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          updateMessage(messageId, {
            content: fullContent,
          });
        }

        // Mark as complete
        updateMessage(messageId, {
          isGenerating: false,
        });

        onComplete?.(fullContent);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          // Cancelled by user - mark as complete with partial content
          updateMessage(messageId, {
            isGenerating: false,
          });
        } else {
          updateMessage(messageId, {
            isGenerating: false,
            isError: true,
            content: fullContent || 'Failed to generate response. Please try again.',
          });
          throw error;
        }
      } finally {
        reader.releaseLock();
      }
    },
    [updateMessage, onComplete]
  );

  /**
   * Send a message and get a streamed AI response
   */
  const sendMessage = useCallback(
    async (content: string, context?: ChatContext): Promise<void> => {
      if (isGenerating) return;

      // Cancel any existing request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsGenerating(true);

      try {
        // Add user message
        addMessage({
          role: 'user',
          content,
          context,
        });

        // Add placeholder AI message
        const aiMessageId = addMessage({
          role: 'assistant',
          content: '',
          isGenerating: true,
          originalPrompt: content,
        });
        currentMessageIdRef.current = aiMessageId;

        // Build prompt with context
        const promptWithContext = buildPromptWithContext(content, context);

        // Start streaming
        const streamResponse = await streamText(promptWithContext);
        await processStream(streamResponse.stream, aiMessageId);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          onError?.(error instanceof Error ? error : new Error(String(error)));
        }
      } finally {
        setIsGenerating(false);
        currentMessageIdRef.current = null;
      }
    },
    [isGenerating, addMessage, streamText, processStream, onError]
  );

  /**
   * Regenerate a specific AI message
   */
  const regenerate = useCallback(
    async (messageId: string): Promise<void> => {
      if (isGenerating) return;

      const message = getMessage(messageId);
      if (!message || message.role !== 'assistant') return;

      const originalPrompt = message.originalPrompt;
      if (!originalPrompt) return;

      // Cancel any existing request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsGenerating(true);

      try {
        // Reset the message for regeneration
        updateMessage(messageId, {
          content: '',
          isGenerating: true,
          isError: false,
        });
        currentMessageIdRef.current = messageId;

        // Start streaming
        const streamResponse = await streamText(originalPrompt);
        await processStream(streamResponse.stream, messageId);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          onError?.(error instanceof Error ? error : new Error(String(error)));
        }
      } finally {
        setIsGenerating(false);
        currentMessageIdRef.current = null;
      }
    },
    [isGenerating, getMessage, updateMessage, streamText, processStream, onError]
  );

  /**
   * Cancel the current generation
   */
  const cancel = useCallback((): void => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);

    // Mark current message as not generating
    if (currentMessageIdRef.current) {
      updateMessage(currentMessageIdRef.current, {
        isGenerating: false,
      });
      currentMessageIdRef.current = null;
    }
  }, [updateMessage]);

  return useMemo(
    () => ({
      sendMessage,
      regenerate,
      isGenerating,
      cancel,
    }),
    [sendMessage, regenerate, isGenerating, cancel]
  );
}
