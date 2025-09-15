'use client'

import React from 'react'
import { useEditorContext } from '../context/UnifiedEditorContext'
import { EditorHeader } from './EditorHeader'
import { getGhostRuntimeState } from '../../../extensions/GhostCompletion/GhostCompletion'

/**
 * Simplified ContextAwareEditorHeader - no more prop drilling
 * Uses unified context directly instead of over-engineered split contexts
 */
export const ContextAwareEditorHeader = React.memo(() => {
  const {
    characterCount,
    collabState,
    users,
    user,
    activeEditor,
    leftSidebar,
    aiChatSidebar,
    activeSurface,
    switchToSurface,
    project
  } = useEditorContext()

  // Expose top-bar integration handles on window so AppShell can reflect state
  React.useEffect(() => {
    const w: any = window as any
    w.swAIChatIsOpen = aiChatSidebar.isOpen
    w.swToggleAIChat = aiChatSidebar.toggle
    w.swToggleDocSidebar = leftSidebar.toggle
    // Expose ghost completion controls for the portal top bar
    try {
      w.swGhostGetEnabled = () => {
        try {
          // Use the runtime state directly - this is the source of truth
          const runtimeState = getGhostRuntimeState()
          const enabled = !!(runtimeState.enabled ?? true)
          return enabled
        } catch (error) {
          console.error('swGhostGetEnabled error:', error)
          return true
        }
      }
      w.swGhostSetEnabled = (val: boolean) => {
        try {
          ;(activeEditor as any)?.commands?.setGhostEnabled?.(val)
        } catch (error) {
          console.error('swGhostSetEnabled error:', error)
        }
      }
      w.swGhostGetPlanCount = () => {
        try {
          const runtimeState = getGhostRuntimeState()
          const pc = runtimeState.planCount
          return pc === 1 || pc === 2 || pc === 3 ? pc : 3
        } catch { return 3 }
      }
      w.swGhostSetPlanCount = (val: 1 | 2 | 3) => {
        try {
          ;(activeEditor as any)?.commands?.setGhostPlanCount?.(val)
        } catch {}
      }
      w.swGhostGetSafeMode = () => {
        try {
          const runtimeState = getGhostRuntimeState()
          return typeof runtimeState.safeMode === 'boolean' ? runtimeState.safeMode : true
        } catch { return true }
      }
      w.swGhostSetSafeMode = (val: boolean) => {
        try {
          ;(activeEditor as any)?.commands?.setGhostSafeMode?.(!!val)
        } catch {}
      }
    } catch {}
    return () => {
      try {
        delete w.swAIChatIsOpen
        delete w.swToggleAIChat
        delete w.swToggleDocSidebar
        delete (w as any).swGhostGetEnabled
        delete (w as any).swGhostSetEnabled
        delete (w as any).swGhostGetPlanCount
        delete (w as any).swGhostSetPlanCount
        delete (w as any).swGhostGetSafeMode
        delete (w as any).swGhostSetSafeMode
      } catch {}
    }
  }, [aiChatSidebar.isOpen, aiChatSidebar.toggle, leftSidebar.toggle, activeEditor])

  return null
})

ContextAwareEditorHeader.displayName = 'ContextAwareEditorHeader'