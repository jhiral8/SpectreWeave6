/**
 * Minimal Extension Kit for debugging
 * Only includes basic, stable extensions
 */
'use client'

import { StarterKit } from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extensions'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { FontFamily } from '@tiptap/extension-font-family'

export const MinimalExtensionKit = () => [
  StarterKit.configure({
    history: true, // Enable history for standalone usage
  }),
  Placeholder.configure({
    placeholder: 'Start writing...',
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  // Include minimal styling marks to load previously saved content
  TextStyle,
  Color,
  FontFamily,
]

export default MinimalExtensionKit