/**
 * SpectreWeave5 Extension Kit
 * 
 * Comprehensive TipTap extension bundle including:
 * - Core editing extensions (formatting, blocks, etc.)
 * - Writing-specific blocks (AuthorStyle, CharacterProfile, Feedback)
 * - Enhanced slash commands with categorized suggestions
 * - AI-powered features (configurable)
 * - Research tools integration
 * 
 * Features can be enabled/disabled via configuration props.
 */
'use client'

import { HocuspocusProvider } from '@hocuspocus/provider'
import { PluginKey } from '@tiptap/pm/state'

import { API } from '@/lib/api'

import { StarterKit } from '@tiptap/starter-kit'
import { Highlight } from '@tiptap/extension-highlight'
import { CharacterCount, Placeholder, Focus, Dropcursor } from '@tiptap/extensions'
import { Underline } from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-font-family'
import { Typography } from '@tiptap/extension-typography'
import { Color } from '@tiptap/extension-color'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'

import { Selection } from './Selection'
import { HorizontalRule } from './HorizontalRule'
import { Heading } from './Heading'
import { Document } from './Document'
import { TrailingNode } from './TrailingNode'
import { FontSize } from './FontSize'
import { Figcaption } from './Figcaption'
import { BlockquoteFigure } from './BlockquoteFigure'
import { Link } from './Link'
import { ImageBlock } from './ImageBlock'
import { Columns, Column } from './MultiColumn'
import { emojiSuggestion } from './EmojiSuggestion'
import { SlashCommands, createSlashCommandsSuggestion } from './SlashCommands'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { ImageUpload } from './ImageUpload'
import { AuthorStyleBlock } from './AuthorStyleBlock'
import { CharacterProfileBlock } from './CharacterProfileBlock'
import { FeedbackBlock } from './FeedbackBlock'
import { ResearchBlock } from './ResearchBlock'
import { AISuggestionBlock } from './AISuggestionBlock'
import { GhostCompletion } from './GhostCompletion/GhostCompletion'
// import { TableOfContentsNode } from './TableOfContentsNode'
import { lowlight } from 'lowlight'

interface ExtensionKitProps {
  provider?: HocuspocusProvider | null
  userId?: string
  userName?: string
  userColor?: string
  enableAI?: boolean
  enableResearch?: boolean
  enableWritingTools?: boolean
  projectId?: string
  surfaceType?: 'manuscript' | 'framework' | 'single'
}

export const ExtensionKit = ({ 
  provider, 
  userId, 
  userName = 'Maxi', 
  enableAI = true,
  enableResearch = true,
  enableWritingTools = true,
  projectId,
  surfaceType = 'single'
}: ExtensionKitProps) => [
  Document,
  Columns,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Column,
  Selection,
  Heading.configure({
    levels: [1, 2, 3, 4, 5, 6],
  }),
  HorizontalRule,
  StarterKit.configure({
    document: false,
    dropcursor: false,
    heading: false,
    horizontalRule: false,
    blockquote: false,
    history: !provider, // Enable history only when NOT using collaboration
    codeBlock: false,
    link: false,
    underline: false,
  }),
  CodeBlockLowlight.configure({
    lowlight,
    defaultLanguage: null,
  }),
  TextStyle,
  FontSize,
  FontFamily,
  Color,
  Link.configure({
    openOnClick: false,
  }),
  Highlight.configure({ multicolor: true }),
  Underline,
  CharacterCount.configure({ limit: 50000 }),
  // TableOfContents,
  // TableOfContentsNode,
  ImageUpload.configure({
    clientId: provider?.document?.clientID,
  }),
  ImageBlock,
  // FileHandler.configure({
  //   allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  //   onDrop: (currentEditor: any, files: any, pos: any) => {
  //     files.forEach(async () => {
  //       const url = await API.uploadImage()

  //       currentEditor.chain().setImageBlockAt({ pos, src: url }).focus().run()
  //     })
  //   },
  //   onPaste: (currentEditor: any, files: any) => {
  //     files.forEach(async () => {
  //       const url = await API.uploadImage()

  //       return currentEditor
  //         .chain()
  //         .setImageBlockAt({ pos: currentEditor.state.selection.anchor, src: url })
  //         .focus()
  //         .run()
  //     })
  //   },
  // }),
  // Emoji.configure({
  //   enableEmoticons: true,
  //   suggestion: emojiSuggestion,
  // }),
  TextAlign.extend({
    addKeyboardShortcuts() {
      return {}
    },
  }).configure({
    types: ['heading', 'paragraph'],
  }),
  Subscript,
  Superscript,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  Typography,
  Placeholder.configure({
    includeChildren: true,
    showOnlyCurrent: false,
    placeholder: () => '',
  }),
  SlashCommands.configure({
    suggestion: {
      ...createSlashCommandsSuggestion(),
      pluginKey: new PluginKey(`slashCommands-${surfaceType}`),
    },
  }),
  Focus,
  Figcaption,
  BlockquoteFigure,
  Dropcursor.configure({
    width: 2,
    class: 'ProseMirror-dropcursor border-black',
  }),
  ...(enableWritingTools ? [
    AuthorStyleBlock.configure({
      enableAI,
      enableStyleAnalysis: enableAI,
      projectId,
    }),
    CharacterProfileBlock.configure({
      enableAI,
      projectId,
    }),
    FeedbackBlock.configure({
      HTMLAttributes: {},
      enableResearch,
      enableAI,
      projectId,
    }),
    ResearchBlock.configure({
      enableAI,
      enableWebSearch: enableResearch,
      enableCitations: true,
      projectId,
    }),
  ] : []),
  AISuggestionBlock,
  GhostCompletion.configure({
    enabled: true,
    debounceMs: 10000,
    minCharacters: 20,
    contextWindow: 1000,
    maxTokens: 120,
    temperature: 0.6,
    planCount: 3,
    provider: 'aifoundry',
    punctuationChars: '.!?',
  }),
]

// Export types for external use
export type { ExtensionKitProps }

// Example usage:
/*
import { ExtensionKit } from './extensions/extension-kit'

const extensions = ExtensionKit({
  provider: myHocuspocusProvider,
  userId: 'user-123',
  userName: 'John Doe',
  enableAI: true,
  enableResearch: true,
  enableWritingTools: true,
  projectId: 'project-456'
})
*/
