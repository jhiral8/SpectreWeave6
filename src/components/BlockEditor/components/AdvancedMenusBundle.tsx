'use client'

import React from 'react'
import { Editor } from '@tiptap/react'
import ImageBlockMenu from '@/extensions/ImageBlock/components/ImageBlockMenu'
import { ColumnsMenu } from '@/extensions/MultiColumn/menus'
import { TableColumnMenu, TableRowMenu } from '@/extensions/Table/menus'

interface AdvancedMenusBundleProps {
  editor: Editor
  menuContainerRef: React.RefObject<HTMLElement>
}

// Bundle advanced menus together to reduce the number of dynamic imports
const AdvancedMenusBundle: React.FC<AdvancedMenusBundleProps> = ({ 
  editor, 
  menuContainerRef 
}) => {
  return (
    <>
      <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
      <TableRowMenu editor={editor} appendTo={menuContainerRef} />
      <TableColumnMenu editor={editor} appendTo={menuContainerRef} />
      <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
    </>
  )
}

export default AdvancedMenusBundle