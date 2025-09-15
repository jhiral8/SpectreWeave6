import { useCallback, useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Editor } from '@tiptap/react'

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  isLoading?: boolean
}

export type AIChatSidebarState = {
  isOpen: boolean
  messages: ChatMessage[]
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  open: () => void
  close: () => void
  toggle: () => void
  sendMessage: (content: string) => Promise<void>
  clearChat: () => void
}

interface UseAIChatSidebarOptions {
  manuscriptEditor?: Editor | null
  frameworkEditor?: Editor | null
}

export const useAIChatSidebar = (options?: UseAIChatSidebarOptions): AIChatSidebarState => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messageIdCounter = useRef(0)

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  // Helper function to extract editor content
  const getContextContent = useCallback(() => {
    const context = []
    
    // Add manuscript content if available
    if (options?.manuscriptEditor && !options.manuscriptEditor.isEmpty) {
      const manuscriptContent = options.manuscriptEditor.getText()
      if (manuscriptContent.trim()) {
        context.push(`**Manuscript Content:**\n${manuscriptContent}`)
      }
    }
    
    // Add framework content if available
    if (options?.frameworkEditor && !options.frameworkEditor.isEmpty) {
      const frameworkContent = options.frameworkEditor.getText()
      if (frameworkContent.trim()) {
        context.push(`**Story Framework:**\n${frameworkContent}`)
      }
    }
    
    return context.length > 0 ? context.join('\n\n') : null
  }, [options?.manuscriptEditor, options?.frameworkEditor])

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
      
      // Get context content from editors
      const contextContent = getContextContent()
      
      // Prepare messages for API
      const messagesToSend = []
      
      // Add system message with context if available
      if (contextContent) {
        messagesToSend.push({
          role: 'system',
          content: `You are an AI writing assistant. The user is working on a writing project. Here is the current content for context:

${contextContent}

Please provide helpful, context-aware responses based on this content. When referencing the content, be specific and relevant to what the user has written.`
        })
      }
      
      // Add user message
      messagesToSend.push({
        role: 'user',
        content: content.trim()
      })

      console.log('🤖 AI Chat - Sending with context:', { 
        hasContext: !!contextContent,
        contextLength: contextContent?.length || 0,
        userMessage: content.trim()
      })
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          messages: messagesToSend,
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
  }, [isLoading, getContextContent])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  // Memoize the returned object to prevent unnecessary re-renders
  // Only depend on primitive state values, not the functions (useCallback handles function stability)
  return useMemo(() => ({
    isOpen,
    messages,
    isLoading,
    isStreaming,
    error,
    open,
    close,
    toggle,
    sendMessage,
    clearChat,
  }), [isOpen, messages, isLoading, isStreaming, error])
}