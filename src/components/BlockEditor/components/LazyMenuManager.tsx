'use client'

import React, { Suspense } from 'react'
import { Editor } from '@tiptap/react'
import dynamic from 'next/dynamic'

// Lazy load menu components
const LinkMenu = dynamic(() => import('@/components/menus').then(mod => ({ default: mod.LinkMenu })))
const TextMenu = dynamic(() => import('@/components/menus/TextMenu').then(mod => ({ default: mod.TextMenu })))
const ContentItemMenu = dynamic(() => import('@/components/menus/ContentItemMenu').then(mod => ({ default: mod.ContentItemMenu })))
const CustomAIToolbar = dynamic(() => import('@/components/editor/AIToolbar/CustomAIToolbar').then(mod => ({ default: mod.CustomAIToolbar })))
const ImageBlockMenu = dynamic(() => import('@/extensions/ImageBlock/components/ImageBlockMenu'))
const ColumnsMenu = dynamic(() => import('@/extensions/MultiColumn/menus').then(mod => ({ default: mod.ColumnsMenu })))
const TableColumnMenu = dynamic(() => import('@/extensions/Table/menus').then(mod => ({ default: mod.TableColumnMenu })))
const TableRowMenu = dynamic(() => import('@/extensions/Table/menus').then(mod => ({ default: mod.TableRowMenu })))

export type ViewMode = 'manuscript' | 'framework' | 'dual'

interface LazyMenuManagerProps {
  viewMode: ViewMode
  manuscriptEditor?: Editor | null
  frameworkEditor?: Editor | null
  activeEditor?: Editor | null
  menuContainerRef: React.RefObject<HTMLElement>
}

const MenuLoadingSkeleton = () => (
  <div className="animate-pulse flex space-x-2 p-2">
    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
)

export const LazyMenuManager = React.memo(({
  viewMode,
  manuscriptEditor,
  frameworkEditor,
  activeEditor,
  menuContainerRef
}: LazyMenuManagerProps) => {
  const currentEditor = viewMode === 'manuscript' ? manuscriptEditor : 
                       viewMode === 'framework' ? frameworkEditor : 
                       activeEditor

  if (!currentEditor) {
    return null
  }

  return (
    <Suspense fallback={<MenuLoadingSkeleton />}>
      {/* Core menus that are always needed */}
      <TextMenu editor={currentEditor} />
      <CustomAIToolbar editor={currentEditor} />
      
      {/* Advanced menus - loaded on demand */}
      <Suspense fallback={null}>
        <ColumnsMenu editor={currentEditor} appendTo={menuContainerRef} />
        <TableRowMenu editor={currentEditor} appendTo={menuContainerRef} />
        <TableColumnMenu editor={currentEditor} appendTo={menuContainerRef} />
        <ImageBlockMenu editor={currentEditor} appendTo={menuContainerRef} />
      </Suspense>
      
      {/* Positioned menus */}
      <div className="flex justify-center">
        <Suspense fallback={null}>
          <LinkMenu editor={activeEditor} appendTo={menuContainerRef} />
          <ContentItemMenu editor={activeEditor} />
        </Suspense>
      </div>
    </Suspense>
  )
})

LazyMenuManager.displayName = 'LazyMenuManager'

export default LazyMenuManager