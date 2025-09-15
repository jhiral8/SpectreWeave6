import { useEffect, useRef } from 'react'
import { Editor } from '@tiptap/react'
import { AIChatSidebarState } from '@/hooks/useAIChatSidebar'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'

interface ChatInterfaceProps {
  chatState: AIChatSidebarState
  onClose: () => void
  editor: Editor
}

export const ChatInterface = ({ chatState, onClose, editor }: ChatInterfaceProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatState.messages])

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      chatState.clearChat()
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-[--background] text-[--foreground]">
      {/* Chat header - matches main header height */}
      <div className="flex-shrink-0 py-1 px-3 border-b border-[--border]">
        <div className="flex items-center justify-center min-h-[40px] relative">
          <h3 className="text-base text-[--foreground]" style={{ fontFamily: 'Surgena, sans-serif' }}>
            AI Writing Assistant
          </h3>
          
          {chatState.messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="absolute right-0 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Clear chat"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0 pb-16 sm:pb-4">
        {chatState.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-full bg-[color-mix(in_srgb,var(--brand)_20%,transparent)] flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 dark:text-blue-400">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h4 className="font-medium text-sm text-[--foreground] mb-2">
              Start a conversation
            </h4>
            <p className="text-xs text-[--muted-foreground] max-w-xs">
              Ask me anything about writing, get suggestions for improvements, or discuss your ideas.
            </p>
            
            {/* Quick start suggestions */}
            <div className="mt-6 space-y-2 w-full max-w-xs">
              <button
                onClick={() => chatState.sendMessage("Help me improve my writing style")}
                className="w-full text-left text-xs p-2 rounded-lg bg-[--muted] hover:bg-white/5 transition-colors text-[--foreground]"
              >
                💡 Help me improve my writing style
              </button>
              <button
                onClick={() => chatState.sendMessage("Give me some writing prompts")}
                className="w-full text-left text-xs p-2 rounded-lg bg-[--muted] hover:bg-white/5 transition-colors text-[--foreground]"
              >
                ✨ Give me some writing prompts
              </button>
              <button
                onClick={() => chatState.sendMessage("How can I make my content more engaging?")}
                className="w-full text-left text-xs p-2 rounded-lg bg-[--muted] hover:bg-white/5 transition-colors text-[--foreground]"
              >
                🎯 How can I make my content more engaging?
              </button>
            </div>
          </div>
        ) : (
          <>
            {chatState.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 p-4 border-t border-[--border]">
        <ChatInput
          onSend={chatState.sendMessage}
          disabled={chatState.isLoading}
          placeholder="Ask AI anything..."
        />
      </div>
    </div>
  )
}