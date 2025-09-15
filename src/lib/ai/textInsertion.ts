/**
 * AI Text Insertion Utilities
 * 
 * Provides functionality to insert AI-generated text into specific writing surfaces
 * with intelligent positioning and formatting.
 */

import { Editor } from '@tiptap/react'

export type WritingSurface = 'manuscript' | 'framework' | 'active'
export type InsertionMode = 'cursor' | 'append' | 'replace'

export interface TextInsertionOptions {
  surface: WritingSurface
  mode: InsertionMode
  text: string
  preserveFormatting?: boolean
  addParagraphBreak?: boolean
}

/**
 * Gets the target editor based on the specified surface
 */
export const getTargetEditor = (surface: WritingSurface): Editor | null => {
  const w = window as any
  
  switch (surface) {
    case 'manuscript':
      return w.manuscriptEditor || w.activeEditor || w.editor
    case 'framework':
      return w.frameworkEditor
    case 'active':
      return w.activeEditor || w.manuscriptEditor || w.frameworkEditor || w.editor
    default:
      return null
  }
}

/**
 * Gets available surfaces based on which editors are currently loaded
 */
export const getAvailableSurfaces = (): WritingSurface[] => {
  const w = window as any
  const surfaces: WritingSurface[] = []
  
  if (w.manuscriptEditor || (w.activeEditor && !w.frameworkEditor)) {
    surfaces.push('manuscript')
  }
  
  if (w.frameworkEditor) {
    surfaces.push('framework')
  }
  
  // Always include active as an option if any editor exists
  if (w.activeEditor || w.manuscriptEditor || w.frameworkEditor || w.editor) {
    surfaces.push('active')
  }
  
  return surfaces
}

/**
 * Gets a human-readable label for a surface
 */
export const getSurfaceLabel = (surface: WritingSurface): string => {
  switch (surface) {
    case 'manuscript':
      return 'Manuscript'
    case 'framework':
      return 'Story Framework'
    case 'active':
      return 'Active Editor'
    default:
      return 'Unknown'
  }
}

/**
 * Inserts text into the specified writing surface
 */
export const insertTextIntoSurface = (options: TextInsertionOptions): boolean => {
  const { surface, mode, text, preserveFormatting = false, addParagraphBreak = true } = options
  
  const editor = getTargetEditor(surface)
  if (!editor) {
    console.warn(`No editor found for surface: ${surface}`)
    return false
  }
  
  try {
    // Focus the target editor first
    editor.commands.focus()
    
    let formattedText = text
    
    // Add paragraph breaks if requested
    if (addParagraphBreak && !text.startsWith('\n')) {
      formattedText = '\n\n' + text
    }
    
    switch (mode) {
      case 'cursor':
        // Insert at current cursor position
        if (preserveFormatting) {
          editor.commands.insertContent(formattedText)
        } else {
          editor.commands.insertContent(formattedText)
        }
        break
        
      case 'append':
        // Insert at the end of the document
        editor.commands.focus('end')
        if (preserveFormatting) {
          editor.commands.insertContent(formattedText)
        } else {
          editor.commands.insertContent(formattedText)
        }
        break
        
      case 'replace':
        // Replace the entire content (with confirmation)
        if (confirm('This will replace all content in the editor. Are you sure?')) {
          editor.commands.clearContent()
          editor.commands.insertContent(text)
        } else {
          return false
        }
        break
        
      default:
        return false
    }
    
    console.log(`✅ Text inserted into ${surface} surface using ${mode} mode`)
    return true
    
  } catch (error) {
    console.error(`Failed to insert text into ${surface} surface:`, error)
    return false
  }
}

/**
 * Gets insertion mode label for UI
 */
export const getInsertionModeLabel = (mode: InsertionMode): string => {
  switch (mode) {
    case 'cursor':
      return 'At cursor'
    case 'append':
      return 'Append to end'
    case 'replace':
      return 'Replace all'
    default:
      return 'Unknown'
  }
}

/**
 * Gets insertion mode icon for UI
 */
export const getInsertionModeIcon = (mode: InsertionMode): string => {
  switch (mode) {
    case 'cursor':
      return '📍'
    case 'append':
      return '➕'
    case 'replace':
      return '🔄'
    default:
      return '❓'
  }
}