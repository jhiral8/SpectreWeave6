'use client'

import React, { Suspense } from 'react'
import { useDualEditor } from '../context/SplitEditorContext'
import dynamic from 'next/dynamic'

// Lazy load menu components with better chunking
const TextMenu = dynamic(() => import('@/components/menus/TextMenu').then(mod => ({ default: mod.TextMenu })), {
  loading: () => <div className="animate-pulse w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
})

const CustomAIToolbar = dynamic(() => import('@/components/editor/AIToolbar/CustomAIToolbar').then(mod => ({ default: mod.CustomAIToolbar })), {
  loading: () => <div className="animate-pulse w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
})

// Advanced menus - only load when editor has content or user interacts
const AdvancedMenus = dynamic(() => import('./AdvancedMenusBundle'), {
  loading: () => null
})

const LinkMenu = dynamic(() => import('@/components/menus').then(mod => ({ default: mod.LinkMenu })))
const ContentItemMenu = dynamic(() => import('@/components/menus/ContentItemMenu').then(mod => ({ default: mod.ContentItemMenu })))

export const OptimizedMenuManager = React.memo(() => {
  const { 
    currentActiveEditor, 
    viewMode, 
    manuscriptEditor, 
    frameworkEditor,
    activeEditor,
    activeSurface,
    menuContainerRef 
  } = useDualEditor()

  // Debug logging
  React.useEffect(() => {
    const handleSelection = () => {
      if (currentActiveEditor) {
        const { from, to, empty } = currentActiveEditor.state.selection
        const selectedText = !empty ? currentActiveEditor.state.doc.textBetween(from, to, ' ') : ''
      }
    }

    if (currentActiveEditor) {
      currentActiveEditor.on('selectionUpdate', handleSelection)
      
      return () => {
        currentActiveEditor.off('selectionUpdate', handleSelection)
      }
    }
  }, [currentActiveEditor, viewMode])

  // Don't render menus if no editor is available
  if (!currentActiveEditor) {
    return null
  }

  // Check if we need advanced menus (user has typed content)
  const hasContent = React.useMemo(() => {
    if (!currentActiveEditor) return false
    const doc = currentActiveEditor.state.doc
    return doc.textContent.length > 0
  }, [currentActiveEditor])

  // Log which editor we're rendering menus for

  return (
    <>
      {/* Core menus - render for both editors if they exist */}
      <Suspense fallback={<div className="flex gap-2 p-2">
        <div className="animate-pulse w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="animate-pulse w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>}>
        {/* Render TextMenu for manuscript editor if it exists */}
        {manuscriptEditor && (
          <TextMenu key="manuscript-text-menu" editor={manuscriptEditor} />
        )}
        {/* Render TextMenu for framework editor if it exists */}
        {frameworkEditor && (
          <TextMenu key="framework-text-menu" editor={frameworkEditor} />
        )}
      </Suspense>

      {/* AI toolbar - render for both editors if they exist (like TextMenu) */}
      <Suspense fallback={null}>
        {/* Render AI toolbar for manuscript editor if it exists */}
        {manuscriptEditor && (
          <>
            <CustomAIToolbar key="manuscript-ai-toolbar" editor={manuscriptEditor} />
          </>
        )}
        {/* Render AI toolbar for framework editor if it exists */}
        {frameworkEditor && (
          <>
            <CustomAIToolbar key="framework-ai-toolbar" editor={frameworkEditor} />
          </>
        )}
      </Suspense>

      {/* Advanced menus - only load when there's content */}
      {hasContent && (
        <Suspense fallback={null}>
          <AdvancedMenus 
            editor={currentActiveEditor}
            menuContainerRef={menuContainerRef}
          />
        </Suspense>
      )}

      {/* Positioned menus */}
      <div className="flex justify-center">
        <Suspense fallback={null}>
          <LinkMenu editor={activeEditor} appendTo={menuContainerRef} />
          <ContentItemMenu editor={activeEditor} />
        </Suspense>
      </div>
    </>
  )
})

OptimizedMenuManager.displayName = 'OptimizedMenuManager'

export default OptimizedMenuManager