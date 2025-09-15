import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { SlashCommandsList } from "../components/editor/SlashCommandsList";

export interface SlashCommand {
  title: string;
  description: string;
  icon: string;
  command: ({ editor, range }: { editor: any; range: any }) => void;
  category: "formatting" | "blocks" | "feedback" | "ai" | "writing";
}

export const SlashCommands = Extension.create({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        pluginKey: new PluginKey("slashCommands"),
        command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
          console.log('🎯 SlashCommands executing command:', props.title || 'unknown')
          props.command({ editor, range });
        },
      },
    };
  },

  onCreate() {
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const createSlashCommandsSuggestion = () => ({
  items: ({ query }: { query: string }) => {
    // Debug: check which editor surface triggered the slash command
    const editorElement = document.activeElement?.closest('[data-surface]')
    const surface = editorElement?.getAttribute('data-surface')
    console.log('🔍 Slash command items requested - Surface:', surface, 'Query:', query, 'ActiveElement:', document.activeElement)
    
    const commands: SlashCommand[] = [
      {
        title: "Heading 1",
        description: "Large section heading",
        icon: "H1",
        category: "formatting",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
        },
      },
      {
        title: "Heading 2",
        description: "Medium section heading",
        icon: "H2",
        category: "formatting",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
        },
      },
      {
        title: "Heading 3",
        description: "Small section heading",
        icon: "H3",
        category: "formatting",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
        },
      },
      {
        title: "Bullet List",
        description: "Create a bullet list",
        icon: "List",
        category: "formatting",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
      },
      {
        title: "Numbered List",
        description: "Create a numbered list",
        icon: "ListOrdered",
        category: "formatting",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
      },
      {
        title: "Quote",
        description: "Create a blockquote",
        icon: "Quote",
        category: "formatting",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
      },
      {
        title: "Table",
        description: "Insert a table",
        icon: "Table",
        category: "blocks",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        },
      },
      {
        title: "Horizontal Rule",
        description: "Insert a horizontal divider",
        icon: "Minus",
        category: "blocks",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setHorizontalRule().run();
        },
      },
      {
        title: "Character Profile",
        description: "Add character development sheet",
        icon: "Users",
        category: "writing",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertCharacterProfile({
            characterName: "New Character",
            profileData: {}
          }).run();
        },
      },
      {
        title: "Author Style Guide",
        description: "Add author style reference",
        icon: "User",
        category: "writing",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertAuthorStyleBlock({
            authorName: "Author Name",
            genre: "",
            styleDescription: "",
            sampleText: "",
            writingTips: []
          }).run();
        },
      },
      {
        title: "Research Block",
        description: "Add research and analysis block",
        icon: "Search",
        category: "writing",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertResearchBlock().run();
        },
      },
      {
        title: "AI Text Generator",
        description: "Generate text with AI assistance",
        icon: "Zap",
        category: "ai",
        command: ({ editor, range }) => {
          // Insert AI Suggestion block
          editor.chain().focus().deleteRange(range).setAISuggestion({
            originalText: "",
            suggestedText: "Click to generate text with AI...",
            action: "improve",
            timestamp: new Date().toISOString()
          }).run();
        },
      },
      {
        title: "Feedback Block",
        description: "Get AI feedback on your writing",
        icon: "MessageCircle",
        category: "ai",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).insertFeedbackBlock({
            type: "ai-feedback",
            content: "Request AI feedback on your writing...",
            author: "AI Assistant",
            severity: "suggestion"
          }).run();
        },
      },
      {
        title: "Generate Paragraph",
        description: "Generate a paragraph continuation",
        icon: "Type",
        category: "ai",
        command: ({ editor, range }) => {
          // Get some context from the document
          const currentContent = editor.getText();
          const lastParagraph = currentContent.split('\n\n').pop() || "";
          
          editor.chain().focus().deleteRange(range).setAISuggestion({
            originalText: lastParagraph,
            suggestedText: "Generating paragraph...",
            action: "improve",
            timestamp: new Date().toISOString()
          }).run();
        },
      },
      {
        title: "Improve Text",
        description: "Improve selected text with AI",
        icon: "Sparkles",
        category: "ai",
        command: ({ editor, range }) => {
          // Get selected text or nearby text
          const selectedText = editor.state.doc.textBetween(
            Math.max(0, range.from - 50),
            Math.min(editor.state.doc.content.size, range.to + 50)
          );
          
          editor.chain().focus().deleteRange(range).setAISuggestion({
            originalText: selectedText,
            suggestedText: "AI will improve this text...",
            action: "improve",
            timestamp: new Date().toISOString()
          }).run();
        },
      },
      {
        title: "Rewrite Text",
        description: "Rewrite text in a different style",
        icon: "RefreshCw",
        category: "ai",
        command: ({ editor, range }) => {
          const selectedText = editor.state.doc.textBetween(
            Math.max(0, range.from - 50),
            Math.min(editor.state.doc.content.size, range.to + 50)
          );
          
          editor.chain().focus().deleteRange(range).setAISuggestion({
            originalText: selectedText,
            suggestedText: "AI will rewrite this text...",
            action: "rewrite",
            timestamp: new Date().toISOString()
          }).run();
        },
      },
      {
        title: "Summarize Text",
        description: "Create a summary of your content",
        icon: "FileText",
        category: "ai",
        command: ({ editor, range }) => {
          const documentText = editor.getText();
          
          editor.chain().focus().deleteRange(range).setAISuggestion({
            originalText: documentText.substring(0, 500) + "...",
            suggestedText: "AI will create a summary...",
            action: "summarize",
            timestamp: new Date().toISOString()
          }).run();
        },
      },
    ];

    const filteredCommands = commands.filter(command => 
      command.title.toLowerCase().includes(query.toLowerCase()) ||
      command.description.toLowerCase().includes(query.toLowerCase())
    );
    
    console.log('📝 Filtered commands for query "' + query + '":', filteredCommands.length, 'commands')
    return filteredCommands;
  },

  render: () => {
    let component: ReactRenderer;
    let popup: any;

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(SlashCommandsList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          console.log('⚠️ No clientRect provided to SlashCommands')
          return;
        }

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
        console.log('✅ SlashCommands popup created')
      },

      onUpdate(props: any) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === "Escape") {
          popup[0].hide();
          return true;
        }

        return (component.ref as any)?.onKeyDown(props);
      },

      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
});
