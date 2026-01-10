'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDualEditor } from '../context/SplitEditorContext'
import { useViewState } from '../context/UnifiedEditorContext'
import { ManuscriptSurface } from './ManuscriptSurface'
import { FrameworkSurface } from './FrameworkSurface'
import { PanelLeftOpen, PanelLeftClose, Pin, PinOff, X } from 'lucide-react'

// Drawer Toggle Button Component - Compact inline toggle
const DrawerToggle = ({ 
  isOpen, 
  onToggle 
}: { 
  isOpen: boolean
  onToggle: () => void
}) => {
  return (
    <motion.button
      onClick={onToggle}
      className="flex items-center gap-2 px-2 py-1 rounded-md bg-[--muted]/50 border border-[--border] 
                 hover:bg-[--muted] transition-colors group"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      title={isOpen ? "Close Framework Panel" : "Open Framework Panel"}
    >
      {isOpen ? (
        <PanelLeftClose className="w-3.5 h-3.5 text-[--muted-foreground] group-hover:text-[--foreground]" />
      ) : (
        <PanelLeftOpen className="w-3.5 h-3.5 text-[--muted-foreground] group-hover:text-[--foreground]" />
      )}
      <span className="text-[10px] font-medium uppercase tracking-wider text-[--muted-foreground] group-hover:text-[--foreground]">
        {isOpen ? 'Close Framework' : 'Open Framework'}
      </span>
    </motion.button>
  )
}
// Overlay for floating drawer
const DrawerOverlay = ({ onClick }: { onClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClick}
    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
  />
)

export const DualSurfaceView = React.memo(() => {
  const { 
    manuscriptEditor,
    frameworkEditor,
    manuscriptBorder,
    frameworkBorder,
    frameworkManager,
    editorRef
  } = useDualEditor()
  
  const { isDrawerOpen, setIsDrawerOpen, isDrawerPinned, setIsDrawerPinned } = useViewState()

  const handleToggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen)
  }

  const handlePinDrawer = () => {
    setIsDrawerPinned(!isDrawerPinned)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setIsDrawerPinned(false)
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Overlay for floating drawer (non-pinned) */}
      <AnimatePresence>
        {isDrawerOpen && !isDrawerPinned && (
          <DrawerOverlay onClick={handleCloseDrawer} />
        )}
      </AnimatePresence>

      {/* Main Layout Container - no left padding, manuscript fills space */}
      <div className="h-full flex overflow-hidden">
        
        {/* Framework Drawer */}
        <AnimatePresence initial={false}>
          {isDrawerOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 400 }}
              className={`
                ${isDrawerPinned 
                  ? 'relative flex-shrink-0 z-30' 
                  : 'fixed left-0 top-[56px] bottom-0 z-50'
                }
                bg-[--background] border-r border-[--border] shadow-2xl
                flex flex-col overflow-hidden
              `}
              style={{ 
                height: isDrawerPinned ? '100%' : 'auto',
                width: isDrawerPinned ? undefined : 400 // Fixed width for floating mode
              }}
            >
              {/* Inner container to prevent content squishing during width animation */}
              <div className="w-[400px] h-full flex flex-col flex-shrink-0">
                {/* Drawer Header */}
                <div className="flex-shrink-0 h-12 px-4 flex items-center justify-between border-b border-[--border] bg-[--muted]/50">
                  <span className="text-sm font-medium text-[--foreground]" style={{ fontFamily: 'Surgena, sans-serif' }}>
                    Story Framework
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePinDrawer}
                      className={`p-1.5 rounded hover:bg-[--muted] transition-colors ${
                        isDrawerPinned ? 'text-blue-500' : 'text-[--muted-foreground]'
                      }`}
                      title={isDrawerPinned ? "Unpin" : "Pin"}
                    >
                      {isDrawerPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleCloseDrawer}
                      className="p-1.5 rounded hover:bg-[--muted] transition-colors text-[--muted-foreground]"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Framework Editor Content */}
                <div className="flex-1 min-h-0 overflow-auto">
                  <FrameworkSurface
                    editor={frameworkEditor}
                    borderClasses=""
                    cssVariables={frameworkBorder.getCSSVariables()}
                    showToolbar={false}
                    toolbarPosition="external"
                    onFrameworkSelect={(framework) => frameworkManager.applyFramework(framework)}
                    onClearFramework={frameworkManager.clearFramework}
                    activeFramework={frameworkManager.activeFramework}
                    fullWidth={true}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Manuscript Surface - Takes remaining width */}
        <motion.div 
          layout
          transition={{ type: 'spring', damping: 28, stiffness: 400 }}
          className="flex-1 h-full p-2 lg:p-3 min-w-0"
        >
          <ManuscriptSurface
            editor={manuscriptEditor}
            editorRef={editorRef}
            borderClasses={manuscriptBorder.getManuscriptClasses()}
            cssVariables={manuscriptBorder.getCSSVariables()}
            fullWidth={true}
            expandToFill={true}
            headerActions={
              <DrawerToggle 
                isOpen={isDrawerOpen}
                onToggle={handleToggleDrawer}
              />
            }
          />
        </motion.div>
      </div>
    </div>
  )
})

DualSurfaceView.displayName = 'DualSurfaceView'