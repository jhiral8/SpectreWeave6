import { BubbleMenu as BaseBubbleMenu } from '@tiptap/react/menus'
import React, { useCallback, useState } from 'react'
import type { ComponentType } from 'react'

import { MenuProps } from '../types'
import { LinkPreviewPanel } from '@/components/panels/LinkPreviewPanel'
import { LinkEditorPanel } from '@/components/panels'

export const LinkMenu = ({ editor, appendTo }: MenuProps): JSX.Element => {
  const [showEdit, setShowEdit] = useState(false)
  const BubbleAny = BaseBubbleMenu as unknown as ComponentType<any>

  const shouldShow = useCallback(() => {
    const isActive = editor.isActive('link')
    return isActive
  }, [editor])

  const { href: link, target } = editor.getAttributes('link')

  const handleEdit = useCallback(() => {
    setShowEdit(true)
  }, [])

  const onSetLink = useCallback(
    (url: string, openInNewTab?: boolean) => {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url, target: openInNewTab ? '_blank' : '' })
        .run()
      setShowEdit(false)
    },
    [editor],
  )

  const onUnsetLink = useCallback(() => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setShowEdit(false)
    return null
  }, [editor])

  const onShowEdit = useCallback(() => {
    setShowEdit(true)
  }, [])

  const onHideEdit = useCallback(() => {
    setShowEdit(false)
  }, [])

  return (
    <BubbleAny
      editor={editor}
      pluginKey="textMenu"
      shouldShow={shouldShow}
      updateDelay={0}
    >
      {showEdit ? (
        <LinkEditorPanel initialUrl={link} initialOpenInNewTab={target === '_blank'} onSetLink={onSetLink} />
      ) : (
        <LinkPreviewPanel url={link} onClear={onUnsetLink} onEdit={handleEdit} />
      )}
    </BubbleAny>
  )
}

export default LinkMenu
