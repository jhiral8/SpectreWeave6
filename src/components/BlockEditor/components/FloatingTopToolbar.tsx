'use client'

import React, { useState, useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import dynamic from 'next/dynamic'
import { Check, History, Layout, Pin, PinOff } from 'lucide-react'
import { FontFamilyPicker } from '@/components/menus/TextMenu/components/FontFamilyPicker'
import { SaveButton } from '@/components/editor/SaveButton'
import { VersionHistory } from '@/components/editor/VersionHistory'
import { useViewState } from '../context/SplitEditorContext'

const LazyAdvancedFormatting = dynamic(
  () => import('@/components/editor/LazyEditorComponents').then(m => ({ default: m.LazyAdvancedFormatting })),
  { ssr: false }
)

const LazyAIWritingAssistant = dynamic(
  () => import('@/components/editor/LazyEditorComponents').then(m => ({ default: m.LazyAIWritingAssistant })),
  { ssr: false }
)

export default function FloatingTopToolbar({ editor }: { editor: Editor | null }) {
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [docId, setDocId] = useState<string>('')
  const { isDrawerOpen, setIsDrawerOpen, isDrawerPinned, setIsDrawerPinned } = useViewState()
  
  // Get document ID from URL
  useEffect(() => {
    const pathSegments = window.location.pathname.split('/')
    const writerIndex = pathSegments.indexOf('writer')
    const docsIndex = pathSegments.indexOf('docs')
    
    if (writerIndex !== -1 && pathSegments[writerIndex + 1]) {
      setDocId(pathSegments[writerIndex + 1])
    } else if (docsIndex !== -1 && pathSegments[docsIndex + 1]) {
      setDocId(pathSegments[docsIndex + 1])
    }
  }, [])
  
  if (!editor) return null
  const currentFontRaw = (editor as any)?.getAttributes?.('textStyle')?.fontFamily || ''
  
  return (
    <>
      <div className="pointer-events-none sticky top-12 sm:top-14 lg:top-16 z-40 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-[--border] bg-[color-mix(in_srgb,var(--card)_80%,transparent)] backdrop-blur px-2 py-1 shadow-sm h-8 sm:h-auto">
          {/* Framework Drawer Toggle */}
          <button
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors ${
              isDrawerOpen ? 'bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300' : 'border-[--border] bg-[--card] hover:bg-[--accent]'
            }`}
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            title="Toggle Story Framework"
          >
            <Layout className="w-3.5 h-3.5" />
            <span className="font-medium hidden sm:inline">Framework</span>
          </button>

          {isDrawerOpen && (
            <button
              className={`flex items-center justify-center w-7 h-7 rounded-lg border transition-colors ${
                isDrawerPinned ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' : 'border-[--border] bg-[--card] hover:bg-[--accent]'
              }`}
              onClick={() => setIsDrawerPinned(!isDrawerPinned)}
              title={isDrawerPinned ? "Unpin Framework" : "Pin Framework"}
            >
              {isDrawerPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
            </button>
          )}

          <div className="w-px h-6 bg-[--border]" />

          {/* Font family selector - reuse TextMenu styling */}
          <FontFamilyPicker
            onChange={(font: string) => {
              try { editor.chain().focus().setFontFamily(font).run() } catch {}
            }}
            value={currentFontRaw}
          />
          <LazyAdvancedFormatting editor={editor} />
          <div className="w-px h-6 bg-[--border]" />
          <LazyAIWritingAssistant editor={editor} />
          <div className="w-px h-6 bg-[--border]" />
          
          {/* Save button */}
          {docId && <SaveButton editor={editor} docId={docId} />}
          
          {/* Version history button */}
          {docId && (
            <button
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-[--border] bg-[--card] hover:bg-[--accent] transition-colors"
              onClick={() => setShowVersionHistory(true)}
            >
              <History className="w-3.5 h-3.5" />
              <span className="font-medium">History</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Version History Modal */}
      {showVersionHistory && docId && (
        <VersionHistory
          docId={docId}
          onClose={() => setShowVersionHistory(false)}
        />
      )}
    </>
  )
}


