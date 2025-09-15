import { useState, useCallback, useEffect } from 'react'
import { Editor } from '@tiptap/react'

export interface Chapter {
  id: string
  title: string
  level: number
  wordCount: number
  status: 'draft' | 'in-progress' | 'complete' | 'needs-review'
  position: number
  isActive: boolean
}

export interface ChapterNavigationState {
  chapters: Chapter[]
  isOpen: boolean
  activeChapterId: string | null
  totalWordCount: number
}

export const useChapterNavigation = (editor?: Editor) => {
  const [isOpen, setIsOpen] = useState(false)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)

  // Extract chapters from editor content
  const extractChapters = useCallback(() => {
    if (!editor) return []

    const doc = editor.state.doc
    const extractedChapters: Chapter[] = []
    let chapterCounter = 0

    doc.descendants((node, pos) => {
      if (node.type.name === 'heading' && node.attrs.level <= 2) {
        chapterCounter++
        const title = node.textContent || `Chapter ${chapterCounter}`
        
        // Calculate word count for this section (rough estimate)
        let wordCount = 0
        let nextHeadingPos = doc.nodeSize - 2 // End of document
        
        // Find next heading to calculate word count
        doc.nodesBetween(pos, doc.nodeSize - 2, (nextNode, nextPos) => {
          if (nextNode.type.name === 'heading' && nextNode.attrs.level <= 2 && nextPos > pos) {
            nextHeadingPos = nextPos
            return false // Stop iteration
          }
        })
        
        // Count words between this heading and the next
        doc.nodesBetween(pos, nextHeadingPos, (textNode) => {
          if (textNode.isText) {
            wordCount += textNode.text?.split(/\s+/).filter(word => word.length > 0).length || 0
          }
        })

        extractedChapters.push({
          id: `chapter-${chapterCounter}`,
          title,
          level: node.attrs.level,
          wordCount,
          status: wordCount === 0 ? 'draft' : wordCount < 500 ? 'in-progress' : 'complete',
          position: pos,
          isActive: false
        })
      }
    })

    return extractedChapters
  }, [editor])

  // Update chapters when editor content changes
  useEffect(() => {
    if (!editor) return

    const updateChapters = () => {
      const newChapters = extractChapters()
      setChapters(newChapters)
    }

    // Initial extraction
    updateChapters()

    // Listen for content changes
    const handleUpdate = () => {
      updateChapters()
    }

    editor.on('update', handleUpdate)
    
    return () => {
      editor.off('update', handleUpdate)
    }
  }, [editor, extractChapters])

  // Update active chapter based on cursor position
  useEffect(() => {
    if (!editor) return

    const updateActiveChapter = () => {
      const currentPos = editor.state.selection.from
      let newActiveChapterId: string | null = null

      // Find which chapter contains the current cursor position
      for (let i = chapters.length - 1; i >= 0; i--) {
        if (currentPos >= chapters[i].position) {
          newActiveChapterId = chapters[i].id
          break
        }
      }

      if (newActiveChapterId !== activeChapterId) {
        setActiveChapterId(newActiveChapterId)
        
        // Update chapters with active state
        setChapters(prev => prev.map(chapter => ({
          ...chapter,
          isActive: chapter.id === newActiveChapterId
        })))
      }
    }

    const handleSelectionUpdate = () => {
      updateActiveChapter()
    }

    editor.on('selectionUpdate', handleSelectionUpdate)
    
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [editor, chapters, activeChapterId])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  const jumpToChapter = useCallback((chapter: Chapter) => {
    if (!editor) return
    
    // Jump to the chapter position in the editor
    editor.commands.focus()
    editor.commands.setTextSelection(chapter.position)
    
    // Scroll the chapter into view
    const element = editor.view.domAtPos(chapter.position).node as HTMLElement
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [editor])

  const addChapter = useCallback((title: string, position?: number) => {
    if (!editor) return

    const insertPos = position || editor.state.selection.to
    const chapterNumber = chapters.length + 1
    const chapterTitle = title || `Chapter ${chapterNumber}`

    // Insert a new heading at the specified position
    editor.chain()
      .focus()
      .setTextSelection(insertPos)
      .insertContent(`\n\n# ${chapterTitle}\n\n`)
      .run()
  }, [editor, chapters.length])

  const totalWordCount = chapters.reduce((total, chapter) => total + chapter.wordCount, 0)

  return {
    isOpen,
    chapters,
    activeChapterId,
    totalWordCount,
    open,
    close,
    toggle,
    jumpToChapter,
    addChapter
  }
}