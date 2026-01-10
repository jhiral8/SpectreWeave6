"use client"

import * as React from 'react'
import { Editor } from '@tiptap/react'
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Table,
  Image,
  CheckSquare,
} from 'lucide-react'

interface BlockMenuProps {
  editor: Editor
  onClose: () => void
}

interface BlockCommand {
  title: string
  description: string
  icon: React.ReactNode
  command: () => void
  searchTerms: string[]
}

export default function BlockMenu({ editor, onClose }: BlockMenuProps) {
  const [search, setSearch] = React.useState('')
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const commands: BlockCommand[] = [
    {
      title: 'Text',
      description: 'Just start typing with plain text.',
      icon: <Type className="h-4 w-4" />,
      command: () => {
        editor.chain().focus().setParagraph().run()
        onClose()
      },
      searchTerms: ['p', 'paragraph', 'text'],
    },
    {
      title: 'Heading 1',
      description: 'Big section heading.',
      icon: <Heading1 className="h-4 w-4" />,
      command: () => {
        editor.chain().focus().toggleHeading({ level: 1 }).run()
        onClose()
      },
      searchTerms: ['h1', 'heading', 'title'],
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading.',
      icon: <Heading2 className="h-4 w-4" />,
      command: () => {
        editor.chain().focus().toggleHeading({ level: 2 }).run()
        onClose()
      },
      searchTerms: ['h2', 'heading', 'subtitle'],
    },
    {
      title: 'Heading 3',
      description: 'Small section heading.',
      icon: <Heading3 className="h-4 w-4" />,
      command: () => {
        editor.chain().focus().toggleHeading({ level: 3 }).run()
        onClose()
      },
      searchTerms: ['h3', 'heading', 'subheading'],
    },
    {
      title: 'Bullet List',
      description: 'Create a simple bullet list.',
      icon: <List className="h-4 w-4" />,
      command: () => {
        editor.chain().focus().toggleBulletList().run()
        onClose()
      },
      searchTerms: ['ul', 'bullet', 'list'],
    },
    {
      title: 'Numbered List',
      description: 'Create a list with numbering.',
      icon: <ListOrdered className="h-4 w-4" />,
      command: () => {
        editor.chain().focus().toggleOrderedList().run()
        onClose()
      },
      searchTerms: ['ol', 'numbered', 'list', 'number'],
    },
    {
      title: 'To-do List',
      description: 'Track tasks with a to-do list.',
      icon: <CheckSquare className="h-4 w-4" />,
      command: () => {
        editor.chain().focus().toggleTaskList().run()
        onClose()
      },
      searchTerms: ['todo', 'task', 'check', 'checkbox'],
    },
    {
      title: 'Quote',
      description: 'Capture a quote.',
      icon: <Quote className="h-4 w-4" />,
      command: () => {
        editor.chain().focus().toggleBlockquote().run()
        onClose()
      },
      searchTerms: ['quote', 'blockquote', 'citation'],
    },
    {
      title: 'Code',
      description: 'Capture a code snippet.',
      icon: <Code className="h-4 w-4" />,
      command: () => {
        editor.chain().focus().toggleCodeBlock().run()
        onClose()
      },
      searchTerms: ['code', 'codeblock', 'snippet'],
    },
    {
      title: 'Divider',
      description: 'Visually divide blocks.',
      icon: <Minus className="h-4 w-4" />,
      command: () => {
        editor.chain().focus().setHorizontalRule().run()
        onClose()
      },
      searchTerms: ['hr', 'divider', 'separator'],
    },
    {
      title: 'Table',
      description: 'Add a table with rows and columns.',
      icon: <Table className="h-4 w-4" />,
      command: () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        onClose()
      },
      searchTerms: ['table', 'grid'],
    },
    {
      title: 'Image',
      description: 'Add an image to your page.',
      icon: <Image className="h-4 w-4" />,
      command: () => {
        const url = window.prompt('Image URL:')
        if (url) {
          editor.chain().focus().setImage({ src: url }).run()
        }
        onClose()
      },
      searchTerms: ['image', 'img', 'picture', 'photo'],
    },
  ]

  const filteredCommands = commands.filter(
    command =>
      command.title.toLowerCase().includes(search.toLowerCase()) ||
      command.searchTerms.some(term =>
        term.toLowerCase().includes(search.toLowerCase())
      )
  )

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [filteredCommands.length])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        )
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        )
      } else if (event.key === 'Enter') {
        event.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].command()
        }
      } else if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [filteredCommands, selectedIndex, onClose])

  // Auto-close if no commands match
  React.useEffect(() => {
    if (filteredCommands.length === 0 && search.length > 0) {
      const timer = setTimeout(onClose, 1000)
      return () => clearTimeout(timer)
    }
  }, [filteredCommands.length, search.length, onClose])

  return (
    <div className="absolute z-50 w-80 bg-popover border rounded-lg shadow-lg p-2 mt-2">
      <div className="relative mb-2">
        <input
          type="text"
          placeholder="Search for blocks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          autoFocus
        />
      </div>

      <div className="max-h-64 overflow-y-auto">
        {filteredCommands.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No blocks found
          </div>
        ) : (
          filteredCommands.map((command, index) => (
            <button
              key={command.title}
              className={`w-full flex items-start gap-3 px-3 py-2 text-left rounded-md hover:bg-accent transition-colors ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
              onClick={command.command}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-md flex items-center justify-center mt-0.5">
                {command.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{command.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {command.description}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {filteredCommands.length > 0 && (
        <div className="border-t mt-2 pt-2 px-3 py-1">
          <div className="text-xs text-muted-foreground">
            ↑↓ to navigate • ↵ to select • esc to close
          </div>
        </div>
      )}
    </div>
  )
}