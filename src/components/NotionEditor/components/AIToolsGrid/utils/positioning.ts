import { SelectionBounds } from '../hooks/useTextSelection'

export interface Position {
  x: number
  y: number
}

export interface PositioningOptions {
  selectionBounds: SelectionBounds
  toolbarWidth: number
  toolbarHeight: number
  offset?: number
  viewport?: {
    width: number
    height: number
    scrollX: number
    scrollY: number
  }
}

export type PositionStrategy = 'above' | 'below' | 'left' | 'right' | 'center'

/**
 * Calculate optimal position for floating toolbar relative to text selection
 */
export function calculateToolbarPosition({
  selectionBounds,
  toolbarWidth,
  toolbarHeight,
  offset = 10,
  viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  }
}: PositioningOptions): Position & { strategy: PositionStrategy } {
  const { top, left, width, height } = selectionBounds
  const margin = 10 // Minimum margin from viewport edges

  // Calculate ideal positions for each strategy
  const positions = {
    above: {
      x: left + width / 2 - toolbarWidth / 2,
      y: top - toolbarHeight - offset,
      strategy: 'above' as const,
    },
    below: {
      x: left + width / 2 - toolbarWidth / 2,
      y: top + height + offset,
      strategy: 'below' as const,
    },
    left: {
      x: left - toolbarWidth - offset,
      y: top + height / 2 - toolbarHeight / 2,
      strategy: 'left' as const,
    },
    right: {
      x: left + width + offset,
      y: top + height / 2 - toolbarHeight / 2,
      strategy: 'right' as const,
    },
    center: {
      x: left + width / 2 - toolbarWidth / 2,
      y: top + height / 2 - toolbarHeight / 2,
      strategy: 'center' as const,
    },
  }

  // Check which positions fit within viewport
  const fitsInViewport = (pos: Position): boolean => {
    const adjustedX = pos.x - viewport.scrollX
    const adjustedY = pos.y - viewport.scrollY

    return (
      adjustedX >= margin &&
      adjustedX + toolbarWidth <= viewport.width - margin &&
      adjustedY >= margin &&
      adjustedY + toolbarHeight <= viewport.height - margin
    )
  }

  // Preferred order: above, below, right, left, center
  const preferredOrder: PositionStrategy[] = ['above', 'below', 'right', 'left', 'center']

  // Find the first position that fits
  for (const strategy of preferredOrder) {
    const position = positions[strategy]
    if (fitsInViewport(position)) {
      return position
    }
  }

  // If no position fits perfectly, use the best-fitting position with adjustments
  let bestPosition = positions.above

  // Adjust horizontal position to fit
  if (bestPosition.x < margin + viewport.scrollX) {
    bestPosition.x = margin + viewport.scrollX
  } else if (bestPosition.x + toolbarWidth > viewport.width - margin + viewport.scrollX) {
    bestPosition.x = viewport.width - margin - toolbarWidth + viewport.scrollX
  }

  // Adjust vertical position to fit
  if (bestPosition.y < margin + viewport.scrollY) {
    bestPosition.y = positions.below.y // Try below instead
    if (bestPosition.y + toolbarHeight > viewport.height - margin + viewport.scrollY) {
      bestPosition.y = viewport.height - margin - toolbarHeight + viewport.scrollY
    }
  } else if (bestPosition.y + toolbarHeight > viewport.height - margin + viewport.scrollY) {
    bestPosition.y = positions.above.y // Try above instead
    if (bestPosition.y < margin + viewport.scrollY) {
      bestPosition.y = margin + viewport.scrollY
    }
  }

  return bestPosition
}

/**
 * Calculate position with smart repositioning based on available space
 */
export function calculateSmartPosition(options: PositioningOptions): Position {
  const position = calculateToolbarPosition(options)
  return { x: position.x, y: position.y }
}

/**
 * Check if a position would cause the toolbar to overflow the viewport
 */
export function wouldOverflow(
  position: Position,
  toolbarWidth: number,
  toolbarHeight: number,
  viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  }
): boolean {
  const adjustedX = position.x - viewport.scrollX
  const adjustedY = position.y - viewport.scrollY

  return (
    adjustedX < 0 ||
    adjustedY < 0 ||
    adjustedX + toolbarWidth > viewport.width ||
    adjustedY + toolbarHeight > viewport.height
  )
}

/**
 * Constrain position to viewport bounds
 */
export function constrainToViewport(
  position: Position,
  toolbarWidth: number,
  toolbarHeight: number,
  margin = 10,
  viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  }
): Position {
  const minX = margin + viewport.scrollX
  const minY = margin + viewport.scrollY
  const maxX = viewport.width - toolbarWidth - margin + viewport.scrollX
  const maxY = viewport.height - toolbarHeight - margin + viewport.scrollY

  return {
    x: Math.max(minX, Math.min(maxX, position.x)),
    y: Math.max(minY, Math.min(maxY, position.y)),
  }
}

/**
 * Calculate position with animation considerations
 */
export function calculateAnimatedPosition(
  currentPosition: Position | null,
  targetPosition: Position,
  threshold = 10
): Position {
  // If no current position, return target immediately
  if (!currentPosition) return targetPosition

  // If positions are close enough, don't animate
  const dx = Math.abs(targetPosition.x - currentPosition.x)
  const dy = Math.abs(targetPosition.y - currentPosition.y)

  if (dx < threshold && dy < threshold) {
    return currentPosition
  }

  return targetPosition
}

/**
 * Get viewport information
 */
export function getViewportInfo() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  }
}

/**
 * Check if selection is near viewport edges
 */
export function isSelectionNearEdge(
  selectionBounds: SelectionBounds,
  threshold = 100,
  viewport = getViewportInfo()
): {
  nearTop: boolean
  nearBottom: boolean
  nearLeft: boolean
  nearRight: boolean
} {
  const adjustedTop = selectionBounds.top - viewport.scrollY
  const adjustedLeft = selectionBounds.left - viewport.scrollX
  const adjustedBottom = adjustedTop + selectionBounds.height
  const adjustedRight = adjustedLeft + selectionBounds.width

  return {
    nearTop: adjustedTop < threshold,
    nearBottom: adjustedBottom > viewport.height - threshold,
    nearLeft: adjustedLeft < threshold,
    nearRight: adjustedRight > viewport.width - threshold,
  }
}