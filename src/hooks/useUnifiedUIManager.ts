'use client'

import { useCallback, useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLeftNavigation } from './useLeftNavigation'

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  isLoading?: boolean
}

/**
 * Unified UI Manager - Consolidates all UI state management
 * Replaces: useSidebar + useAIChatSidebar + useSidebarState
 */
export const useUnifiedUIManager = () => {
  // Left sidebar state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  
  // AI chat sidebar state
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messageIdCounter = useRef(0)
  
  // Left navigation (already optimized, just include it)
  const leftNavigation = useLeftNavigation()

  // Left sidebar actions
  const leftSidebar = useMemo(() => ({
    isOpen: leftSidebarOpen,
    open: () => setLeftSidebarOpen(true),
    close: () => setLeftSidebarOpen(false),
    toggle: () => setLeftSidebarOpen(prev => !prev)
  }), [leftSidebarOpen])

  // AI chat actions
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    setIsLoading(true)
    setError(null)
    setIsStreaming(true)

    // Generate unique IDs
    messageIdCounter.current += 1
    const userMessageId = `user-${messageIdCounter.current}`
    messageIdCounter.current += 1
    const loadingMessageId = `assistant-${messageIdCounter.current}`
    
    const userMessage: ChatMessage = {
      id: userMessageId,
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
    }

    const loadingMessage: ChatMessage = {
      id: loadingMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isLoading: true,
    }

    // Add user message and loading message
    setMessages(prev => [...prev, userMessage, loadingMessage])

    try {
      // Get the auth token from Supabase
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === loadingMessageId
              ? { ...msg, content: 'Please log in to use AI chat. Click the login button in the top toolbar.', isLoading: false }
              : msg
          )
        )
        return
      }
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          messages: [userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to send message`)
      }

      const data = await response.json()
      const aiResponse = data.result?.data || data.result?.content || data.result || 'No response'

      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessageId
            ? { ...msg, content: aiResponse, isLoading: false }
            : msg
        )
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error sending message:', error)
      setError(errorMessage)
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessageId
            ? { ...msg, content: 'Sorry, I encountered an error. Please try again.', isLoading: false }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }, [isLoading])

  const aiChatSidebar = useMemo(() => ({
    isOpen: aiChatOpen,
    messages,
    isLoading,
    isStreaming,
    error,
    open: () => setAiChatOpen(true),
    close: () => setAiChatOpen(false),
    toggle: () => setAiChatOpen(prev => !prev),
    sendMessage,
    clearChat: () => {
      setMessages([])
      setError(null)
    }
  }), [aiChatOpen, messages, isLoading, isStreaming, error, sendMessage])

  return {
    leftSidebar,
    aiChatSidebar,
    leftNavigation
  }
}

export default useUnifiedUIManager