import { cn } from '@/lib/utils'
import { memo } from 'react'
import { Editor } from '@tiptap/react'
import { Chapter } from '@/hooks/useChapterNavigation'
import { Icon } from '@/components/ui/Icon'

interface ChapterNavigationPanelProps {
  isOpen: boolean
  onClose: () => void
  chapters: Chapter[]
  activeChapterId: string | null
  totalWordCount: number
  onJumpToChapter: (chapter: Chapter) => void
  onAddChapter: (title: string) => void
  editor: Editor
}

const ChapterStatusBadge = ({ status }: { status: Chapter['status'] }) => {
  const statusConfig = {
    'draft': { icon: 'FileText', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' },
    'in-progress': { icon: 'Clock', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900' },
    'complete': { icon: 'CheckCircle', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900' },
    'needs-review': { icon: 'AlertCircle', color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900' }
  }

  const config = statusConfig[status]

  return (
    <div className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs', config.bg, config.color)}>
      <Icon name={config.icon as any} className="w-3 h-3" />
      <span className="capitalize">{status.replace('-', ' ')}</span>
    </div>
  )
}

const ChapterItem = memo(({ 
  chapter, 
  isActive, 
  onClick 
}: { 
  chapter: Chapter
  isActive: boolean
  onClick: () => void 
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-lg p-3 transition-all duration-200',
        'hover:bg-neutral-50 dark:hover:bg-neutral-800',
        isActive && 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            'font-medium text-sm truncate',
            isActive ? 'text-blue-900 dark:text-blue-100' : 'text-neutral-900 dark:text-white'
          )} style={{ fontFamily: 'Surgena, sans-serif' }}>
            {chapter.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {chapter.wordCount.toLocaleString()} words
            </span>
            {chapter.level === 1 && (
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Ch. {chapter.id.split('-')[1]}
              </span>
            )}
          </div>
        </div>
        <ChapterStatusBadge status={chapter.status} />
      </div>
    </div>
  )
})

ChapterItem.displayName = 'ChapterItem'

export const ChapterNavigationPanel = memo(({
  isOpen,
  onClose,
  chapters,
  activeChapterId,
  totalWordCount,
  onJumpToChapter,
  onAddChapter,
  editor
}: ChapterNavigationPanelProps) => {
  const handleAddChapter = () => {
    const chapterNumber = chapters.length + 1
    onAddChapter(`Chapter ${chapterNumber}`)
  }

  const statusCounts = chapters.reduce((acc, chapter) => {
    acc[chapter.status] = (acc[chapter.status] || 0) + 1
    return acc
  }, {} as Record<Chapter['status'], number>)

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Chapter navigation panel */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-white/30 backdrop-blur-xl border-r border-neutral-200',
          'dark:bg-black/30 dark:border-neutral-800 z-50 lg:z-0',
          'transition-transform duration-300 ease-in-out',
          'lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:border-r-0',
          'w-[280px] lg:flex-shrink-0'
        )}
        role="complementary"
        aria-label="Chapter navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex-shrink-0 py-3 px-4 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-sm text-neutral-900 dark:text-white" style={{ fontFamily: 'Surgena, sans-serif' }}>
                Manuscript Navigator
              </h2>
              <button
                onClick={onClose}
                className="lg:hidden p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Close chapter navigation"
              >
                <Icon name="X" className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Manuscript overview */}
          <div className="flex-shrink-0 p-4 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
              <div className="flex justify-between">
                <span>Chapters:</span>
                <span className="font-medium">{chapters.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total words:</span>
                <span className="font-medium">{totalWordCount.toLocaleString()}</span>
              </div>
              {Object.entries(statusCounts).length > 0 && (
                <div className="flex gap-3 mt-2 text-[10px]">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <span key={status} className="flex items-center gap-1">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        status === 'draft' && 'bg-gray-400',
                        status === 'in-progress' && 'bg-orange-400',
                        status === 'complete' && 'bg-green-400',
                        status === 'needs-review' && 'bg-yellow-400'
                      )} />
                      {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chapters list */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
            {chapters.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                  <Icon name="FileText" className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="font-medium text-sm text-neutral-900 dark:text-white mb-2">
                  No chapters yet
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                  Start writing or add headings to see your manuscript structure
                </p>
                <button
                  onClick={handleAddChapter}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
                >
                  Add First Chapter
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {chapters.map((chapter) => (
                  <ChapterItem
                    key={chapter.id}
                    chapter={chapter}
                    isActive={chapter.id === activeChapterId}
                    onClick={() => onJumpToChapter(chapter)}
                  />
                ))}
                
                {/* Add chapter button */}
                <button
                  onClick={handleAddChapter}
                  className="w-full p-3 rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
                >
                  <div className="flex items-center justify-center gap-2 text-neutral-500 dark:text-neutral-400 group-hover:text-blue-500">
                    <Icon name="Plus" className="w-4 h-4" />
                    <span className="text-xs">Add Chapter</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
})

ChapterNavigationPanel.displayName = 'ChapterNavigationPanel'