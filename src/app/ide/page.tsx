/**
 * Project IDE Page
 * 
 * Full IDE experience for a specific project with real-time collaboration,
 * AI agents, and all IDE features.
 */

'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// IDE Components
import {
  IDEShell,
  PanelProvider,
  ThemeProvider,
  StoryExplorer,
  BottomPanel,
  EditorTabs,
  AgentProvider,
  CommandPalette,
  useKeyboardShortcuts,
  ProductionAgentProvider,
} from '@/components/IDE';
import { AIAgentsPanel } from '@/components/IDE/AIAgents/AIAgentsPanel';
import { AIWritingSurface } from '@/components/IDE/AIWritingSurface';

// Hooks
import { useIDEProject } from '@/hooks/useIDEProject';

// Types
import type { EditorTab } from '@/components/IDE/EditorTabs/types';
import type { WritingProblem, StoryMetrics } from '@/components/IDE/BottomPanel/types';
import type { StoryNode } from '@/components/IDE/StoryExplorer/types';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProjectIDEContentProps {
  projectId: string;
}

function ProjectIDEContent({ projectId }: ProjectIDEContentProps) {
  // Project integration
  const {
    state,
    isLoading,
    error,
    storyTree,
    setCurrentChapter,
    updateContent,
    saveContent,
    createChapter,
    deleteChapter,
    isSyncing,
  } = useIDEProject({ projectId });

  // Editor tabs state
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  
  // Content state
  const [editorContent, setEditorContent] = useState<string>('');
  
  // Problems state (from AI analysis)
  const [problems, setProblems] = useState<WritingProblem[]>([]);
  
  // Story metrics
  const [metrics, setMetrics] = useState<StoryMetrics>({
    wordCount: state.project?.word_count || 0,
    chapterCount: state.chapters.length,
    sceneCount: 0,
    characterMentions: {},
    pacing: {
      actionPercent: 0,
      dialoguePercent: 0,
      descriptionPercent: 0,
    },
    styleMetrics: {
      passiveVoicePercent: 0,
      averageSentenceLength: 0,
      adverbDensity: 0,
      dialogueTagVariety: 0,
    },
  });
  
  // Keyboard shortcuts
  useKeyboardShortcuts({ enabled: true });
  
  // Explorer selection handler
  const handleExplorerSelect = useCallback((node: StoryNode) => {
    if (!node) return;
    
    if (node.type === 'chapter') {
      setCurrentChapter(node.id);
      
      // Add or activate tab
      const existingTab = tabs.find(t => t.id === node.id);
      if (existingTab) {
        setActiveTabId(node.id);
      } else {
        const newTab: EditorTab = {
          id: node.id,
          label: node.label,
          type: 'chapter',
          isDirty: false,
          isPinned: false,
          isPreview: true,
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(node.id);
      }
    }
  }, [tabs, setCurrentChapter]);
  
  // Update editor content when chapter changes
  useEffect(() => {
    if (state.currentChapter) {
      setEditorContent(state.currentChapter.content || '');
    }
  }, [state.currentChapter]);
  
  // Handle content changes
  const handleContentChange = useCallback((html: string) => {
    setEditorContent(html);
    updateContent(html);
    
    // Update metrics
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text.split(/\s+/).filter(Boolean);
    
    setMetrics(prev => ({
      ...prev,
      wordCount: words.length,
      chapterCount: state.chapters.length,
    }));
    
    // Mark tab as dirty
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId ? { ...tab, isDirty: true } : tab
    ));
  }, [activeTabId, updateContent, state.chapters.length]);
  
  // Tab handlers
  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    const chapter = state.chapters.find(c => c.id === tabId);
    if (chapter) {
      setCurrentChapter(tabId);
    }
  }, [state.chapters, setCurrentChapter]);
  
  const handleTabClose = useCallback((tabId: string) => {
    setTabs(prev => prev.filter(t => t.id !== tabId));
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(t => t.id !== tabId);
      setActiveTabId(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].id : null);
    }
  }, [tabs, activeTabId]);
  
  const handleTabPin = useCallback((tabId: string) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, isPinned: !tab.isPinned, isPreview: false } : tab
    ));
  }, []);
  
  // Create new chapter
  const handleCreateNode = useCallback(async (type: string) => {
    if (type === 'chapter') {
      const title = `Chapter ${state.chapters.length + 1}`;
      const chapter = await createChapter(title);
      handleExplorerSelect({
        id: chapter.id,
        label: chapter.title,
        type: 'chapter',
        metadata: {},
      });
    }
  }, [state.chapters.length, createChapter, handleExplorerSelect]);
  
  // Delete chapter
  const handleDeleteNode = useCallback(async (nodeId: string) => {
    await deleteChapter(nodeId);
    handleTabClose(nodeId);
  }, [deleteChapter, handleTabClose]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-ide-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-ide-bg">
        <div className="text-center p-8 bg-destructive/10 rounded-lg border border-destructive/20">
          <h2 className="text-lg font-semibold text-destructive mb-2">Error Loading Project</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }
  
  // Extract trees for StoryExplorer
  const chaptersFolder = storyTree[0]?.children?.find(n => n.type === 'part');
  const charactersFolder = storyTree[0]?.children?.find(n => n.type === 'character-group');
  
  return (
    <ProductionAgentProvider>
      <AgentProvider>
        <IDEShell
          leftPanel={
            <StoryExplorer
              projectName={state.project?.title || 'Untitled Project'}
              manuscriptTree={chaptersFolder ? [chaptersFolder] : []}
              charactersTree={charactersFolder ? [charactersFolder] : []}
              isLoading={isLoading}
              onCreateNode={handleCreateNode}
              onSelectNode={handleExplorerSelect}
              onDeleteNode={handleDeleteNode}
              onRefresh={() => {}}
            />
          }
          rightPanel={<AIAgentsPanel />}
          bottomPanel={
            <BottomPanel
              problems={problems}
              storyMetrics={metrics}
              activeTasks={[]}
              taskHistory={[]}
            />
          }
          projectTitle={state.project?.title || 'Untitled Project'}
          problemCount={{ errors: problems.filter(p => p.severity === 'error').length, warnings: problems.filter(p => p.severity === 'warning').length }}
        >
          {/* Editor Tabs */}
          <EditorTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={handleTabSelect}
            onTabClose={handleTabClose}
            onTabPin={handleTabPin}
          />
          
          {/* Main Editor */}
          <div className="flex-1 overflow-hidden">
            {activeTabId && state.currentChapter ? (
              <AIWritingSurface
                key={activeTabId}
                content={editorContent}
                onContentChange={handleContentChange}
                placeholder="Start writing your story..."
                chapterTitle={state.currentChapter.title}
                enableGhostText={true}
                enableInlineAgents={true}
                className="h-full"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <svg className="w-16 h-16 mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">No chapter selected</p>
                <p className="text-sm mt-1">Select a chapter from the explorer or create a new one</p>
                <button
                  onClick={() => handleCreateNode('chapter')}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Create New Chapter
                </button>
              </div>
            )}
          </div>
        </IDEShell>
        
        {/* Command Palette */}
        <CommandPalette />
      </AgentProvider>
    </ProductionAgentProvider>
  );
}

function ProjectIDEPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');
  
  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-screen bg-ide-bg">
        <div className="text-center p-8">
          <h2 className="text-lg font-semibold mb-2">No Project Selected</h2>
          <p className="text-muted-foreground">Please select a project from your dashboard.</p>
        </div>
      </div>
    );
  }
  
  return <ProjectIDEContent projectId={projectId} />;
}

export default function ProjectIDEPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PanelProvider>
          <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-ide-bg">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <ProjectIDEPageContent />
          </Suspense>
        </PanelProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
