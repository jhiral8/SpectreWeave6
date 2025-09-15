'use client'

import React from 'react'
import { Editor } from '@tiptap/react'
import { LinkMenu } from '@/components/menus'
import { TextMenu } from '@/components/menus/TextMenu'
import { ContentItemMenu } from '@/components/menus/ContentItemMenu'
import { CustomAIToolbar } from '@/components/editor/AIToolbar/CustomAIToolbar'
import ImageBlockMenu from '@/extensions/ImageBlock/components/ImageBlockMenu'
import { ColumnsMenu } from '@/extensions/MultiColumn/menus'
import { TableColumnMenu, TableRowMenu } from '@/extensions/Table/menus'

export type ViewMode = 'manuscript' | 'framework' | 'dual'

interface MenuManagerProps {
  viewMode: ViewMode
  manuscriptEditor?: Editor | null
  frameworkEditor?: Editor | null
  activeEditor?: Editor | null
  menuContainerRef: React.RefObject<HTMLElement>
}

export const MenuManager = React.memo(({
  viewMode,
  manuscriptEditor,
  frameworkEditor,
  activeEditor,
  menuContainerRef
}: MenuManagerProps) => {
  return (
    <>
      {/* Menus - Apply to correct editor based on view mode */}
      {viewMode === 'manuscript' && manuscriptEditor && (
        <>
          <TextMenu editor={manuscriptEditor} />
          <CustomAIToolbar editor={manuscriptEditor} />
          <ColumnsMenu editor={manuscriptEditor} appendTo={menuContainerRef} />
          <TableRowMenu editor={manuscriptEditor} appendTo={menuContainerRef} />
          <TableColumnMenu editor={manuscriptEditor} appendTo={menuContainerRef} />
          <ImageBlockMenu editor={manuscriptEditor} appendTo={menuContainerRef} />
        </>
      )}
      {viewMode === 'framework' && frameworkEditor && (
        <>
          <TextMenu editor={frameworkEditor} />
          <CustomAIToolbar editor={frameworkEditor} />
          <ColumnsMenu editor={frameworkEditor} appendTo={menuContainerRef} />
          <TableRowMenu editor={frameworkEditor} appendTo={menuContainerRef} />
          <TableColumnMenu editor={frameworkEditor} appendTo={menuContainerRef} />
          <ImageBlockMenu editor={frameworkEditor} appendTo={menuContainerRef} />
        </>
      )}
      {viewMode === 'dual' && activeEditor && (
        <>
          <TextMenu editor={activeEditor} />
          <CustomAIToolbar editor={activeEditor} />
          <ColumnsMenu editor={activeEditor} appendTo={menuContainerRef} />
          <TableRowMenu editor={activeEditor} appendTo={menuContainerRef} />
          <TableColumnMenu editor={activeEditor} appendTo={menuContainerRef} />
          <ImageBlockMenu editor={activeEditor} appendTo={menuContainerRef} />
        </>
      )}
    
      <div className="flex justify-center">
        <LinkMenu editor={activeEditor} appendTo={menuContainerRef} />
        <ContentItemMenu editor={activeEditor} />
      </div>
    </>
  )
})

MenuManager.displayName = 'MenuManager'

export default MenuManager