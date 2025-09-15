import { cn } from '@/lib/utils'
import { memo, useCallback, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { ChatInterface } from './components/ChatInterface'
import { AIChatSidebarState } from '@/hooks/useAIChatSidebar'

export const AIChatSidebar = memo(
  ({ 
    editor, 
    isOpen, 
    onClose,
    chatState 
  }: { 
    editor: Editor
    isOpen?: boolean
    onClose: () => void
    chatState: AIChatSidebarState
  }) => {
    const handlePotentialClose = useCallback(() => {
      if (window.innerWidth < 1024) {
        onClose()
      }
    }, [onClose])

    // Mobile overlay backdrop - only for mobile
    const backdropClassName = cn(
      'fixed left-0 right-0 top-14 bottom-0 bg-black/20 backdrop-blur-sm z-[998] lg:hidden transition-opacity duration-300',
      isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    )

    const windowClassName = cn(
      // Base responsive sidebar - not fixed positioned
      'bg-[--background] text-[--foreground] transition-all duration-300',
      'border-l border-[--border]', // Left border instead of right
      'h-full flex-shrink-0 flex-grow-0', // Take full height of parent, don't shrink or grow
      // Responsive width behavior with explicit flex basis
      !isOpen && 'w-0 basis-0 border-l-transparent overflow-hidden',
      isOpen && [
        'w-[92vw] mx-2 lg:w-80 lg:mx-0 basis-[92vw] lg:basis-80',
        'overflow-y-auto overflow-x-hidden transition-transform duration-200 will-change-transform'
      ]
    )

    // Handle click outside to close on mobile
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    }, [onClose])

    // Handle escape key and body scroll
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
          onClose()
        }
      }
      
      if (isOpen) {
        document.addEventListener('keydown', handleEscape)
        // Prevent body scroll on mobile when sidebar is open
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          document.body.style.overflow = 'hidden'
        }
      } else {
        document.body.style.overflow = ''
      }

      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = ''
      }
    }, [isOpen, onClose])

    return (
      <>
        {/* Mobile backdrop - only rendered on mobile */}
        {typeof window !== 'undefined' && window.innerWidth < 1024 && (
          <div 
            className={backdropClassName} 
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
        )}
        
        <aside 
          className={cn(windowClassName, 'ai-chat-sidebar-container fixed lg:sticky top-14 lg:top-14 h-[calc(100vh-56px)] lg:h-[calc(100vh-56px)]')}
          role="complementary"
          aria-label="AI chat sidebar"
          aria-hidden={!isOpen}
        >
          <div className="w-full h-full flex flex-col min-h-0 p-0 m-0">
            {/* Mobile close button - positioned on left for right sidebar */}
            <div className="lg:hidden flex justify-start p-3 border-b border-[--border] flex-shrink-0 bg-[--card] text-[--card-foreground]">
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Close AI chat sidebar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Chat interface */}
            <ChatInterface 
              chatState={chatState}
              onClose={handlePotentialClose}
              editor={editor}
            />
          </div>
        </aside>
      </>
    )
  },
)

AIChatSidebar.displayName = 'AIChatSidebar'