import React, { useRef, useState } from 'react'
import { EditorContent } from '@tiptap/react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Import TipTap styles
import '@/styles/index.css'
import { SurfaceSwitcher, Surface } from '@/components/ui/SurfaceSwitcher'
import FrameworkToolbarVertical from '@/components/ui/FrameworkToolbarVertical'
import FrameworkToolbarBottom from '@/components/ui/FrameworkToolbarBottom'
import { markdownToHtml } from '@/lib/utils/markdownToHtml'
import { useDualEditors } from '@/hooks/useDualEditors'
import { TextMenu } from '@/components/menus/TextMenu'
// import { CustomAIToolbar } from '@/components/editor/AIToolbar/CustomAIToolbar'
import { ColumnsMenu } from '@/extensions/MultiColumn/menus'
import { TableColumnMenu, TableRowMenu } from '@/extensions/Table/menus'
import ImageBlockMenu from '@/extensions/ImageBlock/components/ImageBlockMenu'
import { WritingFramework } from '@/types/story-frameworks'
import { WritingSurface } from '@/lib/ai/dualSurfaceContextManager'

interface DualWritingSurfaceProps {
  className?: string
}

export const DualWritingSurface = ({ className }: DualWritingSurfaceProps) => {
  const menuContainerRef = useRef(null)
  const [activeFramework, setActiveFramework] = useState<string | undefined>()
  
  const { 
    manuscriptEditor, 
    frameworkEditor, 
    activeSurface, 
    switchSurface,
    activeEditor 
  } = useDualEditors()

  // Framework handlers
  const handleFrameworkSelect = (framework: WritingFramework) => {
    if (!frameworkEditor) return
    
    // Check if there's existing content and confirm before overwriting
    const currentContent = frameworkEditor.getHTML()
    const hasContent = currentContent && currentContent.trim() !== '' && currentContent !== '<p></p>'
    
    if (hasContent) {
      const confirmed = window.confirm(
        `Applying "${framework.name}" will replace your current Story Framework content.\n\nThis action cannot be undone. Do you want to continue?`
      )
      if (!confirmed) return
    }
    
    setActiveFramework(framework.id)
    
    // Convert markdown template to HTML and insert into the framework editor
    const htmlContent = markdownToHtml(framework.template)
    frameworkEditor.commands.setContent(htmlContent)
    frameworkEditor.commands.focus()
  }

  const handleClearFramework = () => {
    setActiveFramework(undefined)
    
    // Clear the framework editor content
    if (frameworkEditor) {
      frameworkEditor.commands.clearContent()
      frameworkEditor.commands.focus()
    }
  }

  if (!manuscriptEditor || !frameworkEditor) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading editors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('h-full flex flex-col', className)} ref={menuContainerRef}>
      {/* Header with Surface Switcher */}
      <div className="flex-shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Dual Writing Surface Demo
            </h1>
            <SurfaceSwitcher 
              activeSurface={activeSurface}
              onSurfaceChange={switchSurface}
              variant="floating"
            />
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Press <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded">Ctrl+Tab</kbd> to switch
          </div>
        </div>
      </div>

      {/* Editor Area with Smooth Framer Motion Transitions */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeSurface === 'manuscript' && (
            <motion.div
              key="manuscript"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.3, 
                ease: [0.4, 0.0, 0.2, 1] // Custom easing curve
              }}
              className="absolute inset-0"
            >
              <div className="h-full flex flex-col">
                {/* Surface Indicator */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  className="flex-shrink-0 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center space-x-2">
                    <motion.div 
                      className="w-3 h-3 rounded-full bg-blue-500"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Manuscript - Main story content
                    </span>
                  </div>
                </motion.div>
                
                {/* Editor */}
                <div className="flex-1 overflow-y-auto">
                  <EditorContent 
                    editor={manuscriptEditor}
                    className="h-full overflow-y-auto overflow-x-hidden touch-manipulation p-4"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeSurface === 'framework' && (
            <motion.div
              key="framework"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.3, 
                ease: [0.4, 0.0, 0.2, 1] // Custom easing curve
              }}
              className="absolute inset-0"
            >
              <div className="h-full flex flex-col">
                {/* Surface Indicator */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  className="flex-shrink-0 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-center space-x-2">
                    <motion.div 
                      className="w-3 h-3 rounded-full bg-purple-500"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Story Framework - Characters, plot, world-building
                    </span>
                  </div>
                </motion.div>
                
                
                {/* Editor */}
                <div className="flex-1 overflow-y-auto">
                  <EditorContent 
                    editor={frameworkEditor}
                    className="h-full overflow-y-auto overflow-x-hidden touch-manipulation p-4"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Framework Toolbars - Only show when framework surface is active */}
      {activeSurface === 'framework' && (
        <>
          <FrameworkToolbarVertical
            onFrameworkSelect={handleFrameworkSelect}
            onClearFramework={handleClearFramework}
            activeFramework={activeFramework}
          />
          <FrameworkToolbarBottom
            onFrameworkSelect={handleFrameworkSelect}
            onClearFramework={handleClearFramework}
            activeFramework={activeFramework}
          />
        </>
      )}

      {/* Editor Menus (attached to active editor) */}
      {activeEditor && (
        <>
          <TextMenu editor={activeEditor} />
          {/* <CustomAIToolbar editor={activeEditor} /> */}
          <ColumnsMenu editor={activeEditor} appendTo={menuContainerRef} />
          <TableRowMenu editor={activeEditor} appendTo={menuContainerRef} />
          <TableColumnMenu editor={activeEditor} appendTo={menuContainerRef} />
          <ImageBlockMenu editor={activeEditor} appendTo={menuContainerRef} />
        </>
      )}
    </div>
  )
}

// Re-export the WritingSurface type for convenience
export type { WritingSurface }