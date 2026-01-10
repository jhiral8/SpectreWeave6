'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { PanelProvider } from '@/components/IDE/PanelSystem/PanelContext';
import { IDEShell } from '@/components/IDE/IDEShell';
import { ThemePicker } from '@/components/IDE/Theme/ThemePicker';
import { useTheme } from '@/components/IDE/Theme/ThemeProvider';
import { usePanels } from '@/components/IDE/PanelSystem/PanelContext';
import { StoryExplorer, StoryNode } from '@/components/IDE/StoryExplorer';
import { BottomPanel, WritingProblem } from '@/components/IDE/BottomPanel';
import { EditorTabs, EditorTab } from '@/components/IDE/EditorTabs';
import { AIAgentsPanel, AgentProvider, useAgents } from '@/components/IDE/AIAgents';
import { CommandPalette } from '@/components/IDE/CommandPalette';
import { useKeyboardShortcuts } from '@/components/IDE/KeyboardShortcuts';
import { AIWritingSurface } from '@/components/IDE/AIWritingSurface';
import { 
  BookOpen, 
  Users, 
  MessageSquare,
  Sparkles,
  FileText,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for Story Explorer
const MOCK_MANUSCRIPT_TREE: StoryNode[] = [
  {
    id: 'part-1',
    type: 'part',
    label: 'Part One: The Beginning',
    metadata: { wordCount: 25000, status: 'in-progress' },
    children: [
      { 
        id: 'ch-1', 
        type: 'chapter', 
        label: 'Chapter 1: The Awakening', 
        metadata: { wordCount: 3500, status: 'complete' } 
      },
      { 
        id: 'ch-2', 
        type: 'chapter', 
        label: 'Chapter 2: Rising Action', 
        metadata: { wordCount: 4200, status: 'complete' } 
      },
      { 
        id: 'ch-3', 
        type: 'chapter', 
        label: 'Chapter 3: The Conflict', 
        metadata: { wordCount: 3800, status: 'in-progress' },
        aiStatus: 'has-issues',
      },
      { 
        id: 'ch-4', 
        type: 'chapter', 
        label: 'Chapter 4: The Revelation', 
        metadata: { wordCount: 0, status: 'draft' } 
      },
    ],
  },
  {
    id: 'part-2',
    type: 'part',
    label: 'Part Two: The Middle',
    metadata: { wordCount: 0, status: 'draft' },
    children: [],
  },
];

const MOCK_CHARACTERS_TREE: StoryNode[] = [
  {
    id: 'char-group-main',
    type: 'character-group',
    label: 'Main Characters',
    metadata: {},
    children: [
      { 
        id: 'char-1', 
        type: 'character', 
        label: 'Alex Morrison', 
        metadata: { role: 'protagonist', appearances: ['ch-1', 'ch-2', 'ch-3'] } 
      },
      { 
        id: 'char-2', 
        type: 'character', 
        label: 'Sarah Chen', 
        metadata: { role: 'supporting', appearances: ['ch-2', 'ch-3'] } 
      },
    ],
  },
  {
    id: 'char-group-antag',
    type: 'character-group',
    label: 'Antagonists',
    metadata: {},
    children: [
      { 
        id: 'char-3', 
        type: 'character', 
        label: 'The Shadow', 
        metadata: { role: 'antagonist', appearances: ['ch-3'] },
        aiStatus: 'analyzing',
      },
    ],
  },
];

const MOCK_WORLD_TREE: StoryNode[] = [
  {
    id: 'loc-group-1',
    type: 'location-group',
    label: 'Key Locations',
    metadata: {},
    children: [
      { 
        id: 'loc-1', 
        type: 'location', 
        label: 'Victorian House', 
        metadata: { locationType: 'interior', scenesSet: ['ch-3'] } 
      },
      { 
        id: 'loc-2', 
        type: 'location', 
        label: 'City Streets', 
        metadata: { locationType: 'exterior', scenesSet: ['ch-1', 'ch-2'] } 
      },
    ],
  },
];

const MOCK_NOTES_TREE: StoryNode[] = [
  { 
    id: 'note-1', 
    type: 'note', 
    label: 'Plot Ideas', 
    metadata: { noteType: 'idea', tags: ['plot', 'twist'] } 
  },
  { 
    id: 'note-2', 
    type: 'note', 
    label: 'Research: Victorian Era', 
    metadata: { noteType: 'research', tags: ['setting', 'history'] } 
  },
];

// Mock writing problems
const MOCK_PROBLEMS: WritingProblem[] = [
  {
    id: 'p1',
    severity: 'error',
    type: 'character-consistency',
    message: "Alex's eye color changes from blue to brown",
    description: "Eye color was established as blue in Chapter 1, but described as brown here.",
    chapter: 'Chapter 3',
    line: 42,
    fixable: true,
    source: 'ai-analysis',
  },
  {
    id: 'p2',
    severity: 'error',
    type: 'timeline-conflict',
    message: "Event occurs before character is introduced",
    description: "Sarah is mentioned before her introduction scene.",
    chapter: 'Chapter 2',
    line: 156,
    source: 'ai-analysis',
  },
  {
    id: 'p3',
    severity: 'error',
    type: 'plot-hole',
    message: "Unresolved subplot about the missing artifact",
    description: "The artifact mentioned in Chapter 1 is never explained.",
    chapter: 'Chapter 4',
    line: 89,
    source: 'ai-analysis',
  },
  {
    id: 'p4',
    severity: 'warning',
    type: 'passive-voice',
    message: "Consider rephrasing for stronger impact",
    suggestion: 'Change "was discovered by Alex" to "Alex discovered"',
    chapter: 'Chapter 1',
    line: 23,
    fixable: true,
    source: 'rule-based',
  },
  {
    id: 'p5',
    severity: 'warning',
    type: 'repetition',
    message: "'suddenly' used 3 times in this section",
    description: "Repetitive word usage can weaken prose.",
    chapter: 'Chapter 3',
    line: 67,
    source: 'rule-based',
  },
  {
    id: 'p6',
    severity: 'suggestion',
    type: 'pacing',
    message: "Consider adding a scene break before the time jump",
    chapter: 'Chapter 2',
    line: 203,
    source: 'ai-analysis',
  },
  {
    id: 'p7',
    severity: 'info',
    type: 'pov-shift',
    message: "POV shifts from Alex to omniscient narrator",
    chapter: 'Chapter 3',
    line: 89,
    source: 'ai-analysis',
  },
];

// Mock editor tabs
const INITIAL_TABS: EditorTab[] = [
  { id: 'ch-1', label: 'Chapter 1: The Awakening', type: 'chapter', path: 'Part One/Chapter 1' },
  { id: 'ch-3', label: 'Chapter 3: The Conflict', type: 'chapter', path: 'Part One/Chapter 3', isDirty: true },
  { id: 'char-alex', label: 'Alex Morrison', type: 'character', path: 'Characters/Alex Morrison' },
];

// Demo story content for the TipTap editor
const DEMO_STORY_CONTENT = `
<h1>Chapter 3: The Conflict</h1>

<p>The rain hammered against the windows of the old Victorian house, each droplet a tiny percussion in the symphony of the storm. Alex stood at the threshold, hand hovering over the tarnished brass doorknob, heart pounding in sync with the thunder rolling across the sky.</p>

<p>"You don't have to do this," Sarah's voice came from behind, barely audible over the storm. "There's still time to walk away."</p>

<p>But Alex knew there wasn't. Not anymore. Not after everything they'd discovered about The Shadow and his plans. The doorknob felt cold under their palm as they turned it, the ancient mechanism groaning in protest.</p>

<p>Inside, the house was darker than Alex expected, the kind of darkness that seemed to have weight and substance. The air smelled of old books and something else—something that made the hair on the back of their neck stand up.</p>

<p>"Hello?" Alex called out, their voice swallowed by the vast emptiness.</p>

<p>No response. Just the distant drip of water somewhere deep in the house, and the muffled rumble of thunder outside.</p>

<p>Sarah stepped in behind them, her flashlight cutting through the darkness. The beam revealed a grand foyer, dust motes dancing in the light like tiny stars. A sweeping staircase curved up into the shadows, its banister carved with intricate patterns that seemed to move in the flickering light.</p>

<p>"The study should be upstairs," Sarah whispered, consulting the map they'd found in the old records. "Third door on the left."</p>

<p>Alex nodded, though the gesture was lost in the darkness. Together, they began to climb.</p>
`;

function IDEDemoContent() {
  const { layout, togglePanel } = usePanels();
  const { currentTheme, isDark } = useTheme();
  const { activeTasks, taskHistory, clearHistory, totalActiveCount } = useAgents();
  
  // Command palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    enabled: true,
    onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    onToggleLeftPanel: () => togglePanel('left'),
    onToggleRightPanel: () => togglePanel('right'),
    onToggleBottomPanel: () => togglePanel('bottom'),
  });
  
  const problemCount = useMemo(() => ({
    errors: MOCK_PROBLEMS.filter(p => p.severity === 'error').length,
    warnings: MOCK_PROBLEMS.filter(p => p.severity === 'warning').length,
  }), []);
  
  // AI status derived from active tasks
  const aiStatus = useMemo<'idle' | 'working' | 'error'>(() => {
    if (totalActiveCount > 0) return 'working';
    return 'idle';
  }, [totalActiveCount]);
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  
  // Editor tabs state
  const [tabs, setTabs] = useState<EditorTab[]>(INITIAL_TABS);
  const [activeTabId, setActiveTabId] = useState<string>('ch-3');
  
  // Handle tab actions
  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);
  
  const handleTabClose = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[0].id);
      }
      return newTabs;
    });
  }, [activeTabId]);
  
  const handleTabPin = useCallback((tabId: string) => {
    setTabs(prev => prev.map(t => 
      t.id === tabId ? { ...t, isPinned: !t.isPinned } : t
    ));
  }, []);
  
  // Handle story node selection
  const handleSelectNode = (node: StoryNode) => {
    setSelectedNode(node);
    console.log('Selected node:', node);
    
    // Open in editor tabs if it's a chapter or scene
    if (node.type === 'chapter' || node.type === 'scene') {
      const existingTab = tabs.find(t => t.id === node.id);
      if (existingTab) {
        setActiveTabId(node.id);
      } else {
        const newTab: EditorTab = {
          id: node.id,
          label: node.label,
          type: node.type,
          isPreview: true, // Single click opens as preview
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(node.id);
      }
    }
  };
  
  // Handle problem click - would navigate to position in editor
  const handleProblemClick = (problem: WritingProblem) => {
    console.log('Navigate to problem:', problem);
  };
  
  // Mock Left Panel content based on active panel
  const leftPanel = useMemo(() => {
    if (layout.leftPanel.activePanel === 'story-explorer' || 
        layout.leftPanel.activePanel === 'characters' ||
        layout.leftPanel.activePanel === 'world') {
      return (
        <StoryExplorer
          projectName="My Novel"
          manuscriptTree={MOCK_MANUSCRIPT_TREE}
          charactersTree={MOCK_CHARACTERS_TREE}
          worldTree={MOCK_WORLD_TREE}
          notesTree={MOCK_NOTES_TREE}
          onSelectNode={handleSelectNode}
          onCreateNode={(type, parentId) => console.log('Create:', type, parentId)}
          onRenameNode={(id, name) => console.log('Rename:', id, name)}
          onDeleteNode={(id) => console.log('Delete:', id)}
          onRefresh={() => console.log('Refresh')}
        />
      );
    }
    
    if (layout.leftPanel.activePanel === 'settings') {
      return (
        <div className="h-full flex flex-col">
          <div className="px-4 py-3 border-b border-[--ide-border]">
            <h2 className="text-xs font-semibold uppercase tracking-wide">Settings</h2>
          </div>
          <div className="flex-1 p-4 space-y-4">
            <div>
              <label className="text-xs font-medium mb-2 block">Color Theme</label>
              <ThemePicker />
            </div>
          </div>
        </div>
      );
    }
    
    if (layout.leftPanel.activePanel === 'ai-agents') {
      return <AIAgentsPanel />;
    }
    
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-[--ide-border]">
          <h2 className="text-xs font-semibold uppercase tracking-wide">
            {layout.leftPanel.activePanel}
          </h2>
        </div>
        <div className="flex-1 p-4">
          <p className="text-sm text-[--ide-activitybar-inactive]">
            Panel content for: {layout.leftPanel.activePanel}
          </p>
        </div>
      </div>
    );
  }, [layout.leftPanel.activePanel]);
  
  // Chat input state
  const [chatInput, setChatInput] = useState('');
  
  // Mock Right Panel - AI Chat with VSCode-like styling
  const rightPanel = (
    <div className="h-full flex flex-col bg-[--ide-sidebar-bg]">
      {/* Header - compact VSCode style */}
      <div className="h-[35px] min-h-[35px] px-3 flex items-center gap-2 border-b border-[--ide-border]">
        <span className="text-[11px] font-semibold text-[--ide-foreground-secondary] uppercase tracking-wider">
          Copilot
        </span>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <ChatMessage
          role="assistant"
          message="Hello! I'm your AI writing assistant. How can I help you with your story today?"
        />
        <ChatMessage
          role="user"
          message="Can you help me develop my protagonist's backstory?"
        />
        <ChatMessage
          role="assistant"
          message="I'd be happy to help! Let's start by exploring your protagonist's motivations and key life events. What age are they, and what's the central conflict driving them?"
        />
      </div>
      
      {/* Input - VSCode style compact */}
      <div className="p-2 border-t border-[--ide-border]">
        <div className="flex items-center bg-[--ide-input-bg] border border-[--ide-border] rounded focus-within:border-[--ide-accent] transition-colors">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about your story..."
            className="flex-1 px-2 py-1.5 bg-transparent text-[12px] text-[--ide-foreground] focus:outline-none placeholder:text-[--ide-foreground-muted]"
          />
          <button 
            className={cn(
              "p-1.5 mr-0.5 rounded transition-colors",
              chatInput ? "text-[--ide-accent] hover:bg-[--ide-list-hover]" : "text-[--ide-foreground-muted]"
            )}
            disabled={!chatInput}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
  
  // Bottom Panel - use the new BottomPanel component with agent integration
  const bottomPanel = (
    <BottomPanel
      problems={MOCK_PROBLEMS}
      isAnalyzing={false}
      onProblemClick={handleProblemClick}
      activeTasks={activeTasks}
      taskHistory={taskHistory}
      onClearAgentHistory={clearHistory}
      storyMetrics={{
        wordCount: 25000,
        chapterCount: 4,
        sceneCount: 12,
        characterMentions: { 'Alex': 156, 'Sarah': 89, 'The Shadow': 34 },
        pacing: {
          actionPercent: 35,
          dialoguePercent: 40,
          descriptionPercent: 25,
        },
        styleMetrics: {
          passiveVoicePercent: 12,
          averageSentenceLength: 18,
          adverbDensity: 2.3,
          dialogueTagVariety: 0.7,
        },
      }}
    />
  );
  
  // Main Editor Area - using real TipTap editor with AI features
  const [editorContent, setEditorContent] = useState(DEMO_STORY_CONTENT);
  
  const editorArea = (
    <div className="h-full flex flex-col">
      {/* Editor Tabs */}
      <EditorTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={handleTabSelect}
        onTabClose={handleTabClose}
        onTabPin={handleTabPin}
      />
      
      {/* TipTap Editor with AI Features */}
      <div className="flex-1 overflow-hidden bg-[--ide-editor-bg]">
        <AIWritingSurface
          content={editorContent}
          onContentChange={setEditorContent}
          placeholder="Start writing your story..."
          chapterTitle="Chapter 3: The Conflict"
          sceneName="The Victorian House"
          characters={['Alex', 'Sarah', 'The Shadow']}
          locations={['Victorian House', 'City Streets']}
          enableGhostText={true}
          enableInlineAgents={true}
          ghostTextDelay={2000}
          className="h-full"
          editorClassName=""
        />
      </div>
    </div>
  );

  return (
    <>
      <IDEShell
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        bottomPanel={bottomPanel}
        editor={null}
        projectTitle="My Novel"
        problemCount={problemCount}
        aiStatus={aiStatus}
        isSynced={true}
        isOnline={true}
      >
        {editorArea}
      </IDEShell>
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onOpenChange={setIsCommandPaletteOpen} 
      />
    </>
  );
}

// Helper Components - VSCode Copilot-like chat messages
function ChatMessage({ role, message }: { role: 'user' | 'assistant'; message: string }) {
  return (
    <div className={cn(
      'flex gap-2',
      role === 'user' ? 'flex-row-reverse' : 'flex-row'
    )}>
      <div className={cn(
        'w-5 h-5 rounded flex items-center justify-center flex-shrink-0',
        role === 'user' ? 'bg-[--ide-accent]' : 'bg-[--ide-foreground-muted]'
      )}>
        {role === 'user' ? (
          <Users className="w-3 h-3 text-white" />
        ) : (
          <Sparkles className="w-3 h-3 text-white" />
        )}
      </div>
      <div className={cn(
        'flex-1',
        role === 'user' && 'text-right'
      )}>
        <div className={cn(
          'inline-block px-2 py-1.5 rounded text-[12px] leading-normal',
          role === 'user' 
            ? 'bg-[--ide-accent] text-white' 
            : 'bg-[--ide-background-tertiary] text-[--ide-foreground]'
        )}>
          {message}
        </div>
      </div>
    </div>
  );
}

export default function IDEDemoPage() {
  return (
    <PanelProvider>
      <AgentProvider>
        <IDEDemoContent />
      </AgentProvider>
    </PanelProvider>
  );
}
