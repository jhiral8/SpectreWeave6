import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Table, 
  Minus,
  Bot,
  User,
  Users,
  BookOpen,
  Edit3,
  Zap,
  RefreshCw,
  FileText,
  Search,
  CheckSquare,
  MessageCircle,
  Type,
  Sparkles
} from "lucide-react";
import { cn } from "../../../lib/utils";
import type { SlashCommand } from "../../../extensions/SlashCommands";

interface SlashCommandsListProps {
  items: SlashCommand[];
  command: (item: SlashCommand) => void;
}

const ICON_MAP = {
  H1: Heading1,
  H2: Heading2,
  H3: Heading3,
  List: List,
  ListOrdered: ListOrdered,
  Quote: Quote,
  Table: Table,
  Minus: Minus,
  Bot: Bot,
  User: User,
  Users: Users,
  BookOpen: BookOpen,
  Edit3: Edit3,
  Zap: Zap,
  RefreshCw: RefreshCw,
  FileText: FileText,
  Search: Search,
  CheckSquare: CheckSquare,
  MessageCircle: MessageCircle,
  Type: Type,
  Sparkles: Sparkles,
};

const CATEGORY_COLORS = {
  formatting: "text-blue-600 dark:text-blue-400",
  blocks: "text-green-600 dark:text-green-400",
  feedback: "text-purple-600 dark:text-purple-400",
  ai: "text-orange-600 dark:text-orange-400",
  writing: "text-red-600 dark:text-red-400",
};

const CATEGORY_LABELS = {
  formatting: "Formatting",
  blocks: "Blocks",
  feedback: "Feedback",
  ai: "AI Tools",
  writing: "Writing Tools",
};

export const SlashCommandsList = forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  SlashCommandsListProps
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  const groupedItems = props.items.reduce((acc, item, index) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push({ ...item, originalIndex: index });
    return acc;
  }, {} as Record<string, (SlashCommand & { originalIndex: number })[]>);

  if (props.items.length === 0) {
    return (
      <div className={cn(
        "slash-commands-list bg-[--background] border border-[--border]",
        "rounded-lg shadow-lg p-3 max-w-sm"
      )}>
        <div className="text-sm text-[--text-muted] text-center">
          No commands found
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "slash-commands-list bg-[--background] border border-[--border]",
      "rounded-lg shadow-lg max-w-sm max-h-80 overflow-y-auto"
    )}>
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className="category-group">
          <div className={cn(
            "category-header px-3 py-2 text-xs font-semibold uppercase tracking-wide",
            "text-[--text-muted] border-b border-[--border]"
          )}>
            {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
          </div>
          <div className="category-items">
            {items.map((item) => {
              const IconComponent = ICON_MAP[item.icon as keyof typeof ICON_MAP];
              const isSelected = selectedIndex === item.originalIndex;
              
              return (
                <button
                  key={item.originalIndex}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 text-left transition-colors",
                    "hover:bg-[--accent]",
                    isSelected && "bg-[--accent] border-r-2 border-[--primary]"
                  )}
                  onClick={() => selectItem(item.originalIndex)}
                >
                  {IconComponent && (
                    <IconComponent 
                      className={cn("w-4 h-4", CATEGORY_COLORS[item.category])} 
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[--text]">
                      {item.title}
                    </div>
                    <div className="text-xs text-[--text-muted] truncate">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      
      <div className={cn(
        "slash-commands-footer px-3 py-2 border-t border-neutral-100 dark:border-neutral-800",
        "bg-black/2 dark:bg-white/2"
      )}>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
          <span>↑↓ to navigate</span>
          <span>↵ to select</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
});

SlashCommandsList.displayName = "SlashCommandsList";
