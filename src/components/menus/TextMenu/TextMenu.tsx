import { Icon } from '@/components/ui/Icon'
import { Toolbar } from '@/components/ui/Toolbar'
import { useTextmenuCommands } from './hooks/useTextmenuCommands'
import { useTextmenuStates } from './hooks/useTextmenuStates'
import { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import React, { memo, useState, useEffect, useMemo } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Surface } from '@/components/ui/Surface'
import { ColorPicker } from '@/components/panels'
import { FontFamilyPicker } from './components/FontFamilyPicker'
import { FontSizePicker } from './components/FontSizePicker'
import { useTextmenuContentTypes } from './hooks/useTextmenuContentTypes'
import { ContentTypePicker } from './components/ContentTypePicker'
import { EditLinkPopover } from './components/EditLinkPopover'
import { useEditorContext } from "@/contexts/EditorContext"

// We memorize the button so each button is not rerendered
// on every editor state change
const MemoButton = memo(Toolbar.Button)
const MemoColorPicker = memo(ColorPicker)
const MemoFontFamilyPicker = memo(FontFamilyPicker)
const MemoFontSizePicker = memo(FontSizePicker)
const MemoContentTypePicker = memo(ContentTypePicker)

export type TextMenuProps = {
  editor: Editor
}

export const TextMenu = ({ editor }: TextMenuProps) => {
  const commands = useTextmenuCommands(editor)
  const states = useTextmenuStates(editor)
  const blockOptions = useTextmenuContentTypes(editor)
  
  // Get dual editor context
  const editorContext = useEditorContext()
  const { isDualMode, activeSurface } = editorContext
  
  // Debug logging
  useEffect(() => {
    if (editor) {
      const checkSelection = () => {
        const { from, to, empty } = editor.state.selection
        const shouldShowMenu = states.shouldShow({ view: editor.view, from })
        console.log('🎨 TextMenu - Visibility Check:', {
          editorSurface: editor.view.dom.getAttribute('data-surface'),
          hasSelection: !empty,
          shouldShow: shouldShowMenu,
          editorEditable: editor.isEditable,
          editorFocused: editor.view.hasFocus(),
          from,
          to
        })
      }
      
      editor.on('selectionUpdate', checkSelection)
      return () => editor.off('selectionUpdate', checkSelection)
    }
  }, [editor, states.shouldShow])
  
  // Track screen size for responsive behavior
  const [isCompactMode, setIsCompactMode] = useState(false)
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsCompactMode(window.innerWidth < 1024)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Surface-specific styling and behavior
  const getSurfaceIndicator = () => {
    if (!isDualMode) return null
    
    return (
      <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
        <div className={`w-2 h-2 rounded-full ${
          activeSurface === 'manuscript' ? 'bg-blue-500' : 'bg-orange-500'
        }`} />
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          {activeSurface === 'manuscript' ? 'Manuscript' : 'Framework'}
        </span>
      </div>
    )
  }

  const getSurfaceStyles = () => {
    if (!isDualMode) return ''
    
    // Only add surface-specific border colors in dual mode
    return activeSurface === 'manuscript' 
      ? 'text-menu-manuscript'
      : 'text-menu-framework'
  }

  // Generate unique plugin key based on editor surface
  const pluginKey = useMemo(() => {
    const surface = editor?.view?.dom?.getAttribute?.('data-surface') || 'default'
    return `textMenu-${surface}`
  }, [editor])

  return (
    <BubbleMenu
      editor={editor}
      pluginKey={pluginKey}
      shouldShow={states.shouldShow}
      updateDelay={100}
      className={`text-menu-bubble ${getSurfaceStyles()}`}
      data-theme="textMenu"
      data-surface={isDualMode ? activeSurface : 'single'}
    >
      <Toolbar.Wrapper>
        {/* Surface indicator for dual mode */}
        {getSurfaceIndicator()}
        <MemoContentTypePicker options={blockOptions} />
        <MemoFontFamilyPicker onChange={commands.onSetFont} value={states.currentFont || ''} />
        <MemoFontSizePicker onChange={commands.onSetFontSize} value={states.currentSize || ''} />
        <Toolbar.Divider />
        <MemoButton tooltip="Bold" tooltipShortcut={['Mod', 'B']} onClick={commands.onBold} active={states.isBold}>
          <Icon name="Bold" />
        </MemoButton>
        <MemoButton
          tooltip="Italic"
          tooltipShortcut={['Mod', 'I']}
          onClick={commands.onItalic}
          active={states.isItalic}
        >
          <Icon name="Italic" />
        </MemoButton>
        <MemoButton
          tooltip="Underline"
          tooltipShortcut={['Mod', 'U']}
          onClick={commands.onUnderline}
          active={states.isUnderline}
        >
          <Icon name="Underline" />
        </MemoButton>
        <MemoButton
          tooltip="Strikehrough"
          tooltipShortcut={['Mod', 'Shift', 'S']}
          onClick={commands.onStrike}
          active={states.isStrike}
        >
          <Icon name="Strikethrough" />
        </MemoButton>
        <MemoButton tooltip="Code" tooltipShortcut={['Mod', 'E']} onClick={commands.onCode} active={states.isCode}>
          <Icon name="Code" />
        </MemoButton>
        <MemoButton tooltip="Code block" onClick={commands.onCodeBlock}>
          <Icon name="Code2" />
        </MemoButton>
        <EditLinkPopover onSetLink={commands.onLink} />
        <Popover.Root>
          <Popover.Trigger asChild>
            <MemoButton active={!!states.currentHighlight} tooltip="Highlight text">
              <Icon name="Highlighter" />
            </MemoButton>
          </Popover.Trigger>
          <Popover.Content side="top" sideOffset={8} asChild>
            <Surface className="p-1">
              <MemoColorPicker
                color={states.currentHighlight}
                onChange={commands.onChangeHighlight}
                onClear={commands.onClearHighlight}
              />
            </Surface>
          </Popover.Content>
        </Popover.Root>
        <Popover.Root>
          <Popover.Trigger asChild>
            <MemoButton active={!!states.currentColor} tooltip="Text color">
              <Icon name="Palette" />
            </MemoButton>
          </Popover.Trigger>
          <Popover.Content side="top" sideOffset={8} asChild>
            <Surface className="p-1">
              <MemoColorPicker
                color={states.currentColor}
                onChange={commands.onChangeColor}
                onClear={commands.onClearColor}
              />
            </Surface>
          </Popover.Content>
        </Popover.Root>
        {/* Show alignment buttons directly on larger screens */}
        {!isCompactMode && (
          <>
            <Toolbar.Divider />
            <MemoButton
              tooltip="Align left"
              tooltipShortcut={['Shift', 'Mod', 'L']}
              onClick={commands.onAlignLeft}
              active={states.isAlignLeft}
            >
              <Icon name="AlignLeft" />
            </MemoButton>
            <MemoButton
              tooltip="Align center"
              tooltipShortcut={['Shift', 'Mod', 'E']}
              onClick={commands.onAlignCenter}
              active={states.isAlignCenter}
            >
              <Icon name="AlignCenter" />
            </MemoButton>
            <MemoButton
              tooltip="Align right"
              tooltipShortcut={['Shift', 'Mod', 'R']}
              onClick={commands.onAlignRight}
              active={states.isAlignRight}
            >
              <Icon name="AlignRight" />
            </MemoButton>
            <MemoButton
              tooltip="Justify"
              tooltipShortcut={['Shift', 'Mod', 'J']}
              onClick={commands.onAlignJustify}
              active={states.isAlignJustify}
            >
              <Icon name="AlignJustify" />
            </MemoButton>
          </>
        )}
        
        <Popover.Root>
          <Popover.Trigger asChild>
            <MemoButton tooltip="More options">
              <Icon name="MoreVertical" />
            </MemoButton>
          </Popover.Trigger>
          <Popover.Content side="top" asChild>
            <Toolbar.Wrapper>
              <MemoButton
                tooltip="Subscript"
                tooltipShortcut={['Mod', '.']}
                onClick={commands.onSubscript}
                active={states.isSubscript}
              >
                <Icon name="Subscript" />
              </MemoButton>
              <MemoButton
                tooltip="Superscript"
                tooltipShortcut={['Mod', ',']}
                onClick={commands.onSuperscript}
                active={states.isSuperscript}
              >
                <Icon name="Superscript" />
              </MemoButton>
              {/* Show alignment buttons in compact mode */}
              {isCompactMode && (
                <>
                  <Toolbar.Divider />
                  <MemoButton
                    tooltip="Align left"
                    tooltipShortcut={['Shift', 'Mod', 'L']}
                    onClick={commands.onAlignLeft}
                    active={states.isAlignLeft}
                  >
                    <Icon name="AlignLeft" />
                  </MemoButton>
                  <MemoButton
                    tooltip="Align center"
                    tooltipShortcut={['Shift', 'Mod', 'E']}
                    onClick={commands.onAlignCenter}
                    active={states.isAlignCenter}
                  >
                    <Icon name="AlignCenter" />
                  </MemoButton>
                  <MemoButton
                    tooltip="Align right"
                    tooltipShortcut={['Shift', 'Mod', 'R']}
                    onClick={commands.onAlignRight}
                    active={states.isAlignRight}
                  >
                    <Icon name="AlignRight" />
                  </MemoButton>
                  <MemoButton
                    tooltip="Justify"
                    tooltipShortcut={['Shift', 'Mod', 'J']}
                    onClick={commands.onAlignJustify}
                    active={states.isAlignJustify}
                  >
                    <Icon name="AlignJustify" />
                  </MemoButton>
                </>
              )}
            </Toolbar.Wrapper>
          </Popover.Content>
        </Popover.Root>
      </Toolbar.Wrapper>
    </BubbleMenu>
  )
}
