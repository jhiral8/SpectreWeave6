import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FrameworkConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  frameworkName: string
  className?: string
}

export const FrameworkConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  frameworkName,
  className
}: FrameworkConfirmModalProps) => {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'w-full max-w-md bg-white dark:bg-neutral-900',
          'border border-neutral-200 dark:border-neutral-700',
          'rounded-lg shadow-xl overflow-hidden',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Replace Framework Content?
              </h2>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-neutral-700 dark:text-neutral-300 mb-4">
            Applying <span className="font-semibold text-neutral-900 dark:text-neutral-100">"{frameworkName}"</span> will replace your current Story Framework content.
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-6">
            ⚠️ This action cannot be undone. Your existing framework notes will be permanently lost.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              "text-neutral-700 dark:text-neutral-300",
              "hover:bg-neutral-100 dark:hover:bg-neutral-800"
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              "bg-red-600 hover:bg-red-700 text-white",
              "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            )}
          >
            Replace Content
          </button>
        </div>
      </div>
    </div>
  )
}

export default FrameworkConfirmModal