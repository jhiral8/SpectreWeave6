import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Bold,
  Italic
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface BlockFormatToolbarProps {
  editor: Editor;
  visible: boolean;
  position: { top: number; left: number };
}

export const BlockFormatToolbar: React.FC<BlockFormatToolbarProps> = ({
  editor,
  visible,
  position,
}) => {
  const formatBlock = (format: string) => {
    switch (format) {
      case 'paragraph':
        editor.chain().focus().setParagraph().run();
        break;
      case 'heading1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'heading2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'heading3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
    }
  };

  const isActive = (format: string) => {
    switch (format) {
      case 'paragraph':
        return editor.isActive('paragraph');
      case 'heading1':
        return editor.isActive('heading', { level: 1 });
      case 'heading2':
        return editor.isActive('heading', { level: 2 });
      case 'heading3':
        return editor.isActive('heading', { level: 3 });
      case 'bulletList':
        return editor.isActive('bulletList');
      case 'orderedList':
        return editor.isActive('orderedList');
      case 'blockquote':
        return editor.isActive('blockquote');
      case 'bold':
        return editor.isActive('bold');
      case 'italic':
        return editor.isActive('italic');
      default:
        return false;
    }
  };

  const FormatButton = ({
    format,
    icon: Icon,
    title,
  }: {
    format: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
  }) => (
    <button
      className={cn(
        'p-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors',
        isActive(format) && 'bg-black/10 dark:bg-white/10'
      )}
      onClick={() => formatBlock(format)}
      title={title}
    >
      <Icon className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
    </button>
  );

  if (!visible) return null;

  return (
    <div
      className="flex items-center gap-1 p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
      }}
    >
      <FormatButton format="paragraph" icon={Type} title="Paragraph" />
      
      <FormatButton format="heading1" icon={Heading1} title="Heading 1" />
      
      <FormatButton format="heading2" icon={Heading2} title="Heading 2" />
      
      <FormatButton format="heading3" icon={Heading3} title="Heading 3" />
      
      <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1" />
      
      <FormatButton format="bulletList" icon={List} title="Bullet List" />
      
      <FormatButton format="orderedList" icon={ListOrdered} title="Numbered List" />
      
      <FormatButton format="blockquote" icon={Quote} title="Quote" />
      
      <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1" />
      
      <FormatButton format="bold" icon={Bold} title="Bold" />
      
      <FormatButton format="italic" icon={Italic} title="Italic" />
    </div>
  );
};