import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { BlockHandle } from '../BlockHandle';
import { BlockFormatToolbar } from '../BlockFormatToolbar';
import { cn } from '../../../lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface BlockInfo {
  id: string;
  pos: number;
  node: any;
  element: HTMLElement;
  type: string;
}

interface DraggableBlockSelectorProps {
  editor: Editor;
}

interface SortableBlockHandleProps {
  block: BlockInfo;
  onAddBlock: () => void;
  onCopyBlock: () => void;
  onDeleteBlock: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isSelected: boolean;
}

const SortableBlockHandle: React.FC<SortableBlockHandleProps> = ({
  block,
  onAddBlock,
  onCopyBlock,
  onDeleteBlock,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  isSelected,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!isSelected) return null;

  const rect = block.element.getBoundingClientRect();
  const editorRect = block.element.closest('.editor-content')?.getBoundingClientRect();

  if (!editorRect) return null;

  const maxTop = editorRect.bottom - 100;
  const adjustedTop = Math.min(rect.top, maxTop);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'absolute',
        left: editorRect.left - 60,
        top: adjustedTop,
        zIndex: 1000,
      }}
      className="flex items-center space-x-1"
    >
      {/* Drag Handle */}
      <div 
        className="p-1 cursor-grab hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
        title="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300" />
      </div>

      <BlockHandle
        onAddBlock={onAddBlock}
        onCopyBlock={onCopyBlock}
        onDeleteBlock={onDeleteBlock}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        isDragging={isDragging}
      />
    </div>
  );
};

export const DraggableBlockSelector: React.FC<DraggableBlockSelectorProps> = ({ editor }) => {
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showHandle, setShowHandle] = useState(false);
  const [showFormatToolbar, setShowFormatToolbar] = useState(false);
  const [formatToolbarPosition, setFormatToolbarPosition] = useState({ top: 0, left: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const extractBlocks = useCallback(() => {
    if (!editor) return [];

    const extractedBlocks: BlockInfo[] = [];
    const doc = editor.state.doc;

    doc.descendants((node, pos) => {
      if (isBlockNode(node)) {
        try {
          const domNode = editor.view.domAtPos(pos);
          let element = domNode.node as HTMLElement;
          
          if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement as HTMLElement;
          }
          
          // Find the actual block element
          while (element && !isBlockElement(element) && element !== editor.view.dom) {
            element = element.parentElement as HTMLElement;
          }
          
          if (element && element !== editor.view.dom) {
            extractedBlocks.push({
              id: `block-${pos}`,
              pos,
              node,
              element,
              type: node.type.name,
            });
          }
        } catch (error) {
          // Skip blocks we can't find DOM elements for
        }
      }
    });

    return extractedBlocks;
  }, [editor]);

  const isBlockNode = (node: any) => {
    return node && (
      node.type.name === 'paragraph' ||
      node.type.name === 'heading' ||
      node.type.name === 'bulletList' ||
      node.type.name === 'orderedList' ||
      node.type.name === 'blockquote' ||
      node.type.name === 'feedbackBlock' ||
      node.type.name === 'characterProfile' ||
      node.type.name === 'authorStyleBlock' ||
      node.type.name === 'table'
    );
  };

  const isBlockElement = (element: HTMLElement) => {
    return element.matches('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, .feedback-block, .character-profile-block, .author-style-block, table');
  };

  useEffect(() => {
    if (!editor) return;

    const updateBlocks = () => {
      const newBlocks = extractBlocks();
      setBlocks(newBlocks);
    };

    const handleSelectionUpdate = () => {
      const { selection } = editor.state;
      const { $from } = selection;
      
      // Find the block that contains the selection
      let blockPos = $from.pos;
      let blockNode = $from.node();
      let depth = $from.depth;
      
      while (depth > 0 && !isBlockNode(blockNode)) {
        depth--;
        blockPos = $from.start(depth + 1) - 1;
        blockNode = $from.node(depth);
      }
      
      if (isBlockNode(blockNode)) {
        setSelectedBlockId(`block-${blockPos}`);
        setShowHandle(true);
        
        // Update format toolbar position
        try {
          const domNode = editor.view.domAtPos(blockPos);
          let element = domNode.node as HTMLElement;
          
          if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement as HTMLElement;
          }
          
          while (element && !isBlockElement(element) && element !== editor.view.dom) {
            element = element.parentElement as HTMLElement;
          }
          
          if (element && element !== editor.view.dom) {
            const rect = element.getBoundingClientRect();
            
            setFormatToolbarPosition({
              top: rect.top - 45,
              left: rect.left,
            });
            setShowFormatToolbar(true);
          }
        } catch (error) {
          setShowFormatToolbar(false);
        }
      } else {
        setSelectedBlockId(null);
        setShowHandle(false);
        setShowFormatToolbar(false);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (editor.view.dom.contains(target)) {
        const blockElement = target.closest('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, .feedback-block, .character-profile-block, .author-style-block, table');
        
        if (blockElement && blockElement !== editor.view.dom) {
          try {
            const pos = editor.view.posAtDOM(blockElement, 0);
            const $pos = editor.state.doc.resolve(pos);
            const node = $pos.node($pos.depth);
            
            if (isBlockNode(node)) {
              const blockId = `block-${$pos.start($pos.depth)}`;
              setSelectedBlockId(blockId);
              setShowHandle(true);
              
              // Update format toolbar position
              const rect = (blockElement as HTMLElement).getBoundingClientRect();
              const editorRect = editor.view.dom.getBoundingClientRect();
              
              setFormatToolbarPosition({
                top: rect.top - 45,
                left: rect.left,
              });
              setShowFormatToolbar(true);
              return;
            }
          } catch (error) {
            // Ignore errors
          }
        }
      }
      
      // Hide handle if not hovering over a block or handle
      if (!target.closest('.block-handle-container')) {
        setShowHandle(false);
      }
      setShowFormatToolbar(false);
    };

    updateBlocks();
    editor.on('update', updateBlocks);
    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.view.dom.addEventListener('mousemove', handleMouseMove);

    return () => {
      editor.off('update', updateBlocks);
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.view.dom.removeEventListener('mousemove', handleMouseMove);
    };
  }, [editor, extractBlocks]);

  const getSelectedBlock = () => {
    return blocks.find(block => block.id === selectedBlockId);
  };

  const handleAddBlock = () => {
    const selectedBlock = getSelectedBlock();
    if (!selectedBlock) return;
    
    const endPos = selectedBlock.pos + selectedBlock.node.nodeSize;
    
    editor.chain()
      .focus()
      .setTextSelection(endPos)
      .insertContent('<p></p>')
      .run();
  };

  const handleCopyBlock = () => {
    const selectedBlock = getSelectedBlock();
    if (!selectedBlock) return;
    
    const { pos, node } = selectedBlock;
    const endPos = pos + node.nodeSize;
    
    const slice = editor.state.doc.slice(pos, endPos);
    
    editor.chain()
      .focus()
      .setTextSelection(endPos)
      .insertContent(slice.content)
      .run();
  };

  const handleDeleteBlock = () => {
    const selectedBlock = getSelectedBlock();
    if (!selectedBlock) return;
    
    const { pos, node } = selectedBlock;
    const endPos = pos + node.nodeSize;
    
    editor.chain()
      .focus()
      .deleteRange({ from: pos, to: endPos })
      .run();
      
    setSelectedBlockId(null);
    setShowHandle(false);
    setShowFormatToolbar(false);
  };

  const handleMoveUp = () => {
    const selectedBlock = getSelectedBlock();
    if (!selectedBlock) return;
    
    const currentIndex = blocks.findIndex(block => block.id === selectedBlockId);
    if (currentIndex > 0) {
      const targetBlock = blocks[currentIndex - 1];
      moveBlock(selectedBlock, targetBlock);
    }
  };

  const handleMoveDown = () => {
    const selectedBlock = getSelectedBlock();
    if (!selectedBlock) return;
    
    const currentIndex = blocks.findIndex(block => block.id === selectedBlockId);
    if (currentIndex < blocks.length - 1) {
      const targetBlock = blocks[currentIndex + 1];
      moveBlock(selectedBlock, targetBlock);
    }
  };

  const moveBlock = (sourceBlock: BlockInfo, targetBlock: BlockInfo) => {
    try {
      const sourcePos = sourceBlock.pos;
      const sourceEndPos = sourcePos + sourceBlock.node.nodeSize;
      const targetPos = targetBlock.pos;

      // Extract the source block content
      const slice = editor.state.doc.slice(sourcePos, sourceEndPos);

      // Determine insertion position
      let insertPos = targetPos;
      if (sourcePos < targetPos) {
        // Moving down: insert after target
        insertPos = targetPos + targetBlock.node.nodeSize;
      }

      // Perform the move
      editor.chain()
        .focus()
        .deleteRange({ from: sourcePos, to: sourceEndPos })
        .setTextSelection(sourcePos < targetPos ? insertPos - sourceBlock.node.nodeSize : insertPos)
        .insertContent(slice.content)
        .run();
    } catch (error) {
      console.warn('Error moving block:', error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const activeBlock = blocks.find(block => block.id === active.id);
    const overBlock = blocks.find(block => block.id === over.id);
    
    if (activeBlock && overBlock) {
      moveBlock(activeBlock, overBlock);
    }
  };

  const canMoveUp = () => {
    const currentIndex = blocks.findIndex(block => block.id === selectedBlockId);
    return currentIndex > 0;
  };

  const canMoveDown = () => {
    const currentIndex = blocks.findIndex(block => block.id === selectedBlockId);
    return currentIndex < blocks.length - 1;
  };

  const selectedBlock = getSelectedBlock();
  const activeBlock = blocks.find(block => block.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={blocks.map(block => block.id)} strategy={verticalListSortingStrategy}>
        {selectedBlock && showHandle && (
          <SortableBlockHandle
            block={selectedBlock}
            onAddBlock={handleAddBlock}
            onCopyBlock={handleCopyBlock}
            onDeleteBlock={handleDeleteBlock}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            canMoveUp={canMoveUp()}
            canMoveDown={canMoveDown()}
            isSelected={true}
          />
        )}
      </SortableContext>

      <DragOverlay>
        {activeBlock && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 opacity-90">
            <div className="flex items-center space-x-2">
              <GripVertical className="w-4 h-4 text-neutral-400" />
              <span className="text-sm font-medium text-gray-700">
                {activeBlock.type} block
              </span>
            </div>
          </div>
        )}
      </DragOverlay>

      {showFormatToolbar && (
        <div className="fixed z-40">
          <BlockFormatToolbar
            editor={editor}
            visible={showFormatToolbar}
            position={formatToolbarPosition}
          />
        </div>
      )}
    </DndContext>
  );
};