"use client"

import * as React from 'react'
import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/Button'
import {
  X,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  List,
  Hash,
  Calendar,
  Clock,
  User,
  Settings,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/radix-tooltip'

interface NotionSidebarProps {
  editor: Editor
  onClose: () => void
  docId: string
}

interface TableOfContentsItem {
  id: string
  level: number
  text: string
  pos: number
}

export default function NotionSidebar({
  editor,
  onClose,
  docId
}: NotionSidebarProps) {
  const [tableOfContents, setTableOfContents] = React.useState<TableOfContentsItem[]>([])
  const [activeTab, setActiveTab] = React.useState<'toc' | 'info' | 'settings'>('toc')

  // Generate table of contents from editor content
  React.useEffect(() => {
    const updateTOC = () => {
      const headings: TableOfContentsItem[] = []
      const { state } = editor

      state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const level = node.attrs.level
          const text = node.textContent || `Heading ${level}`
          const id = `heading-${pos}`

          headings.push({
            id,
            level,
            text,
            pos
          })
        }
      })

      setTableOfContents(headings)
    }

    updateTOC()
    editor.on('update', updateTOC)
    return () => editor.off('update', updateTOC)
  }, [editor])

  const scrollToHeading = (pos: number) => {
    editor.commands.focus(pos)
    // Scroll the element into view
    const element = document.querySelector(`[data-position="${pos}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const getStats = () => {
    const characterCount = editor.storage.characterCount
    const text = editor.getText()
    const spacesCount = (text.match(/\s/g) || []).length

    return {
      characters: characterCount.characters(),
      charactersExcludingSpaces: characterCount.characters() - spacesCount,
      words: characterCount.words(),
      readingTime: Math.ceil(characterCount.words() / 200) // Average reading speed: 200 WPM
    }
  }

  const stats = getStats()

  return (
    <div className="w-80 h-full bg-background border-r flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-sm">Document Overview</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'toc'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('toc')}
        >
          <List className="h-4 w-4 mx-auto" />
        </button>
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'info'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('info')}
        >
          <FileText className="h-4 w-4 mx-auto" />
        </button>
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings className="h-4 w-4 mx-auto" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Table of Contents */}
        {activeTab === 'toc' && (
          <div className="p-4">
            <h3 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">
              Table of Contents
            </h3>
            {tableOfContents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No headings found. Add some headings to see the outline here.
              </p>
            ) : (
              <div className="space-y-1">
                {tableOfContents.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToHeading(item.pos)}
                    className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
                    style={{ paddingLeft: `${(item.level - 1) * 1 + 0.5}rem` }}
                  >
                    <div className="flex items-center gap-2">
                      {item.level === 1 && <Heading1 className="h-3 w-3 text-muted-foreground" />}
                      {item.level === 2 && <Heading2 className="h-3 w-3 text-muted-foreground" />}
                      {item.level === 3 && <Heading3 className="h-3 w-3 text-muted-foreground" />}
                      <span className="text-sm truncate">{item.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Document Info */}
        {activeTab === 'info' && (
          <div className="p-4 space-y-6">
            <div>
              <h3 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Characters</span>
                  </div>
                  <span className="text-sm font-medium">{stats.characters.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Characters (no spaces)</span>
                  </div>
                  <span className="text-sm font-medium">{stats.charactersExcludingSpaces.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Words</span>
                  </div>
                  <span className="text-sm font-medium">{stats.words.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Reading time</span>
                  </div>
                  <span className="text-sm font-medium">{stats.readingTime} min</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                Document
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Document ID</span>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground truncate max-w-32">
                    {docId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Created</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Last modified</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="p-4 space-y-6">
            <div>
              <h3 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                Editor Settings
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Spellcheck</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const editorElement = document.querySelector('.notion-editor-content')
                      if (editorElement) {
                        const currentSpellcheck = editorElement.getAttribute('spellcheck')
                        editorElement.setAttribute('spellcheck', currentSpellcheck === 'true' ? 'false' : 'true')
                      }
                    }}
                  >
                    Toggle
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-save</span>
                  <span className="text-sm text-green-600 font-medium">Enabled</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                Keyboard Shortcuts
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Bold</span>
                  <span className="font-mono text-muted-foreground">Cmd+B</span>
                </div>
                <div className="flex justify-between">
                  <span>Italic</span>
                  <span className="font-mono text-muted-foreground">Cmd+I</span>
                </div>
                <div className="flex justify-between">
                  <span>Underline</span>
                  <span className="font-mono text-muted-foreground">Cmd+U</span>
                </div>
                <div className="flex justify-between">
                  <span>Insert slash menu</span>
                  <span className="font-mono text-muted-foreground">/</span>
                </div>
                <div className="flex justify-between">
                  <span>Undo</span>
                  <span className="font-mono text-muted-foreground">Cmd+Z</span>
                </div>
                <div className="flex justify-between">
                  <span>Redo</span>
                  <span className="font-mono text-muted-foreground">Cmd+Y</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}