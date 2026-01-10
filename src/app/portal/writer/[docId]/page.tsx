'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  PanelProvider, 
  IDEShell, 
  ThemePicker, 
  useTheme, 
  usePanels, 
  StoryExplorer, 
  StoryNode, 
  BottomPanel, 
  WritingProblem, 
  EditorTabs, 
  EditorTab, 
  AIAgentsPanel, 
  AgentProvider, 
  useAgents, 
  CommandPalette, 
  useKeyboardShortcuts, 
  AIWritingSurface,
  AICopilotPanel,
  WorldBuildingPanel,
  NotesPanel,
  StoryNote
} from '@/components/IDE';
import { 
  BookOpen, 
  Users, 
  MessageSquare,
  Sparkles,
  FileText,
  Loader2,
  Plus,
  Globe,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useIDEProject } from '@/hooks/useIDEProject';

export default function WriterPage() {
  const params = useParams();
  const docId = params.docId as string;
  
  const { 
    state, 
    isLoading, 
    error, 
    storyTree, 
    setCurrentChapter,
    updateContent,
    saveContent,
    createChapter,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    createNote,
    updateNote,
    deleteNote,
    createLocation,
    updateLocation,
    deleteLocation,
    createOutline,
    updateOutline,
    deleteOutline,
    createAgentReview,
    updateAgentReview,
    deleteAgentReview,
    isSyncing,
    refresh
  } = useIDEProject({ projectId: docId });

  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [tabs, setTabs] = useState<EditorTab[]>([]);

  const [problems] = useState<WritingProblem[]>([
    { id: 'p1', severity: 'warning', message: 'Passive voice detected in paragraph 4', type: 'passive-voice', source: 'ai-analysis', line: 42 },
    { id: 'p2', severity: 'info', message: 'Consider using a stronger verb than "went"', type: 'style-issue', source: 'ai-analysis', line: 15 },
  ]);

  // Sync active tab with current chapter
  useEffect(() => {
    if (state.currentChapter) {
      const chapter = state.currentChapter;
      const existingTab = tabs.find(t => t.id === chapter.id);
      if (!existingTab) {
        setTabs(prev => [...prev, { 
          id: chapter.id, 
          label: chapter.title, 
          type: 'chapter'
        }]);
      }
      setActiveTabId(chapter.id);
    }
  }, [state.currentChapter]);

  const handleTabClose = (id: string) => {
    setTabs(prev => prev.filter(t => t.id !== id));
    if (activeTabId === id && tabs.length > 1) {
      const remaining = tabs.filter(t => t.id !== id);
      setActiveTabId(remaining[0].id);
      setCurrentChapter(remaining[0].id);
    } else if (tabs.length === 1) {
      setActiveTabId(null);
      setCurrentChapter(null);
    }
  };

  const handleTabSelect = (id: string) => {
    setActiveTabId(id);
    setCurrentChapter(id);
  };

  const handleNodeSelect = (node: StoryNode) => {
    if (node.type === 'chapter') {
      handleTabSelect(node.id);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[--ide-background] text-[--ide-foreground]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[--ide-accent]" />
          <p className="text-sm font-medium opacity-50">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[--ide-background] text-[--ide-foreground]">
        <div className="max-w-md p-8 border border-[--ide-border] rounded-lg bg-[--ide-sidebar-bg] text-center">
          <h2 className="text-xl font-bold mb-2 text-red-400">Failed to load project</h2>
          <p className="text-sm opacity-70 mb-6">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[--ide-accent] text-white rounded hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <PanelProvider>
      <AgentProvider>
        <WriterIDE 
          project={state.project}
          storyTree={storyTree}
          tabs={tabs}
          activeTabId={activeTabId}
          setActiveTabId={handleTabSelect}
          onTabClose={handleTabClose}
          onNodeSelect={handleNodeSelect}
          onCreateChapter={createChapter}
          onCreateCharacter={createCharacter}
          onUpdateCharacter={updateCharacter}
          onDeleteCharacter={deleteCharacter}
          onCreateNote={createNote}
          onUpdateNote={updateNote}
          onDeleteNote={deleteNote}
          onCreateLocation={createLocation}
          onUpdateLocation={updateLocation}
          onDeleteLocation={deleteLocation}
          onCreateOutline={createOutline}
          onUpdateOutline={updateOutline}
          onDeleteOutline={deleteOutline}
          onCreateAgentReview={createAgentReview}
          onUpdateAgentReview={updateAgentReview}
          onDeleteAgentReview={deleteAgentReview}
          onRefresh={refresh}
          problems={problems}
          currentChapter={state.currentChapter}
          characters={state.characters}
          notes={state.notes}
          locations={state.locations}
          outlines={state.outlines}
          agentReviews={state.agentReviews}
          onContentChange={updateContent}
          isSyncing={isSyncing}
        />
      </AgentProvider>
    </PanelProvider>
  );
}

function WriterIDE({ 
  project,
  storyTree,
  tabs, 
  activeTabId, 
  setActiveTabId, 
  onTabClose, 
  onNodeSelect,
  onCreateChapter,
  onCreateCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onCreateLocation,
  onUpdateLocation,
  onDeleteLocation,
  onRefresh,
  problems,
  currentChapter,
  characters,
  notes,
  locations,
  onContentChange,
  isSyncing
}: any) {
  const { layout, togglePanel, setActivePanel } = usePanels();
  const { theme, setTheme, toggleTheme } = useTheme();
  const { activeTasks, taskHistory, clearHistory } = useAgents();
  
  // Track editor selection for AI context
  const [editorSelection, setEditorSelection] = useState<{
    selectedText: string;
    cursorPosition: number;
  }>({ selectedText: '', cursorPosition: 0 });

  // Use a ref to store the editor's functions (avoids stale closure issues)
  const editorFnsRef = React.useRef<{
    insertText: (text: string) => void;
    replaceSelection: (text: string) => void;
  } | null>(null);

  // Store ALL editor functions by tab ID, so we can access the active one
  const allEditorFnsRef = React.useRef<Map<string, {
    insertText: (text: string) => void;
    replaceSelection: (text: string) => void;
  }>>(new Map());

  // Update the main ref when active tab changes
  useEffect(() => {
    if (activeTabId) {
      const fns = allEditorFnsRef.current.get(activeTabId);
      if (fns) {
        console.log('Setting editorFnsRef for active tab:', activeTabId);
        editorFnsRef.current = fns;
      }
    }
  }, [activeTabId]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleLeftPanel: () => togglePanel('left'),
    onToggleBottomPanel: () => togglePanel('bottom'),
    onToggleRightPanel: () => togglePanel('right'),
  });

  return (
    <div className="h-screen w-screen overflow-hidden bg-[--ide-editor-bg] text-[--ide-foreground] flex flex-col">
      <CommandPalette />
      
      <IDEShell
        projectTitle={project?.title}
        isSynced={!isSyncing}
        leftPanel={
          <div className="h-full flex flex-col">
            {layout.leftPanel.activePanel === 'story-explorer' && (
              <StoryExplorer 
                projectName={project?.title}
                manuscriptTree={storyTree} 
                onSelectNode={onNodeSelect}
                onCreateNode={async (type) => {
                  if (type === 'chapter') {
                    const title = prompt('Enter chapter title:', 'New Chapter');
                    if (title) {
                      const newChapter = await onCreateChapter(title);
                      if (newChapter) onNodeSelect({ id: newChapter.id, type: 'chapter' } as any);
                    }
                  }
                }}
              />
            )}
            {layout.leftPanel.activePanel === 'characters' && (
              <CharactersPanel 
                characters={characters || []}
                onCreateCharacter={onCreateCharacter}
                onUpdateCharacter={onUpdateCharacter}
                onDeleteCharacter={onDeleteCharacter}
              />
            )}
            {layout.leftPanel.activePanel === 'notes' && (
              <NotesPanel 
                notes={notes || []}
                onCreateNote={onCreateNote}
                onUpdateNote={onUpdateNote}
                onDeleteNote={onDeleteNote}
              />
            )}
            {layout.leftPanel.activePanel === 'world' && (
              <WorldBuildingPanel 
                locations={locations || []}
                onCreateLocation={onCreateLocation}
                onUpdateLocation={onUpdateLocation}
                onDeleteLocation={onDeleteLocation}
              />
            )}
            {layout.leftPanel.activePanel === 'search' && (
              <SearchPanel />
            )}
            {layout.leftPanel.activePanel === 'ai-agents' && (
              <AIAgentsPanel />
            )}
            {layout.leftPanel.activePanel === 'settings' && (
              <SettingsPanel />
            )}
          </div>
        }
        bottomPanel={
          <BottomPanel 
            problems={problems} 
            activeTasks={activeTasks}
            taskHistory={taskHistory}
            onClearAgentHistory={clearHistory}
          />
        }
        rightPanel={
          <AICopilotPanel 
            documentContent={currentChapter?.content}
            selectedText={editorSelection.selectedText}
            cursorPosition={editorSelection.cursorPosition}
            // Story framework data
            characters={characters?.map((c: any) => ({
              id: c.id,
              name: c.name,
              role: c.role,
              description: c.description,
              traits: c.traits
            })) || []}
            locations={(locations || []).map((l: any) => ({
              id: l.id,
              name: l.name,
              type: l.type,
              description: l.description
            }))}
            notes={(notes || []).map((n: any) => ({
              id: n.id,
              title: n.title,
              content: n.content,
              category: n.category
            }))}
            chapterTitle={currentChapter?.title}
            projectTitle={project?.title}
            // Framework creation callbacks (for AI to populate story framework)
            onCreateCharacter={async (data: { name?: string; role?: string; description?: string; traits?: string[]; notes?: string }) => {
              const result = await onCreateCharacter({
                name: data.name || 'Unnamed Character',
                role: data.role,
                description: data.description,
                traits: data.traits,
                notes: data.notes
              });
              return {
                id: result.id,
                name: result.name,
                role: result.role,
                description: result.description,
                traits: result.traits,
                notes: result.notes
              };
            }}
            onCreateLocation={async (data: { name?: string; type?: string; description?: string }) => {
              const result = await onCreateLocation({
                name: data.name || 'Unnamed Location',
                type: data.type,
                description: data.description
              });
              return {
                id: result.id,
                name: result.name,
                type: result.type,
                description: result.description
              };
            }}
            onCreateNote={async (data: { title?: string; content?: string; category?: string }) => {
              const result = await onCreateNote({
                title: data.title || 'Untitled Note',
                content: data.content || '',
                category: data.category
              });
              return {
                id: result.id,
                title: result.title,
                content: result.content,
                category: result.category
              };
            }}
            onInsertText={(text: string) => {
              console.log('AICopilotPanel onInsertText called:', { 
                textLength: text.length, 
                hasEditorFns: !!editorFnsRef.current,
                hasInsertText: !!editorFnsRef.current?.insertText 
              });
              
              // Use the editor's native insertText if available
              if (editorFnsRef.current?.insertText) {
                editorFnsRef.current.insertText(text);
              } else {
                console.warn('No editor insertText function available, using fallback');
                // Fallback: manually insert into content string
                if (currentChapter?.content !== undefined && onContentChange) {
                  const pos = editorSelection.cursorPosition || currentChapter.content.length;
                  const newContent = 
                    currentChapter.content.slice(0, pos) + 
                    text + 
                    currentChapter.content.slice(pos);
                  onContentChange(newContent);
                }
              }
            }}
            onReplaceSelection={(text: string) => {
              console.log('AICopilotPanel onReplaceSelection called:', { 
                textLength: text.length, 
                hasEditorFns: !!editorFnsRef.current,
                hasReplaceSelection: !!editorFnsRef.current?.replaceSelection,
                currentSelection: editorSelection.selectedText?.slice(0, 50)
              });
              
              // Use the editor's native replaceSelection if available
              if (editorFnsRef.current?.replaceSelection) {
                editorFnsRef.current.replaceSelection(text);
              } else {
                console.warn('No editor replaceSelection function, trying insertText');
                // Fallback: try insert
                if (editorFnsRef.current?.insertText) {
                  editorFnsRef.current.insertText(text);
                } else {
                  console.error('No editor functions available at all!');
                }
              }
            }}
          />
        }
      >
        <div className="h-full flex flex-col">
          <EditorTabs 
            tabs={tabs} 
            activeTabId={activeTabId} 
            onTabSelect={setActiveTabId}
            onTabClose={onTabClose}
          />
          <div className="flex-1 overflow-hidden relative">
            {tabs.map((tab: EditorTab) => (
              <div 
                key={tab.id} 
                className={cn(
                  "absolute inset-0 transition-opacity duration-150",
                  activeTabId === tab.id ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                )}
              >
                <AIWritingSurface 
                  content={tab.id === currentChapter?.id ? currentChapter.content : ''}
                  onContentChange={tab.id === currentChapter?.id ? onContentChange : undefined}
                  onSelectionChange={tab.id === activeTabId ? setEditorSelection : undefined}
                  onEditorReady={(fns) => { 
                    console.log('onEditorReady called for tab:', tab.id, { 
                      hasInsertText: !!fns.insertText, 
                      hasReplaceSelection: !!fns.replaceSelection,
                      isActive: tab.id === activeTabId
                    });
                    // Always store in the map
                    allEditorFnsRef.current.set(tab.id, fns);
                    // If this is the active tab, also set the main ref
                    if (tab.id === activeTabId) {
                      editorFnsRef.current = fns;
                    }
                  }}
                  chapterTitle={tab.label}
                  characters={characters?.map((c: any) => c.name)}
                />
              </div>
            ))}
            {tabs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-[--ide-foreground-muted] space-y-4">
                <BookOpen className="h-16 w-16 opacity-10" />
                <div className="text-center">
                  <p className="mb-4">Select a chapter from the explorer to start writing</p>
                  <button 
                    onClick={async () => {
                      const title = prompt('Enter chapter title:', 'Chapter 1');
                      if (title) {
                        const newChapter = await onCreateChapter(title);
                        if (newChapter) onNodeSelect({ id: newChapter.id, type: 'chapter' } as any);
                      }
                    }}
                    className="px-4 py-2 bg-[--ide-accent] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Chapter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </IDEShell>
    </div>
  );
}

// Characters Panel Component
function CharactersPanel({ 
  characters, 
  onCreateCharacter, 
  onUpdateCharacter, 
  onDeleteCharacter 
}: any) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharRole, setNewCharRole] = useState('supporting');
  
  const handleCreate = async () => {
    if (!newCharName.trim()) return;
    await onCreateCharacter({ name: newCharName, role: newCharRole });
    setNewCharName('');
    setNewCharRole('supporting');
    setIsCreating(false);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="h-[35px] px-3 flex items-center justify-between border-b border-[--ide-border]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[--ide-foreground-secondary]">
          Characters
        </span>
        <button 
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-[--ide-list-hover] rounded"
        >
          <Plus className="w-4 h-4 text-[--ide-foreground-secondary]" />
        </button>
      </div>
      
      {isCreating && (
        <div className="p-3 border-b border-[--ide-border] space-y-2">
          <input
            type="text"
            value={newCharName}
            onChange={(e) => setNewCharName(e.target.value)}
            placeholder="Character name"
            className="w-full px-2 py-1 text-sm bg-[--ide-input-bg] border border-[--ide-border] rounded"
            autoFocus
          />
          <select 
            value={newCharRole} 
            onChange={(e) => setNewCharRole(e.target.value)}
            className="w-full px-2 py-1 text-sm bg-[--ide-input-bg] border border-[--ide-border] rounded"
          >
            <option value="protagonist">Protagonist</option>
            <option value="antagonist">Antagonist</option>
            <option value="supporting">Supporting</option>
            <option value="minor">Minor</option>
          </select>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="flex-1 px-2 py-1 text-xs bg-[--ide-accent] text-white rounded">Create</button>
            <button onClick={() => setIsCreating(false)} className="flex-1 px-2 py-1 text-xs border border-[--ide-border] rounded">Cancel</button>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-auto p-2">
        {characters.length === 0 ? (
          <div className="text-center py-8 text-[--ide-foreground-muted] text-xs">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p>No characters yet</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="mt-2 text-[--ide-accent] hover:underline"
            >
              Create your first character
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {characters.map((char: any) => (
              <div 
                key={char.id}
                className="p-2 rounded hover:bg-[--ide-list-hover] cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{char.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[--ide-border] text-[--ide-foreground-muted]">
                    {char.role}
                  </span>
                </div>
                {char.description && (
                  <p className="text-xs text-[--ide-foreground-muted] mt-1 line-clamp-2">{char.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Search Panel Component
function SearchPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <div className="h-full flex flex-col">
      <div className="h-[35px] px-3 flex items-center border-b border-[--ide-border]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[--ide-foreground-secondary]">
          Search
        </span>
      </div>
      <div className="p-3 border-b border-[--ide-border]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[--ide-foreground-muted]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in project..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-[--ide-input-bg] border border-[--ide-border] rounded"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 text-center text-[--ide-foreground-muted] text-sm">
        {searchQuery ? (
          <p>Searching for "{searchQuery}"...</p>
        ) : (
          <p className="text-xs">Enter a search term to find content across your project</p>
        )}
      </div>
    </div>
  );
}

// Settings Panel Component
function SettingsPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="h-[35px] px-3 flex items-center border-b border-[--ide-border]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[--ide-foreground-secondary]">
          Settings
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <ThemePicker />
      </div>
    </div>
  );
}
