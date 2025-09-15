/**
 * Lazy Extension Kit for performance optimization
 * Loads extensions on-demand based on usage patterns
 */
'use client'

import { Extension } from '@tiptap/core'
import { StarterKit } from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'
import { Typography } from '@tiptap/extension-typography'
import { CharacterCount } from '@tiptap/extension-character-count'
import { Collaboration } from '@tiptap/extension-collaboration'
import { CollaborationCursor } from '@tiptap/extension-collaboration-cursor'
import { History } from '@tiptap/extension-history'

// Core extensions that are always needed
export const getCoreExtensions = (options: {
  placeholder?: string
  collaboration?: boolean
  ydoc?: any
  provider?: any
  user?: any
}) => {
  const coreExtensions: Extension[] = [
    StarterKit.configure({
      // Disable history for collaboration
      history: !options.collaboration,
      // Configure other starter kit extensions as needed
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
      bulletList: {
        keepMarks: true,
        keepAttributes: false,
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false,
      },
    }),
    
    Placeholder.configure({
      placeholder: options.placeholder || 'Start writing...',
      showOnlyWhenEditable: true,
      showOnlyCurrent: false,
    }),

    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
      defaultAlignment: 'left',
    }),

    TextStyle,
    
    CharacterCount.configure({
      limit: null,
    }),

    Typography.configure({
      openDoubleQuote: '"',
      closeDoubleQuote: '"',
      openSingleQuote: "'",
      closeSingleQuote: "'",
      leftArrow: '←',
      rightArrow: '→',
      copyright: '©',
      trademark: '™',
      registeredTrademark: '®',
      oneHalf: '½',
      oneQuarter: '¼',
      threeQuarters: '¾',
      plusMinus: '±',
      notEqual: '≠',
      laquo: '«',
      raquo: '»',
      multiplication: '×',
      superscriptTwo: '²',
      superscriptThree: '³',
      ellipsis: '…',
      emDash: '—',
      enDash: '–',
    }),
  ]

  // Add collaboration extensions if needed
  if (options.collaboration && options.ydoc && options.provider) {
    coreExtensions.push(
      Collaboration.configure({
        document: options.ydoc,
      }),
      CollaborationCursor.configure({
        provider: options.provider,
        user: options.user || {
          name: 'Anonymous',
          color: '#f783ac',
        },
      })
    )
  } else {
    // Add history if not using collaboration
    coreExtensions.push(History.configure({
      depth: 10,
    }))
  }

  return coreExtensions
}

// Formatting extensions that can be loaded on demand
export const getFormattingExtensions = async () => {
  const [
    { Color: ColorExt },
    { Highlight: HighlightExt },
  ] = await Promise.all([
    import('@tiptap/extension-color'),
    import('@tiptap/extension-highlight'),
  ])

  return [
    ColorExt.configure({
      types: ['textStyle'],
    }),
    HighlightExt.configure({
      multicolor: true,
    }),
  ]
}

// Advanced extensions for complex editing
export const getAdvancedExtensions = async () => {
  const [
    { Table },
    { TableRow }, 
    { TableHeader },
    { TableCell },
    { Image },
    { Link },
    { CodeBlock },
  ] = await Promise.all([
    import('@tiptap/extension-table'),
    import('@tiptap/extension-table-row'),
    import('@tiptap/extension-table-header'),
    import('@tiptap/extension-table-cell'),
    import('@tiptap/extension-image'),
    import('@tiptap/extension-link'),
    import('@tiptap/extension-code-block'),
  ])

  return [
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    Link.configure({
      openOnClick: false,
      linkOnPaste: true,
    }),
    CodeBlock.configure({
      languageClassPrefix: 'language-',
    }),
  ]
}

export type ExtensionLoadingStrategy = 'core' | 'formatting' | 'advanced' | 'full'

export const LazyExtensionKit = async (strategy: ExtensionLoadingStrategy = 'core', options: {
  placeholder?: string
  collaboration?: boolean
  ydoc?: any
  provider?: any
  user?: any
} = {}) => {
  const coreExtensions = getCoreExtensions(options)
  
  switch (strategy) {
    case 'core':
      return coreExtensions
      
    case 'formatting':
      const formattingExtensions = await getFormattingExtensions()
      return [...coreExtensions, ...formattingExtensions]
      
    case 'advanced':
      const advancedExtensions = await getAdvancedExtensions()
      return [...coreExtensions, ...advancedExtensions]
      
    case 'full':
      const [formatting, advanced] = await Promise.all([
        getFormattingExtensions(),
        getAdvancedExtensions()
      ])
      return [...coreExtensions, ...formatting, ...advanced]
      
    default:
      return coreExtensions
  }
}

export default LazyExtensionKit