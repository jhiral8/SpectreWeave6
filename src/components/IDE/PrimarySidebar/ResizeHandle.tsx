'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResizeHandleProps {
  /** Position of the handle */
  position: 'left' | 'right';
  /** Current size */
  size: number;
  /** Minimum size */
  minSize?: number;
  /** Maximum size */
  maxSize?: number;
  /** Callback when size changes */
  onResize: (size: number) => void;
  /** Whether resize is disabled */
  disabled?: boolean;
}

/**
 * Resize Handle Component
 * 
 * Draggable handle for resizing panels.
 * 
 * Features:
 * - Drag to resize
 * - Double-click to reset
 * - Visual feedback on hover/drag
 */
export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  position,
  size,
  minSize = 170,
  maxSize = 500,
  onResize,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startSizeRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startSizeRef.current = size;
  }, [disabled, size]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = position === 'right' 
        ? startXRef.current - e.clientX 
        : e.clientX - startXRef.current;
      
      const newSize = Math.max(minSize, Math.min(maxSize, startSizeRef.current + delta));
      onResize(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position, minSize, maxSize, onResize]);

  const handleDoubleClick = useCallback(() => {
    // Reset to default size (250px)
    onResize(250);
  }, [onResize]);

  return (
    <div
      className={cn(
        'vscode-resize-handle',
        'absolute top-0 bottom-0 z-10',
        'w-[4px] cursor-col-resize',
        'hover:bg-[var(--ide-accent,#007fd4)]',
        isDragging && 'bg-[var(--ide-accent,#007fd4)]',
        position === 'left' ? 'right-0' : 'left-0',
        disabled && 'cursor-default pointer-events-none'
      )}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={size}
      aria-valuemin={minSize}
      aria-valuemax={maxSize}
    >
      {/* Invisible wider hit area */}
      <div className="absolute top-0 bottom-0 -left-1 -right-1" />
    </div>
  );
};

export default ResizeHandle;
