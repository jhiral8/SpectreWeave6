'use client';

/**
 * AI Writing Blocks
 * 
 * Collection of AI-powered writing block components for the editor.
 */

import React from 'react';

// ============================================================================
// Author Style Block
// ============================================================================

export interface AuthorStyleBlockProps {
  authorStyle?: string;
  onStyleChange?: (style: string) => void;
}

export const AuthorStyleBlock: React.FC<AuthorStyleBlockProps> = ({
  authorStyle = '',
  onStyleChange,
}) => {
  return (
    <div className="author-style-block p-4 border rounded-md bg-slate-50 dark:bg-slate-800">
      <h4 className="text-sm font-medium mb-2">Author Style</h4>
      <p className="text-xs text-muted-foreground">
        {authorStyle || 'No style selected'}
      </p>
    </div>
  );
};

// ============================================================================
// Character Profile Block
// ============================================================================

export interface CharacterProfileBlockProps {
  characterId?: string;
  characterName?: string;
  onCharacterSelect?: (id: string) => void;
}

export const CharacterProfileBlock: React.FC<CharacterProfileBlockProps> = ({
  characterId,
  characterName = 'Unknown Character',
  onCharacterSelect,
}) => {
  return (
    <div className="character-profile-block p-4 border rounded-md bg-slate-50 dark:bg-slate-800">
      <h4 className="text-sm font-medium mb-2">Character Profile</h4>
      <p className="text-xs text-muted-foreground">{characterName}</p>
    </div>
  );
};

// ============================================================================
// AI Feedback Block
// ============================================================================

export interface AIFeedbackBlockProps {
  feedback?: string;
  type?: 'suggestion' | 'warning' | 'error' | 'info';
  onDismiss?: () => void;
  onAccept?: () => void;
}

export const AIFeedbackBlock: React.FC<AIFeedbackBlockProps> = ({
  feedback = '',
  type = 'info',
  onDismiss,
  onAccept,
}) => {
  const bgColor = {
    suggestion: 'bg-blue-50 dark:bg-blue-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    error: 'bg-red-50 dark:bg-red-900/20',
    info: 'bg-slate-50 dark:bg-slate-800',
  }[type];

  return (
    <div className={`ai-feedback-block p-4 border rounded-md ${bgColor}`}>
      <h4 className="text-sm font-medium mb-2">AI Feedback</h4>
      <p className="text-xs text-muted-foreground">{feedback || 'No feedback'}</p>
      <div className="flex gap-2 mt-2">
        {onAccept && (
          <button
            onClick={onAccept}
            className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded"
          >
            Accept
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// AI Writing Assistant Panel
// ============================================================================

export interface AIWritingAssistantPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  content?: string;
  onSuggestionAccept?: (suggestion: string) => void;
}

export const AIWritingAssistantPanel: React.FC<AIWritingAssistantPanelProps> = ({
  isOpen = false,
  onClose,
  content = '',
  onSuggestionAccept,
}) => {
  if (!isOpen) return null;

  return (
    <div className="ai-writing-assistant-panel fixed right-0 top-0 h-full w-80 bg-background border-l shadow-lg">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">AI Writing Assistant</h3>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          AI writing suggestions will appear here based on your content.
        </p>
      </div>
    </div>
  );
};

export default {
  AuthorStyleBlock,
  CharacterProfileBlock,
  AIFeedbackBlock,
  AIWritingAssistantPanel,
};
