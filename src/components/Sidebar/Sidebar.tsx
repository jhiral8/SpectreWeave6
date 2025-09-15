import { cn } from '@/lib/utils'
import { memo, useCallback, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { ChapterNavigationPanel, type Chapter } from '../ChapterNavigation/ChapterNavigationPanel'
// import { TableOfContents } from '../TableOfContents'

export const Sidebar = memo(
  ({ 
    editor, 
    isOpen, 
    onClose, 
    chapters = [], 
    activeChapterId, 
    totalWordCount = 0, 
    onJumpToChapter, 
    onAddChapter 
  }: { 
    editor: Editor; 
    isOpen?: boolean; 
    onClose: () => void;
    chapters?: Chapter[];
    activeChapterId?: string;
    totalWordCount?: number;
    onJumpToChapter?: (chapterId: string) => void;
    onAddChapter?: () => void;
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
      'bg-[--background] text-[--foreground] transition-all duration-200',
      'lg:bg-[--background] lg:backdrop-blur-xl',
      'border-r border-[--border]',
      'h-full flex-shrink-0', // Take full height of parent, don't shrink
      // Responsive width behavior
      !isOpen && 'w-0 border-r-transparent overflow-hidden',
      isOpen && [
        'w-[92vw] mx-2 lg:w-80 lg:mx-0',
        'overflow-y-auto overflow-x-hidden transition-transform duration-200 will-change-transform'
      ],
      // Mobile overlay positioning only
      'lg:sticky lg:top-14 lg:h-[calc(100vh-56px)] lg:z-auto', // Desktop: stick below portal bar
      'fixed lg:sticky left-0 top-14 lg:top-14 z-[999] h-[calc(100vh-56px)] lg:h-[calc(100vh-56px)]' // Mobile: overlay below header; Desktop: sticky under header
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
          className={cn(windowClassName, 'sidebar-container')}
          role="complementary"
          aria-label="Chapter navigation sidebar"
          aria-hidden={!isOpen}
        >
          <div className="w-full h-full flex flex-col min-h-0 p-0 m-0">
            {/* Mobile close button */}
            <div className="lg:hidden flex justify-end p-0 border-b border-[--border] flex-shrink-0">
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Close sidebar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Chapter Navigation Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="h-full">
                <div className="p-4 space-y-4">
                  {/* Title Header with Divider */}
                    <div className="pb-3 border-b border-[--border]">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base text-[--foreground]" style={{ fontFamily: 'Surgena, sans-serif' }}>
                        Chapters
                      </h2>
                        <div className="text-xs text-[--muted-foreground]">
                        {totalWordCount.toLocaleString()} words
                      </div>
                    </div>
                  </div>
                  
                  {/* Add Chapter Button */}
                  {onAddChapter && (
                    <button
                      onClick={onAddChapter}
                       className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-[--border] rounded-lg hover:bg-[color-mix(in_srgb,var(--brand)_5%,transparent)] transition-colors group"
                    >
                      <svg className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                        Add Chapter
                      </span>
                    </button>
                  )}
                </div>
                
                {/* Scrollable Chapter List */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
                  {chapters.length > 0 ? (
                    <div className="space-y-2">
                      {chapters.map((chapter, index) => {
                        const isActive = chapter.id === activeChapterId
                        
                        return (
                          <div
                            key={chapter.id}
                            onClick={() => onJumpToChapter?.(chapter.id)}
                            className={cn(
                              'group cursor-pointer rounded-lg p-3 transition-all duration-200 border',
                              isActive
                                ? 'bg-white/10 border-[--border]'
                                : 'bg-[--card] border-[--border] hover:bg-white/5'
                            )}
                          >
                            {/* Chapter Header */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className={cn(
                                   'text-xs font-medium px-2 py-1 rounded-full flex-shrink-0',
                                  isActive
                                     ? 'bg-[color-mix(in_srgb,var(--brand)_20%,transparent)] text-[--foreground]'
                                     : 'bg-[--muted] text-[--muted-foreground]'
                                )}>
                                  {index + 1}
                                </span>
                                <span className={cn(
                                  'text-xs font-medium truncate',
                                  isActive
                                    ? 'text-[--foreground]'
                                    : 'text-[--muted-foreground]'
                                )}>
                                  Chapter {index + 1}
                                </span>
                              </div>
                              
                              {/* Status Badge */}
                              <div className={cn(
                                'w-2 h-2 rounded-full flex-shrink-0',
                                chapter.status === 'completed' ? 'bg-green-500' :
                                chapter.status === 'in-progress' ? 'bg-yellow-500' :
                                'bg-neutral-300 dark:bg-neutral-600'
                              )} />
                            </div>
                            
                            {/* Chapter Title */}
                              <h3 className={cn(
                              'text-sm font-medium mb-2 line-clamp-2',
                              isActive
                                 ? 'text-[--foreground]'
                                 : 'text-[--muted-foreground] group-hover:text-[--foreground]'
                            )}>
                              {chapter.title}
                            </h3>
                            
                            {/* Word Count */}
                            <div className="flex items-center justify-between text-xs">
                              <span className={cn(
                                isActive
                                  ? 'text-[--foreground]'
                                  : 'text-[--muted-foreground]'
                              )}>
                                {chapter.wordCount.toLocaleString()} words
                              </span>
                              
                              {/* Progress indicator */}
                              {chapter.wordCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className={cn(
                                    'w-1 h-1 rounded-full',
                                    chapter.status === 'completed' ? 'bg-green-500' :
                                    chapter.status === 'in-progress' ? 'bg-yellow-500' :
                                    'bg-neutral-300 dark:bg-neutral-600'
                                  )} />
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                        No chapters yet
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-48">
                        Start writing or add headings to your document to see chapters appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </>
    )
  },
)

Sidebar.displayName = 'ChapterNavigationSidebar'
