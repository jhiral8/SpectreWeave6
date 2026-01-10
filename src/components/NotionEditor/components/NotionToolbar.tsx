"use client"

import * as React from 'react'
import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/Button'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Minus,
  Table,
  Image,
  Link,
  Undo,
  Redo,
  Menu,
  Type,
  Palette,
  Sparkles,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/radix-tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NotionToolbarProps {
  editor: Editor
  onToggleSidebar: () => void
  sidebarOpen: boolean
  onToggleAiSidebar: () => void
  aiSidebarOpen: boolean
}

export default function NotionToolbar({
  editor,
  onToggleSidebar,
  sidebarOpen,
  onToggleAiSidebar,
  aiSidebarOpen
}: NotionToolbarProps) {
  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    tooltip
  }: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    children: React.ReactNode
    tooltip: string
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "primary" : "ghost"}
            buttonSize="icon"
            onClick={onClick}
            disabled={disabled}
            className="h-8 w-8"
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <div className="notion-toolbar border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left side - Navigation */}
        <div className="flex items-center gap-2">
          <ToolbarButton
            onClick={onToggleSidebar}
            tooltip="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            tooltip="Undo (Cmd+Z)"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            tooltip="Redo (Cmd+Y)"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Center - Formatting tools */}
        <div className="flex items-center gap-1">
          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            tooltip="Bold (Cmd+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            tooltip="Italic (Cmd+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            tooltip="Underline (Cmd+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            tooltip="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            tooltip="Inline code"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
            tooltip="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            tooltip="Align left"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            tooltip="Align center"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            tooltip="Align right"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            tooltip="Bullet list"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            tooltip="Numbered list"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
            tooltip="Task list"
          >
            <input type="checkbox" className="h-4 w-4 pointer-events-none" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Block elements */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            tooltip="Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            tooltip="Divider"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>

          {/* Insert menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" buttonSize="small" className="h-8 px-2">
                Insert
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => {
                  const url = window.prompt('Image URL:')
                  if (url) {
                    editor.chain().focus().setImage({ src: url }).run()
                  }
                }}
              >
                <Image className="h-4 w-4 mr-2" />
                Image
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                }}
              >
                <Table className="h-4 w-4 mr-2" />
                Table
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  const url = window.prompt('URL:')
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run()
                  }
                }}
              >
                <Link className="h-4 w-4 mr-2" />
                Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side - Style controls */}
        <div className="flex items-center gap-2">
          {/* AI Sidebar toggle */}
          <ToolbarButton
            onClick={onToggleAiSidebar}
            isActive={aiSidebarOpen}
            tooltip="Toggle AI Tools"
          >
            <Sparkles className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Text style dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" buttonSize="small" className="h-8 px-2">
                <Type className="h-4 w-4 mr-1" />
                {editor.isActive('heading', { level: 1 }) ? 'H1' :
                 editor.isActive('heading', { level: 2 }) ? 'H2' :
                 editor.isActive('heading', { level: 3 }) ? 'H3' :
                 'Text'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => editor.chain().focus().setParagraph().run()}
              >
                Text
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              >
                Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              >
                Heading 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Color picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" buttonSize="icon" className="h-8 w-8">
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="grid grid-cols-6 gap-2 p-2">
                {[
                  '#000000', '#DC2626', '#EA580C', '#D97706',
                  '#65A30D', '#059669', '#0891B2', '#2563EB',
                  '#7C3AED', '#C026D3', '#DB2777', '#6B7280'
                ].map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded-sm border-2 border-transparent hover:border-gray-300"
                    style={{ backgroundColor: color }}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                  />
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => editor.chain().focus().unsetColor().run()}
              >
                Default color
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}