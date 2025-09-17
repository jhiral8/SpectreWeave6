import { createContext, useContext } from 'react'
import { Editor } from '@tiptap/react'
import { WritingSurface } from '@/lib/ai/dualSurfaceContextManager'

export interface EditorContextValue {
  // Single editor support (backward compatibility)
  editor?: Editor | null
  
  // Dual editor support
  manuscriptEditor?: Editor | null
  frameworkEditor?: Editor | null
  activeEditor?: Editor | null
  activeSurface?: WritingSurface
  isDualMode?: boolean
  
  // State management
  isLoading?: boolean
  hasUnsavedChanges?: boolean
  lastSaved?: Date | null
  autosaveEnabled?: boolean
  collaborationEnabled?: boolean
  
  // AI Features
  aiEnabled?: boolean
  selectedAIProvider?: string
  
  // UI State
  showFormatting?: boolean
  showAnalytics?: boolean
  sidebarOpen?: boolean
  
  // Actions
  saveDocument?: () => Promise<void>
  toggleAutosave?: () => void
  toggleAI?: () => void
  toggleFormatting?: () => void
  toggleAnalytics?: () => void
  toggleSidebar?: () => void
  
  // Dual editor actions
  switchToSurface?: (surface: WritingSurface) => void
  toggleSurface?: () => void
  syncContentBetweenSurfaces?: () => void
}

export const EditorContext = createContext<EditorContextValue>({})

export const useEditorContext = () => {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditorContext must be used within an EditorProvider')
  }
  return context
}
