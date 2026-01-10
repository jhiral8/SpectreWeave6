'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { X, FileText, TextSelect, User, Film, BookOpen, Layers, Plus } from 'lucide-react';
import type { ContextChipsProps, ContextChip, ContextChipType, CONTEXT_CHIP_CONFIG } from './types';

/**
 * Context Chips Component
 * 
 * VS Code Copilot-style context chips for attaching context to prompts.
 * 
 * ┌────────────────────────────────────────────────────┐
 * │ [@file] [@selection] [@character: Alex]    [+]    │
 * └────────────────────────────────────────────────────┘
 */

// Icon mapping
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  FileText,
  TextSelect,
  User,
  Film,
  BookOpen,
  Layers,
  Plus,
};

// Chip colors by type
const CHIP_COLORS: Record<ContextChipType, string> = {
  file: '#519aba',
  selection: '#a074c4',
  character: '#4ec9b0',
  scene: '#ce9178',
  chapter: '#569cd6',
  framework: '#dcdcaa',
  custom: '#9cdcfe',
};

export const ContextChips: React.FC<ContextChipsProps> = ({
  chips,
  selectedChips,
  onToggleChip,
  onAddChip,
}) => {
  if (chips.length === 0 && !onAddChip) {
    return null;
  }

  return (
    <div
      className={cn(
        'vscode-context-chips',
        'flex flex-wrap items-center gap-1.5',
        'px-3 py-2',
        'border-b border-[var(--ide-border,#3c3c3c)]'
      )}
    >
      {chips.map((chip) => (
        <ContextChipItem
          key={chip.id}
          chip={chip}
          isSelected={selectedChips.includes(chip.id)}
          onToggle={() => onToggleChip(chip.id)}
        />
      ))}

      {/* Add Context Button */}
      {onAddChip && (
        <button
          className={cn(
            'flex items-center gap-1 px-2 py-0.5',
            'text-[11px]',
            'text-[var(--ide-accent,#3794ff)]',
            'hover:text-[var(--ide-accent,#3794ff)]',
            'hover:bg-[var(--ide-hover-bg,#5a5d5e)]',
            'rounded'
          )}
          onClick={onAddChip}
        >
          <Plus className="w-3 h-3" />
          <span>Add Context</span>
        </button>
      )}
    </div>
  );
};

interface ContextChipItemProps {
  chip: ContextChip;
  isSelected: boolean;
  onToggle: () => void;
}

const ContextChipItem: React.FC<ContextChipItemProps> = ({
  chip,
  isSelected,
  onToggle,
}) => {
  const color = CHIP_COLORS[chip.type] || CHIP_COLORS.custom;
  const IconComponent = ICON_MAP[chip.icon || 'FileText'] || FileText;

  return (
    <button
      className={cn(
        'vscode-context-chip',
        'flex items-center gap-1 px-2 py-0.5',
        'text-[11px] font-medium',
        'rounded',
        'transition-colors',
        isSelected
          ? 'bg-[var(--ide-bg-elevated,#4d4d4d)]'
          : 'bg-[var(--ide-bg,#3c3c3c)]',
        'hover:bg-[var(--ide-hover-bg,#2a2d2e)]',
        'border border-transparent',
        isSelected && 'border-[var(--ide-accent,#007fd4)]'
      )}
      style={{ color }}
      onClick={onToggle}
      title={chip.content ? `${chip.label}: ${chip.content.slice(0, 100)}...` : chip.label}
    >
      <span className="opacity-70">@</span>
      <IconComponent className="w-3 h-3" />
      <span>{chip.label}</span>
      {isSelected && (
        <X className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100" />
      )}
    </button>
  );
};

export default ContextChips;
