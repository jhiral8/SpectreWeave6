import { useState, useCallback, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export const ChatInput = ({ 
  onSend, 
  disabled = false, 
  placeholder = "Ask AI anything..." 
}: ChatInputProps) => {
  const [message, setMessage] = useState('')

  const handleSend = useCallback(() => {
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
    }
  }, [message, onSend, disabled])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex space-x-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex-1 resize-none rounded-lg border border-[--border]',
            'bg-[--card] px-3 py-2 text-xs',
            'text-[--card-foreground] placeholder-[--muted-foreground]',
            'focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand)_40%,transparent)] focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[36px] max-h-[108px]'
          )}
          rows={1}
        />
        
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className={cn(
            'flex-shrink-0 px-3 py-2 rounded-lg font-medium text-xs transition-colors',
            'bg-[color-mix(in_srgb,var(--brand)_50%,transparent)] hover:bg-[color-mix(in_srgb,var(--brand)_65%,transparent)] text-white',
            'focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand)_40%,transparent)] focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center justify-center min-w-[54px]'
          )}
        >
          {disabled ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          )}
        </button>
      </div>
      
      <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  )
}