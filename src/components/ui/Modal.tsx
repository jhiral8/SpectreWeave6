'use client'

import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = 'md',
  showCloseButton = true
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={cn(
          'w-full bg-white dark:bg-neutral-900',
          'border border-neutral-200 dark:border-neutral-700',
          'rounded-lg shadow-xl overflow-hidden',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          sizeClasses[size],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 id="modal-title" className="text-lg font-semibold text-black dark:text-white">
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Close modal"
              >
                <XIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
              </button>
            )}
          </div>
        )}
        
        <div className={cn(title ? 'p-6' : 'p-6')}>
          {children}
        </div>
      </div>
    </div>
  )
}

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)