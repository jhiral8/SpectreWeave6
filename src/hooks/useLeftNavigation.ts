import { useCallback, useState, useEffect } from 'react'

export type LeftNavigationState = {
  isCollapsed: boolean
  isOpen: boolean
  collapse: () => void
  expand: () => void
  toggle: () => void
  open: () => void
  close: () => void
  toggleOpen: () => void
}

export const useLeftNavigation = (): LeftNavigationState => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isOpen, setIsOpen] = useState(true)

  // Load initial state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCollapsed = localStorage.getItem('leftNav-collapsed')
      const savedOpen = localStorage.getItem('leftNav-open')
      
      if (savedCollapsed !== null) {
        setIsCollapsed(JSON.parse(savedCollapsed))
      }
      
      // On mobile, start closed by default
      if (savedOpen !== null) {
        setIsOpen(JSON.parse(savedOpen))
      } else if (window.innerWidth < 1024) {
        setIsOpen(false)
      }
    }
  }, [])

  const collapse = useCallback(() => {
    setIsCollapsed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('leftNav-collapsed', 'true')
    }
  }, [])

  const expand = useCallback(() => {
    setIsCollapsed(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('leftNav-collapsed', 'false')
    }
  }, [])

  const toggle = useCallback(() => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    if (typeof window !== 'undefined') {
      localStorage.setItem('leftNav-collapsed', JSON.stringify(newCollapsed))
    }
  }, [isCollapsed])

  const open = useCallback(() => {
    setIsOpen(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('leftNav-open', 'true')
    }
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('leftNav-open', 'false')
    }
  }, [])

  const toggleOpen = useCallback(() => {
    const newOpen = !isOpen
    setIsOpen(newOpen)
    if (typeof window !== 'undefined') {
      localStorage.setItem('leftNav-open', JSON.stringify(newOpen))
    }
  }, [isOpen])

  return {
    isCollapsed,
    isOpen,
    collapse,
    expand,
    toggle,
    open,
    close,
    toggleOpen,
  }
}