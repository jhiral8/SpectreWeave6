/**
 * Viewport Optimization Hook with Virtual Scrolling and Intersection Observer
 * Optimizes performance for large documents by rendering only visible content
 */
'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Editor } from '@tiptap/react'

interface ViewportOptimizationOptions {
  editor: Editor | null
  enabled?: boolean
  itemHeight?: number
  overscan?: number
  threshold?: number
}

interface ViewportState {
  startIndex: number
  endIndex: number
  totalHeight: number
  scrollTop: number
  containerHeight: number
}

export const useViewportOptimization = ({
  editor,
  enabled = true,
  itemHeight = 24, // Average line height
  overscan = 5, // Extra items to render outside viewport
  threshold = 0.1
}: ViewportOptimizationOptions) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewportState, setViewportState] = useState<ViewportState>({
    startIndex: 0,
    endIndex: 0,
    totalHeight: 0,
    scrollTop: 0,
    containerHeight: 0
  })

  const [isVirtualized, setIsVirtualized] = useState(false)
  const [documentNodes, setDocumentNodes] = useState<any[]>([])

  // Document analysis
  const analyzeDocument = useCallback((editor: Editor) => {
    if (!editor) return []
    
    const nodes: any[] = []
    const doc = editor.state.doc
    
    doc.descendants((node, pos) => {
      nodes.push({
        node,
        pos,
        size: node.nodeSize,
        type: node.type.name,
        height: estimateNodeHeight(node)
      })
    })
    
    return nodes
  }, [])

  // Estimate node height based on type and content
  const estimateNodeHeight = (node: any): number => {
    switch (node.type.name) {
      case 'heading':
        return itemHeight * 1.5
      case 'paragraph':
        const lines = Math.ceil((node.textContent?.length || 0) / 80) || 1
        return itemHeight * lines
      case 'codeBlock':
        const codeLines = (node.textContent?.match(/\n/g) || []).length + 1
        return itemHeight * codeLines
      case 'image':
        return 200 // Estimated image height
      case 'table':
        return itemHeight * 3 // Estimated table height
      default:
        return itemHeight
    }
  }

  // Calculate visible range
  const calculateVisibleRange = useCallback((
    scrollTop: number,
    containerHeight: number,
    nodes: any[]
  ) => {
    if (!nodes.length) return { startIndex: 0, endIndex: 0, totalHeight: 0 }

    let currentHeight = 0
    let startIndex = 0
    let endIndex = 0
    let totalHeight = 0

    // Calculate total height and find visible range
    for (let i = 0; i < nodes.length; i++) {
      const nodeHeight = nodes[i].height
      
      if (currentHeight + nodeHeight < scrollTop && startIndex === 0) {
        startIndex = i
      }
      
      if (currentHeight < scrollTop + containerHeight) {
        endIndex = i
      }
      
      currentHeight += nodeHeight
    }

    totalHeight = currentHeight

    // Add overscan
    startIndex = Math.max(0, startIndex - overscan)
    endIndex = Math.min(nodes.length - 1, endIndex + overscan)

    return { startIndex, endIndex, totalHeight }
  }, [overscan])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container || !enabled || !isVirtualized) return

    const scrollTop = container.scrollTop
    const containerHeight = container.clientHeight

    const { startIndex, endIndex, totalHeight } = calculateVisibleRange(
      scrollTop,
      containerHeight,
      documentNodes
    )

    setViewportState(prev => ({
      ...prev,
      startIndex,
      endIndex,
      totalHeight,
      scrollTop,
      containerHeight
    }))
  }, [enabled, isVirtualized, documentNodes, calculateVisibleRange])

  // Throttled scroll handler
  const throttledHandleScroll = useMemo(() => {
    let timeout: NodeJS.Timeout | null = null
    return () => {
      if (timeout) return
      timeout = setTimeout(() => {
        handleScroll()
        timeout = null
      }, 16) // ~60fps
    }
  }, [handleScroll])

  // Initialize viewport optimization
  useEffect(() => {
    if (!editor || !enabled) return

    const nodes = analyzeDocument(editor)
    setDocumentNodes(nodes)

    // Enable virtualization for large documents
    const shouldVirtualize = nodes.length > 100 || 
                            nodes.reduce((sum, node) => sum + node.height, 0) > 5000

    setIsVirtualized(shouldVirtualize)

    if (shouldVirtualize) {
      const container = containerRef.current
      if (container) {
        const containerHeight = container.clientHeight
        const { startIndex, endIndex, totalHeight } = calculateVisibleRange(
          0,
          containerHeight,
          nodes
        )

        setViewportState({
          startIndex,
          endIndex,
          totalHeight,
          scrollTop: 0,
          containerHeight
        })
      }
    }
  }, [editor, enabled, analyzeDocument, calculateVisibleRange])

  // Scroll event listener
  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled || !isVirtualized) return

    container.addEventListener('scroll', throttledHandleScroll, { passive: true })
    
    return () => {
      container.removeEventListener('scroll', throttledHandleScroll)
    }
  }, [enabled, isVirtualized, throttledHandleScroll])

  // Intersection Observer for further optimization
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement
          if (entry.isIntersecting) {
            // Element is visible - ensure it's rendered
            element.style.visibility = 'visible'
          } else {
            // Element is not visible - can be optimized
            element.style.visibility = 'hidden'
          }
        })
      },
      { threshold }
    )

    return () => {
      observerRef.current?.disconnect()
    }
  }, [enabled, threshold])

  // Register element for observation
  const registerElement = useCallback((element: HTMLElement) => {
    if (observerRef.current && element) {
      observerRef.current.observe(element)
    }
  }, [])

  // Unregister element
  const unregisterElement = useCallback((element: HTMLElement) => {
    if (observerRef.current && element) {
      observerRef.current.unobserve(element)
    }
  }, [])

  // Get visible nodes
  const visibleNodes = useMemo(() => {
    if (!isVirtualized) return documentNodes
    
    return documentNodes.slice(viewportState.startIndex, viewportState.endIndex + 1)
  }, [isVirtualized, documentNodes, viewportState.startIndex, viewportState.endIndex])

  // Calculate offset for virtual scrolling
  const offsetY = useMemo(() => {
    if (!isVirtualized) return 0
    
    return documentNodes
      .slice(0, viewportState.startIndex)
      .reduce((sum, node) => sum + node.height, 0)
  }, [isVirtualized, documentNodes, viewportState.startIndex])

  return {
    containerRef,
    viewportState,
    isVirtualized,
    visibleNodes,
    offsetY,
    registerElement,
    unregisterElement,
    documentStats: {
      totalNodes: documentNodes.length,
      visibleNodes: visibleNodes.length,
      totalHeight: viewportState.totalHeight,
      isOptimized: isVirtualized
    }
  }
}

export default useViewportOptimization