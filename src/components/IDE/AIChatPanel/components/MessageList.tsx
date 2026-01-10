'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MessageBubble } from './MessageBubble';
import { TIMING } from '../constants';
import type { MessageListProps } from '../types';

/**
 * Scrollable list of chat messages
 *
 * Features:
 * - Auto-scroll to bottom on new messages
 * - Virtualization-ready structure (future optimization)
 */
export function MessageList({
  messages,
  onInsert,
  onCopy,
  onRegenerate,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to bottom when messages change
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, TIMING.autoScrollDelay);

    return () => clearTimeout(timer);
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        'flex-1 overflow-y-auto',
        'scrollbar-thin scrollbar-thumb-[var(--ide-border)] scrollbar-track-transparent'
      )}
    >
      <div className="flex flex-col">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onInsert={onInsert}
            onCopy={onCopy}
            onRegenerate={onRegenerate}
          />
        ))}
        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
