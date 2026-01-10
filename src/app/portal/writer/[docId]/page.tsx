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
  AgentReviewsPanel,
  AgentProvider, 
  useAgents, 
  CommandPalette, 
  useKeyboardShortcuts, 
  AIWritingSurface,
  VSCodeCopilotWrapper,
  WorldBuildingPanel,
  NotesPanel,
  StoryNote,
  FrameworkWizard
} from '@/components/IDE';
import { FrameworkEditor, FrameworkData } from '@/components/IDE/FrameworkEditor';
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
    } else if (node.type === 'framework') {
      // Handle framework tab
      const frameworkTabId = 'framework-editor';
      const existingTab = tabs.find(t => t.id === frameworkTabId);
      if (!existingTab) {
        setTabs(prev => [...prev, { 
          id: frameworkTabId, 
          label: 'Story Framework', 
          type: 'framework'
        }]);
      }
      setActiveTabId(frameworkTabId);
    } else if (node.type === 'note') {
      // Handle note tab - open in TipTap editor like chapters
      const existingTab = tabs.find(t => t.id === node.id);
      if (!existingTab) {
        setTabs(prev => [...prev, { 
          id: node.id, 
          label: node.label, 
          type: 'note'
        }]);
      }
      setActiveTabId(node.id);
    } else if (node.type === 'location') {
      // Handle location tab - open in TipTap editor
      const existingTab = tabs.find(t => t.id === node.id);
      if (!existingTab) {
        setTabs(prev => [...prev, { 
          id: node.id, 
          label: node.label, 
          type: 'location'
        }]);
      }
      setActiveTabId(node.id);
    } else if (node.type === 'character') {
      // Handle character tab - open in TipTap editor
      const existingTab = tabs.find(t => t.id === node.id);
      if (!existingTab) {
        setTabs(prev => [...prev, { 
          id: node.id, 
          label: node.label, 
          type: 'character'
        }]);
      }
      setActiveTabId(node.id);
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
          chapters={state.chapters}
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
  onDeleteAgentReview,
  onRefresh,
  problems,
  currentChapter,
  characters,
  chapters,
  notes,
  locations,
  agentReviews,
  onContentChange,
  isSyncing
}: any) {
  const { layout, togglePanel, setActivePanel } = usePanels();
  const { theme, setTheme, toggleTheme } = useTheme();
  const { activeTasks, taskHistory, clearHistory } = useAgents();
  
  // Framework Wizard state
  const [showFrameworkWizard, setShowFrameworkWizard] = useState(false);
  
  // Framework Editor state
  const [frameworkData, setFrameworkData] = useState<FrameworkData | null>(null);
  
  // Load framework data from notes
  useEffect(() => {
    if (notes) {
      const frameworkNote = notes.find((n: any) => 
        n.title === 'Story Framework' && n.tags?.includes('framework')
      );
      if (frameworkNote) {
        try {
          const parsed = JSON.parse(frameworkNote.content);
          setFrameworkData(parsed);
        } catch (e) {
          console.error('Failed to parse framework note:', e);
        }
      }
    }
  }, [notes]);
  
  // Open framework editor tab
  const openFrameworkTab = useCallback(() => {
    const frameworkTabId = 'framework-editor';
    const existingTab = tabs.find((t: EditorTab) => t.id === frameworkTabId);
    if (!existingTab) {
      // Tab doesn't exist, need to add it - will be handled by parent
      onNodeSelect({ id: frameworkTabId, type: 'framework', label: 'Story Framework' } as any);
    } else {
      setActiveTabId(frameworkTabId);
    }
  }, [tabs, onNodeSelect, setActiveTabId]);
  
  // Handle framework save from editor
  const handleFrameworkSave = useCallback(async (data: FrameworkData) => {
    setFrameworkData(data);
    
    // Find existing framework note or create new one
    const existingNote = notes?.find((n: any) => 
      n.title === 'Story Framework' && n.tags?.includes('framework')
    );
    
    if (existingNote) {
      await onUpdateNote(existingNote.id, {
        content: JSON.stringify(data, null, 2)
      });
    } else {
      await onCreateNote({
        title: 'Story Framework',
        content: JSON.stringify(data, null, 2),
        category: 'research',
        tags: ['framework', 'ai-generated']
      });
    }
    console.log('Framework saved:', data);
  }, [notes, onUpdateNote, onCreateNote]);
  
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
  
  // Handle Framework Wizard save
  const handleSaveFramework = useCallback(async (frameworkData: any) => {
    // Save framework as a note with special category
    // Note: 'framework' is not a valid DB category, using 'research' and adding it to tags
    await onCreateNote({
      title: 'Story Framework',
      content: JSON.stringify(frameworkData, null, 2),
      category: 'research',
      tags: ['framework', 'ai-generated']
    });
    console.log('Framework saved:', frameworkData);
    
    // Update local state
    setFrameworkData(frameworkData);
    
    // Open the framework editor tab
    onNodeSelect({ id: 'framework-editor', type: 'framework', label: 'Story Framework' } as any);
  }, [onCreateNote, onNodeSelect]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[--ide-editor-bg] text-[--ide-foreground] flex flex-col">
      <CommandPalette />
      
      {/* Framework Wizard Modal */}
      {showFrameworkWizard && (
        <FrameworkWizard
          projectId={project?.id || ''}
          projectTitle={project?.title || 'Untitled Project'}
          onSave={handleSaveFramework}
          onCreateCharacter={onCreateCharacter}
          onCreateLocation={onCreateLocation}
          onCreateNote={onCreateNote}
          onClose={() => setShowFrameworkWizard(false)}
        />
      )}
      
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
                onSelectCharacter={(char: any) => {
                  // Open character in editor tab
                  onNodeSelect({ 
                    id: char.id, 
                    type: 'character', 
                    label: char.name 
                  } as any);
                }}
              />
            )}
            {layout.leftPanel.activePanel === 'notes' && (
              <NotesPanel 
                notes={notes || []}
                onCreateNote={onCreateNote}
                onUpdateNote={onUpdateNote}
                onDeleteNote={onDeleteNote}
                onSelectNote={(note) => {
                  // Open note in editor tab
                  onNodeSelect({ 
                    id: note.id, 
                    type: 'note', 
                    label: note.title 
                  } as any);
                }}
              />
            )}
            {layout.leftPanel.activePanel === 'world' && (
              <WorldBuildingPanel 
                locations={locations || []}
                onCreateLocation={onCreateLocation}
                onUpdateLocation={onUpdateLocation}
                onDeleteLocation={onDeleteLocation}
                onSelectLocation={(location) => {
                  // Open location in editor tab
                  onNodeSelect({ 
                    id: location.id, 
                    type: 'location', 
                    label: location.name 
                  } as any);
                }}
              />
            )}
            {layout.leftPanel.activePanel === 'search' && (
              <SearchPanel />
            )}
            {layout.leftPanel.activePanel === 'ai-agents' && (
              <AgentReviewsPanel 
                reviews={agentReviews || []}
                chapters={chapters || []}
                onDeleteReview={async (id) => {
                  await onDeleteAgentReview(id);
                }}
              />
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
          <VSCodeCopilotWrapper 
            documentContent={currentChapter?.content}
            selectedText={editorSelection.selectedText}
            chapterTitle={currentChapter?.title}
            projectTitle={project?.title}
            characters={characters?.map((c: any) => ({
              id: c.id,
              name: c.name,
              role: c.role,
              description: c.description,
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
            onInsertText={(text: string) => {
              if (editorFnsRef.current?.insertText) {
                editorFnsRef.current.insertText(text);
              } else if (currentChapter?.content !== undefined && onContentChange) {
                const pos = editorSelection.cursorPosition || currentChapter.content.length;
                const newContent = 
                  currentChapter.content.slice(0, pos) + 
                  text + 
                  currentChapter.content.slice(pos);
                onContentChange(newContent);
              }
            }}
            onReplaceSelection={(text: string) => {
              if (editorFnsRef.current?.replaceSelection) {
                editorFnsRef.current.replaceSelection(text);
              } else if (editorFnsRef.current?.insertText) {
                editorFnsRef.current.insertText(text);
              }
            }}
            onCreateCharacter={onCreateCharacter}
            onCreateLocation={onCreateLocation}
            onCreateNote={onCreateNote}
            onLaunchFrameworkWizard={() => setShowFrameworkWizard(true)}
            onOpenFrameworkEditor={() => onNodeSelect({ id: 'framework-editor', type: 'framework', label: 'Story Framework' } as any)}
            hasFramework={!!frameworkData}
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
                {tab.type === 'framework' ? (
                  <FrameworkEditor
                    projectId={project?.id || ''}
                    initialData={frameworkData || undefined}
                    onSave={handleFrameworkSave}
                    onCreateCharacter={onCreateCharacter}
                    onUpdateCharacter={onUpdateCharacter}
                    onDeleteCharacter={onDeleteCharacter}
                    onCreateLocation={onCreateLocation}
                    onUpdateLocation={onUpdateLocation}
                    onDeleteLocation={onDeleteLocation}
                    onCreateNote={onCreateNote}
                    onUpdateNote={onUpdateNote}
                    characters={characters}
                    locations={locations}
                    notes={notes}
                  />
                ) : tab.type === 'note' ? (
                  // Note editing in TipTap - same editor as chapters
                  <AIWritingSurface 
                    content={notes?.find((n: any) => n.id === tab.id)?.content || ''}
                    onContentChange={(content: string) => {
                      // Update the note content
                      onUpdateNote(tab.id, { content });
                    }}
                    onSelectionChange={tab.id === activeTabId ? setEditorSelection : undefined}
                    onEditorReady={(fns) => { 
                      allEditorFnsRef.current.set(tab.id, fns);
                      if (tab.id === activeTabId) {
                        editorFnsRef.current = fns;
                      }
                    }}
                    chapterTitle={tab.label}
                    characters={characters?.map((c: any) => c.name)}
                  />
                ) : tab.type === 'location' ? (
                  // Location editing in TipTap
                  <AIWritingSurface 
                    content={locations?.find((l: any) => l.id === tab.id)?.description || ''}
                    onContentChange={(content: string) => {
                      onUpdateLocation(tab.id, { description: content });
                    }}
                    onSelectionChange={tab.id === activeTabId ? setEditorSelection : undefined}
                    onEditorReady={(fns) => { 
                      allEditorFnsRef.current.set(tab.id, fns);
                      if (tab.id === activeTabId) {
                        editorFnsRef.current = fns;
                      }
                    }}
                    chapterTitle={tab.label}
                    characters={characters?.map((c: any) => c.name)}
                  />
                ) : tab.type === 'character' ? (
                  // Character editing in TipTap - edit description/notes
                  <AIWritingSurface 
                    content={(() => {
                      const char = characters?.find((c: any) => c.id === tab.id);
                      if (!char) return '';
                      // Combine description and notes into editable content
                      let content = char.description || '';
                      if (char.notes) {
                        content += (content ? '\n\n---\n\n' : '') + '## Notes\n\n' + char.notes;
                      }
                      return content;
                    })()}
                    onContentChange={(content: string) => {
                      // Parse content back to description and notes
                      const parts = content.split('\n\n---\n\n');
                      const description = parts[0] || '';
                      const notesMatch = parts[1]?.match(/^## Notes\n\n([\s\S]*)$/);
                      const notes = notesMatch ? notesMatch[1] : parts[1] || '';
                      onUpdateCharacter(tab.id, { description, notes });
                    }}
                    onSelectionChange={tab.id === activeTabId ? setEditorSelection : undefined}
                    onEditorReady={(fns) => { 
                      allEditorFnsRef.current.set(tab.id, fns);
                      if (tab.id === activeTabId) {
                        editorFnsRef.current = fns;
                      }
                    }}
                    chapterTitle={tab.label}
                    characters={characters?.map((c: any) => c.name)}
                  />
                ) : (
                  // Chapter editing
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
                )}
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
  onDeleteCharacter,
  onSelectCharacter
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
                onClick={() => onSelectCharacter?.(char)}
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
