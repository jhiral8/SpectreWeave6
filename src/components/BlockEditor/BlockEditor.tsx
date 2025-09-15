'use client'

import { EditorContent, PureEditorContent } from '@tiptap/react'
import React, { useMemo, useRef, useEffect } from 'react'

import { LinkMenu } from '@/components/menus'

import { useBlockEditor } from '@/hooks/useBlockEditor'
import { useAIChatSidebar } from '@/hooks/useAIChatSidebar'
import { User } from '@supabase/supabase-js'

import '@/styles/index.css'

import { Sidebar } from '@/components/Sidebar'
import { AIChatSidebar } from '@/components/AIChatSidebar/AIChatSidebar'
import { EditorProvider } from '@/context/EditorProvider'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import ImageBlockMenu from '@/extensions/ImageBlock/components/ImageBlockMenu'
import { ColumnsMenu } from '@/extensions/MultiColumn/menus'
import { TableColumnMenu, TableRowMenu } from '@/extensions/Table/menus'
import { TiptapProps } from './types'
import { ContextAwareEditorHeader } from './components/ContextAwareEditorHeader'
import { TextMenu } from '../menus/TextMenu'
import { ContentItemMenu } from '../menus/ContentItemMenu'
import { CustomAIToolbar } from '../editor/AIToolbar/CustomAIToolbar'
import dynamic from 'next/dynamic'

import LogoLoader from '@/components/ui/LogoLoader'
const LightweightDualEditor = dynamic(() => import('./LightweightDualEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full grid place-items-center">
      <LogoLoader  />
    </div>
  ),
})

interface BlockEditorProps extends TiptapProps {
  user?: User | null
  mode?: 'single' | 'dual'
  frameworkYdoc?: any
  frameworkProvider?: any
  enableFrameworkEditor?: boolean
  showSurfaceSwitcher?: boolean
  surfaceSwitcherVariant?: 'default' | 'floating' | 'compact' | 'pills'
}

export const BlockEditor = React.memo(({ 
  ydoc, 
  provider, 
  user, 
  mode = 'single',
  frameworkYdoc,
  frameworkProvider,
  enableFrameworkEditor = true,
  showSurfaceSwitcher = true,
  surfaceSwitcherVariant = 'floating'
}: BlockEditorProps) => {
  // If dual mode is requested, use DualBlockEditor (with all legacy editor chrome disabled)
  if (mode === 'dual') {
    return (
      <LightweightDualEditor
        manuscriptYdoc={ydoc}
        frameworkYdoc={frameworkYdoc}
        manuscriptProvider={provider}
        frameworkProvider={frameworkProvider}
        user={user}
        enableFrameworkEditor={enableFrameworkEditor}
        showSurfaceSwitcher={showSurfaceSwitcher}
        surfaceSwitcherVariant={surfaceSwitcherVariant}
        showInternalLeftNavigation={false}
      />
    )
  }

  // Continue with existing single editor implementation
  const menuContainerRef = useRef(null)
  const editorRef = useRef<PureEditorContent | null>(null)

  const { editor, users, characterCount, collabState, leftSidebar, aiChatSidebar, chapterNavigation } = useBlockEditor({ ydoc, provider })

  const displayedUsers = useMemo(() => users.slice(0, 3), [users])

  if (!editor) {
    return (
      <div className="w-full h-full grid place-items-center">
        <LogoLoader  />
      </div>
    )
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto">
              <span className="text-red-600 dark:text-red-400 text-xl">!</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Editor Failed to Load
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                There was an error initializing the editor. Please refresh the page to try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      }
    >
      <EditorProvider
        editor={editor}
        initialSettings={{
          collaborationEnabled: !!provider,
          sidebarOpen: leftSidebar.isOpen
        }}
      >
        <div className="editor-main-container flex h-screen min-h-0 w-full max-w-full" ref={menuContainerRef}>
        <Sidebar 
          isOpen={leftSidebar.isOpen} 
          onClose={leftSidebar.close} 
          editor={editor}
          chapters={chapterNavigation.chapters}
          activeChapterId={chapterNavigation.activeChapterId}
          totalWordCount={chapterNavigation.totalWordCount}
          onJumpToChapter={chapterNavigation.jumpToChapter}
          onAddChapter={chapterNavigation.addChapter}
        />
        <div className="relative flex flex-col flex-1 h-full min-h-0 min-w-0 w-full transition-all duration-300" 
             style={{ 
               // Ensure main editor area never gets cut off
               minWidth: '300px',
               maxWidth: '100%'
             }}>
          {/* Invisible bridge for AppShell controls */}
          <ContextAwareEditorHeader />
          <div className="relative flex-1 min-h-0 flex justify-center p-4 bg-[--background]">
            <div className="w-full max-w-4xl h-full relative rounded-lg border border-[--border] bg-[--card] text-[--card-foreground]">
              <EditorContent 
                editor={editor} 
                ref={editorRef} 
                className="h-full overflow-y-auto overflow-x-hidden touch-manipulation rounded-lg"
              />
            </div>
          </div>
          {/* <ContentItemMenu editor={editor} /> */}
          {/* <LinkMenu editor={editor} appendTo={menuContainerRef} /> */}
          <TextMenu editor={editor} />
          <CustomAIToolbar editor={editor} />
          <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
          <TableRowMenu editor={editor} appendTo={menuContainerRef} />
          <TableColumnMenu editor={editor} appendTo={menuContainerRef} />
          <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
        </div>
        
        {/* AI Chat Sidebar */}
        <AIChatSidebar
          editor={editor}
          isOpen={aiChatSidebar.isOpen}
          onClose={aiChatSidebar.close}
          chatState={aiChatSidebar}
        />
        </div>
      </EditorProvider>
    </ErrorBoundary>
  )
})

// Display name for debugging
BlockEditor.displayName = 'BlockEditor'

export default BlockEditor