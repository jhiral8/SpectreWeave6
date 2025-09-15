import React, { useState } from 'react';
import {
  GripVertical,
  Plus,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface BlockHandleProps {
  onAddBlock: () => void;
  onCopyBlock: () => void;
  onDeleteBlock: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isDragging?: boolean;
}

export const BlockHandle: React.FC<BlockHandleProps> = ({
  onAddBlock,
  onCopyBlock,
  onDeleteBlock,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  isDragging = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={cn(
        'flex items-center space-x-1 transition-opacity',
        isDragging ? 'opacity-100' : 'opacity-0 hover:opacity-100'
      )}
    >
      {/* Drag Handle */}
      <div
        className="p-1 cursor-grab hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300" />
      </div>

      {/* Add Block Button */}
      <button
        className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
        onClick={onAddBlock}
        title="Add block below"
      >
        <Plus className="w-4 h-4 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300" />
      </button>

      {/* Block Menu */}
      <div className="relative">
        <button
          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
          onClick={() => setShowMenu(!showMenu)}
          title="Block options"
        >
          <MoreHorizontal className="w-4 h-4 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300" />
        </button>

        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            
            {/* Menu */}
            <div className="absolute top-8 left-0 z-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 min-w-32">
              <button
                onClick={() => {
                  onCopyBlock();
                  setShowMenu(false);
                }}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>

              {canMoveUp && (
                <button
                  onClick={() => {
                    onMoveUp();
                    setShowMenu(false);
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <ArrowUp className="w-4 h-4" />
                  <span>Move Up</span>
                </button>
              )}

              {canMoveDown && (
                <button
                  onClick={() => {
                    onMoveDown();
                    setShowMenu(false);
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <ArrowDown className="w-4 h-4" />
                  <span>Move Down</span>
                </button>
              )}

              <div className="border-t border-neutral-200 dark:border-neutral-700 my-1" />

              <button
                onClick={() => {
                  onDeleteBlock();
                  setShowMenu(false);
                }}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};