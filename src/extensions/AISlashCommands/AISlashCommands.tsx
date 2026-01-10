/**
 * AI Slash Commands Extension
 * 
 * Provides /slash commands for triggering AI agents inline:
 * - /continue - Continue writing
 * - /improve - Improve selection
 * - /dialogue - Generate dialogue
 * - /describe - Add description
 * - /analyze - Analyze text
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';

export interface AISlashCommand {
  id: string;
  label: string;
  description: string;
  icon: string;
  agentId?: string;
  action?: string;
}

export const DEFAULT_SLASH_COMMANDS: AISlashCommand[] = [
  {
    id: 'continue',
    label: 'Continue Writing',
    description: 'AI continues your story',
    icon: '✍️',
    agentId: 'ghost-writer',
  },
  {
    id: 'improve',
    label: 'Improve Text',
    description: 'Enhance the selected text',
    icon: '✨',
    agentId: 'style-coach',
  },
  {
    id: 'dialogue',
    label: 'Write Dialogue',
    description: 'Generate character dialogue',
    icon: '💬',
    agentId: 'dialogue-master',
  },
  {
    id: 'describe',
    label: 'Add Description',
    description: 'Add sensory details',
    icon: '🎨',
    agentId: 'ghost-writer',
    action: 'describe',
  },
  {
    id: 'analyze',
    label: 'Analyze',
    description: 'Get writing feedback',
    icon: '📊',
    agentId: 'style-coach',
  },
  {
    id: 'character',
    label: 'Check Characters',
    description: 'Verify character consistency',
    icon: '👤',
    agentId: 'character-keeper',
  },
  {
    id: 'plot',
    label: 'Analyze Plot',
    description: 'Check plot and pacing',
    icon: '📖',
    agentId: 'plot-analyst',
  },
  {
    id: 'world',
    label: 'World Details',
    description: 'Check world consistency',
    icon: '🌍',
    agentId: 'world-builder',
  },
];

export const aiSlashCommandsPluginKey = new PluginKey('aiSlashCommands');

export interface AISlashCommandsOptions {
  commands: AISlashCommand[];
  onCommand: (command: AISlashCommand, context: SlashCommandContext) => void;
  suggestion: Partial<SuggestionOptions>;
}

export interface SlashCommandContext {
  before: string;
  after: string;
  cursorPosition: number;
}

export const AISlashCommands = Extension.create<AISlashCommandsOptions>({
  name: 'aiSlashCommands',

  addOptions() {
    return {
      commands: DEFAULT_SLASH_COMMANDS,
      onCommand: () => {},
      suggestion: {
        char: '/',
        startOfLine: false,
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: this.options.suggestion.char || '/',
        pluginKey: aiSlashCommandsPluginKey,
        
        command: ({ editor, range, props }) => {
          // Delete the slash command text
          editor.chain()
            .focus()
            .deleteRange(range)
            .run();
          
          // Get context
          const { state } = editor;
          const { from } = state.selection;
          const doc = state.doc;
          
          const before = doc.textBetween(Math.max(0, from - 1000), from, '\n');
          const after = doc.textBetween(from, Math.min(doc.content.size, from + 500), '\n');
          
          // Execute command
          this.options.onCommand(props.command, {
            before,
            after,
            cursorPosition: from,
          });
        },
        
        items: ({ query }) => {
          const lowerQuery = query.toLowerCase();
          return this.options.commands.filter(cmd =>
            cmd.id.toLowerCase().includes(lowerQuery) ||
            cmd.label.toLowerCase().includes(lowerQuery) ||
            cmd.description.toLowerCase().includes(lowerQuery)
          );
        },
        
        render: () => {
          let component: ReactRenderer | null = null;
          let popup: TippyInstance[] | null = null;
          
          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashCommandList, {
                props: {
                  ...props,
                  commands: this.options.commands,
                },
                editor: props.editor,
              });
              
              if (!props.clientRect) return;
              
              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                theme: 'slash-command',
              });
            },
            
            onUpdate: (props) => {
              component?.updateProps({
                ...props,
                commands: this.options.commands,
              });
              
              if (!props.clientRect) return;
              
              popup?.[0]?.setProps({
                getReferenceClientRect: props.clientRect as () => DOMRect,
              });
            },
            
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                popup?.[0]?.hide();
                return true;
              }
              
              if (component?.ref && typeof (component.ref as { onKeyDown?: (props: any) => boolean }).onKeyDown === 'function') {
                return (component.ref as { onKeyDown: (props: any) => boolean }).onKeyDown(props);
              }
              return false;
            },
            
            onExit: () => {
              popup?.[0]?.destroy();
              component?.destroy();
            },
          };
        },
      }),
    ];
  },
});

// Slash Command List Component (imported by AIWritingSurface)
import React, { 
  forwardRef, 
  useEffect, 
  useImperativeHandle, 
  useState 
} from 'react';

interface SlashCommandListProps {
  items: AISlashCommand[];
  command: (props: { command: AISlashCommand }) => void;
}

export const SlashCommandList = forwardRef<any, SlashCommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    
    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);
    
    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
          return true;
        }
        
        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;
        }
        
        if (event.key === 'Enter') {
          if (items[selectedIndex]) {
            command({ command: items[selectedIndex] });
          }
          return true;
        }
        
        return false;
      },
    }));
    
    return (
      <div className="slash-command-menu bg-[--ide-tooltip-bg] border border-[--ide-border] rounded-lg shadow-lg overflow-hidden min-w-[220px]">
        <div className="px-2 py-1.5 text-[10px] text-[--ide-activitybar-inactive] border-b border-[--ide-border]">
          AI Commands
        </div>
        <div className="py-1 max-h-[300px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[--ide-activitybar-inactive]">
              No commands found
            </div>
          ) : (
            items.map((item, index) => (
              <button
                key={item.id}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 text-left
                  ${index === selectedIndex 
                    ? 'bg-[--ide-list-active-bg] text-[--ide-list-active-fg]' 
                    : 'text-[--ide-foreground] hover:bg-[--ide-list-hover-bg]'
                  }
                `}
                onClick={() => command({ command: item })}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="text-base">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.label}</div>
                  <div className="text-xs text-[--ide-activitybar-inactive] truncate">
                    {item.description}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }
);

SlashCommandList.displayName = 'SlashCommandList';
