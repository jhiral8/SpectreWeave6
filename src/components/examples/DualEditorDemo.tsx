'use client'

import React, { useState, useMemo } from 'react'
import { Doc as YDoc } from 'yjs'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import { BlockEditor } from '@/components/BlockEditor/BlockEditor'
import { SurfaceSwitcher } from '@/components/DualWritingSurface'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'

interface DualEditorDemoProps {
  roomName?: string
  user?: any
}

/**
 * Comprehensive demonstration of dual writing surface integration
 * 
 * Features demonstrated:
 * - Single vs Dual editor mode switching
 * - Surface switcher variants
 * - Y.js document management for both surfaces
 * - Provider setup for collaboration
 * - Integration with existing sidebar and AI features
 */
export const DualEditorDemo: React.FC<DualEditorDemoProps> = ({
  roomName = 'demo-room',
  user
}) => {
  const [editorMode, setEditorMode] = useState<'single' | 'dual'>('single')
  const [switcherVariant, setSwitcherVariant] = useState<'default' | 'floating' | 'compact' | 'pills'>('floating')
  const [enableFramework, setEnableFramework] = useState(true)
  const [showSwitcher, setShowSwitcher] = useState(true)

  // Y.js documents for both surfaces
  const manuscriptYdoc = useMemo(() => new YDoc(), [])
  const frameworkYdoc = useMemo(() => new YDoc(), [])

  // Optional: Collaboration providers (would be set up based on your backend)
  const manuscriptProvider = useMemo(() => {
    // Example: return new TiptapCollabProvider({ ... })
    return null // Set to null for local-only demo
  }, [roomName])

  const frameworkProvider = useMemo(() => {
    // Example: return new TiptapCollabProvider({ ... })
    return null // Set to null for local-only demo
  }, [roomName])

  return (
    <div className="h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      {/* Demo Controls Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Dual Writing Surface Demo
          </h1>
          
          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Mode:</span>
            <Button
              size="sm"
              variant={editorMode === 'single' ? 'default' : 'ghost'}
              onClick={() => setEditorMode('single')}
            >
              Single
            </Button>
            <Button
              size="sm"
              variant={editorMode === 'dual' ? 'default' : 'ghost'}
              onClick={() => setEditorMode('dual')}
            >
              Dual
            </Button>
          </div>

          {/* Dual Mode Controls */}
          {editorMode === 'dual' && (
            <>
              <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600" />
              
              {/* Surface Switcher Variant */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Switcher:</span>
                <select
                  value={switcherVariant}
                  onChange={(e) => setSwitcherVariant(e.target.value as any)}
                  className="text-sm px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="floating">Floating</option>
                  <option value="default">Default</option>
                  <option value="compact">Compact</option>
                  <option value="pills">Pills</option>
                </select>
              </div>

              {/* Framework Editor Toggle */}
              <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={enableFramework}
                  onChange={(e) => setEnableFramework(e.target.checked)}
                  className="rounded border-neutral-300 dark:border-neutral-600"
                />
                Enable Framework Editor
              </label>

              {/* Show Switcher Toggle */}
              <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={showSwitcher}
                  onChange={(e) => setShowSwitcher(e.target.checked)}
                  className="rounded border-neutral-300 dark:border-neutral-600"
                />
                Show Switcher
              </label>
            </>
          )}
        </div>

        {/* Info */}
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <Icon name="Info" className="w-4 h-4" />
          <span>
            {editorMode === 'single' 
              ? 'Traditional single-editor experience'
              : 'Dual writing surfaces with manuscript & framework'
            }
          </span>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 relative">
        <BlockEditor
          // Core props
          ydoc={manuscriptYdoc}
          provider={manuscriptProvider}
          hasCollab={!!manuscriptProvider}
          user={user}
          
          // Dual mode props
          mode={editorMode}
          frameworkYdoc={frameworkYdoc}
          frameworkProvider={frameworkProvider}
          enableFrameworkEditor={enableFramework}
          showSurfaceSwitcher={showSwitcher}
          surfaceSwitcherVariant={switcherVariant}
        />
      </div>

      {/* Demo Features Info Panel */}
      <div className="absolute bottom-4 left-4 max-w-md bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 p-4 opacity-90 hover:opacity-100 transition-opacity">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
          <Icon name="Zap" className="w-4 h-4 text-blue-500" />
          Features Available
        </h3>
        <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
          <li className="flex items-center gap-2">
            <Icon name="Check" className="w-3 h-3 text-green-500" />
            <span>Existing sidebars (chapters, AI chat)</span>
          </li>
          <li className="flex items-center gap-2">
            <Icon name="Check" className="w-3 h-3 text-green-500" />
            <span>Surface-aware TextMenu with indicators</span>
          </li>
          <li className="flex items-center gap-2">
            <Icon name="Check" className="w-3 h-3 text-green-500" />
            <span>Responsive design (mobile/desktop)</span>
          </li>
          <li className="flex items-center gap-2">
            <Icon name="Check" className="w-3 h-3 text-green-500" />
            <span>Keyboard shortcuts (Cmd/Ctrl + Tab)</span>
          </li>
          <li className="flex items-center gap-2">
            <Icon name="Check" className="w-3 h-3 text-green-500" />
            <span>Memory efficient dual editors</span>
          </li>
          <li className="flex items-center gap-2">
            <Icon name="Check" className="w-3 h-3 text-green-500" />
            <span>Backward compatibility with single mode</span>
          </li>
        </ul>
        
        {editorMode === 'dual' && (
          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              💡 Use <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded text-xs">Cmd + Tab</kbd> to switch surfaces
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DualEditorDemo