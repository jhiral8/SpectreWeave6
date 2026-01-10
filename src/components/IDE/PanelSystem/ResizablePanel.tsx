'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResizablePanelProps {
  children: React.ReactNode;
  position: 'left' | 'right' | 'bottom';
  size: number;
  isVisible: boolean;
  onResize: (size: number) => void;
  minSize?: number;
  maxSize?: number;
  className?: string;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  position,
  size,
  isVisible,
  onResize,
  minSize = 200,
  maxSize = 600,
  className,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const startPosRef = useRef<number>(0);
  const startSizeRef = useRef<number>(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    if (position === 'bottom') {
      startPosRef.current = e.clientY;
    } else {
      startPosRef.current = e.clientX;
    }
    
    startSizeRef.current = size;
  }, [position, size]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    let delta: number;
    
    if (position === 'bottom') {
      // Bottom panel: drag up to increase
      delta = startPosRef.current - e.clientY;
    } else if (position === 'left') {
      // Left panel: drag right to increase
      delta = e.clientX - startPosRef.current;
    } else {
      // Right panel: drag left to increase
      delta = startPosRef.current - e.clientX;
    }
    
    const newSize = startSizeRef.current + delta;
    const clampedSize = Math.max(minSize, Math.min(maxSize, newSize));
    
    onResize(clampedSize);
  }, [isResizing, position, minSize, maxSize, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = position === 'bottom' ? 'ns-resize' : 'ew-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp, position]);

  if (!isVisible) return null;

  const getResizeHandlePosition = () => {
    if (position === 'left') return 'right-0 top-0 h-full w-1 cursor-ew-resize';
    if (position === 'right') return 'left-0 top-0 h-full w-1 cursor-ew-resize';
    if (position === 'bottom') return 'top-0 left-0 w-full h-1 cursor-ns-resize';
    return '';
  };

  const getPanelStyle = () => {
    if (position === 'bottom') {
      return { height: `${size}px` };
    }
    return { width: `${size}px` };
  };

  return (
    <div
      ref={panelRef}
      className={cn(
        'relative flex-shrink-0',
        'bg-[--ide-sidebar-bg] border-[--ide-border]',
        position === 'left' && 'border-r',
        position === 'right' && 'border-l',
        position === 'bottom' && 'border-t',
        className
      )}
      style={getPanelStyle()}
    >
      {children}
      
      {/* Resize handle */}
      <div
        className={cn(
          'absolute z-10 resize-handle',
          'hover:bg-[--ide-accent] transition-colors',
          'group',
          getResizeHandlePosition()
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Visual indicator on hover */}
        <div className={cn(
          'absolute bg-[--ide-accent] opacity-0 group-hover:opacity-100 transition-opacity',
          position === 'bottom' ? 'inset-x-0 h-0.5' : 'inset-y-0 w-0.5'
        )} />
      </div>
    </div>
  );
};
