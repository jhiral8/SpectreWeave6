"use client"

import * as React from 'react'
import { Editor } from '@tiptap/react'

export interface SelectionBounds {
  top: number
  left: number
  bottom: number
  right: number
  width: number
  height: number
}

export interface TextSelectionState {
  hasSelection: boolean
  selectedText: string
  selectionBounds: SelectionBounds | null
}

export function useTextSelection(editor: Editor | null): TextSelectionState {
  const [selectionState, setSelectionState] = React.useState<TextSelectionState>({
    hasSelection: false,
    selectedText: '',
    selectionBounds: null,
  })

  const updateSelectionState = React.useCallback(() => {
    if (!editor) {
      setSelectionState({
        hasSelection: false,
        selectedText: '',
        selectionBounds: null,
      })
      return
    }

    const { selection } = editor.state
    const { from, to } = selection

    // Check if there's actually selected text (not just cursor position)
    const hasSelection = from !== to
    const selectedText = hasSelection ? editor.state.doc.textBetween(from, to) : ''

    // Only show toolbar for meaningful text selections (more than just whitespace)
    const hasMeaningfulSelection = hasSelection && selectedText.trim().length > 0

    let selectionBounds: SelectionBounds | null = null

    if (hasMeaningfulSelection) {
      try {
        // Get the DOM selection
        const domSelection = window.getSelection()

        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0)
          const rect = range.getBoundingClientRect()

          // Only proceed if we have valid bounds
          if (rect.width > 0 && rect.height > 0) {
            selectionBounds = {
              top: rect.top + window.scrollY,
              left: rect.left + window.scrollX,
              bottom: rect.bottom + window.scrollY,
              right: rect.right + window.scrollX,
              width: rect.width,
              height: rect.height,
            }
          }
        }
      } catch (error) {
        console.warn('Error getting selection bounds:', error)
        selectionBounds = null
      }
    }

    setSelectionState({
      hasSelection: hasMeaningfulSelection,
      selectedText: selectedText.trim(),
      selectionBounds,
    })
  }, [editor])

  // Listen to editor selection changes
  React.useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      // Use setTimeout to ensure DOM has updated
      setTimeout(updateSelectionState, 10)
    }

    // Listen to editor selection changes
    editor.on('selectionUpdate', handleSelectionUpdate)
    editor.on('transaction', handleSelectionUpdate)

    // Also listen to native selection changes for better responsiveness
    const handleNativeSelectionChange = () => {
      // Debounce native selection changes
      setTimeout(updateSelectionState, 50)
    }

    document.addEventListener('selectionchange', handleNativeSelectionChange)

    // Initial update
    updateSelectionState()

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
      editor.off('transaction', handleSelectionUpdate)
      document.removeEventListener('selectionchange', handleNativeSelectionChange)
    }
  }, [editor, updateSelectionState])

  // Listen for window resize and scroll to update positions
  React.useEffect(() => {
    if (!selectionState.hasSelection) return

    const handlePositionUpdate = () => {
      updateSelectionState()
    }

    window.addEventListener('resize', handlePositionUpdate)
    window.addEventListener('scroll', handlePositionUpdate, true) // Use capture for all scroll events

    return () => {
      window.removeEventListener('resize', handlePositionUpdate)
      window.removeEventListener('scroll', handlePositionUpdate, true)
    }
  }, [selectionState.hasSelection, updateSelectionState])

  // Clear selection when editor loses focus
  React.useEffect(() => {
    if (!editor) return

    const handleBlur = () => {
      // Small delay to check if focus moved to the AI toolbar
      setTimeout(() => {
        const activeElement = document.activeElement
        const isAIToolbarFocused = activeElement?.closest('.ai-tools-grid')

        if (!isAIToolbarFocused) {
          setSelectionState({
            hasSelection: false,
            selectedText: '',
            selectionBounds: null,
          })
        }
      }, 100)
    }

    editor.on('blur', handleBlur)

    return () => {
      editor.off('blur', handleBlur)
    }
  }, [editor])

  return selectionState
}

// Helper function to check if a selection is within the editor
export function isSelectionWithinEditor(editor: Editor | null): boolean {
  if (!editor) return false

  try {
    const editorElement = editor.view.dom
    const selection = window.getSelection()

    if (!selection || selection.rangeCount === 0) return false

    const range = selection.getRangeAt(0)
    return editorElement.contains(range.commonAncestorContainer)
  } catch {
    return false
  }
}

// Helper function to get selection text safely
export function getSelectionText(editor: Editor | null): string {
  if (!editor) return ''

  try {
    const { selection } = editor.state
    const { from, to } = selection

    if (from === to) return ''

    return editor.state.doc.textBetween(from, to)
  } catch {
    return ''
  }
}