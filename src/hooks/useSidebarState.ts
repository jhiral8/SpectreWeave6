'use client'

import { useSidebar } from './useSidebar'
import { useAIChatSidebar } from './useAIChatSidebar'

/**
 * Hook for managing sidebar states
 * Single Responsibility: Coordinate sidebar visibility and state
 */
export const useSidebarState = () => {
  const leftSidebar = useSidebar()
  const aiChatSidebar = useAIChatSidebar()

  return {
    leftSidebar,
    aiChatSidebar
  }
}

export default useSidebarState