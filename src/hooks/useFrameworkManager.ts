import { useState, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { WritingFramework } from '@/types/story-frameworks'
import { markdownToHtml } from '@/lib/utils/markdownToHtml'

interface PendingFramework {
  framework: WritingFramework
  hasContent: boolean
}

interface UseFrameworkManagerProps {
  frameworkEditor: Editor | null
}

export const useFrameworkManager = ({ 
  frameworkEditor
}: UseFrameworkManagerProps) => {
  const [activeFramework, setActiveFramework] = useState<string | undefined>(undefined)
  const [lastAppliedFramework, setLastAppliedFramework] = useState<WritingFramework | null>(null)
  const [pendingFramework, setPendingFramework] = useState<PendingFramework | null>(null)

  const applyFramework = useCallback((framework: WritingFramework) => {
    if (!frameworkEditor) return

    // Check if there's existing content and confirm before overwriting
    const currentContent = frameworkEditor.getHTML()
    const hasContent = currentContent && currentContent.trim() !== '' && currentContent !== '<p></p>'
    
    if (hasContent) {
      // Set pending framework to trigger modal
      setPendingFramework({ framework, hasContent: true })
      return
    }

    // Apply immediately if no content
    doApplyFramework(framework)
  }, [frameworkEditor])

  const doApplyFramework = useCallback((framework: WritingFramework) => {
    if (!frameworkEditor) return

    // Track the framework
    setActiveFramework(framework.id)
    setLastAppliedFramework(framework)

    // Convert markdown template to HTML and apply content
    const htmlContent = markdownToHtml(framework.template)
    frameworkEditor.commands.setContent(htmlContent)
    
    // Don't automatically focus or switch surfaces - just insert content
    // This prevents interference with text selections in other editors
  }, [frameworkEditor])

  const confirmFramework = useCallback(() => {
    if (pendingFramework) {
      doApplyFramework(pendingFramework.framework)
      setPendingFramework(null)
    }
  }, [pendingFramework, doApplyFramework])

  const cancelFramework = useCallback(() => {
    setPendingFramework(null)
  }, [])

  const clearFramework = useCallback(() => {
    if (!frameworkEditor) return

    // Clear state
    setActiveFramework(undefined)
    setLastAppliedFramework(null)

    // Clear editor content without focusing
    frameworkEditor.commands.clearContent()
  }, [frameworkEditor])

  const reapplyFramework = useCallback(() => {
    if (lastAppliedFramework) {
      applyFramework(lastAppliedFramework)
    }
  }, [lastAppliedFramework, applyFramework])

  const hasActiveFramework = activeFramework !== undefined
  const canReapply = lastAppliedFramework !== null

  return {
    activeFramework,
    lastAppliedFramework,
    hasActiveFramework,
    canReapply,
    applyFramework,
    clearFramework,
    reapplyFramework,
    // Modal state
    pendingFramework,
    confirmFramework,
    cancelFramework,
  }
}