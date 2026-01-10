'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  Loader2,
  Check,
  Edit2,
  BookOpen
} from 'lucide-react';
import { ModelSelector } from '../AICopilotPanel/ModelSelector';
import { AIModel, DEFAULT_MODEL, ChapterOutline, SceneBeat } from '../AICopilotPanel/types';

/**
 * OutlineBuilder - Chapter outline creation with scene beats
 * 
 * Features:
 * - Create chapter outlines
 * - AI-generated scene beats
 * - Drag-and-drop reordering
 * - Track writing progress per beat
 */

interface OutlineBuilderProps {
  projectId: string;
  framework?: {
    premise?: string;
    genre?: string;
    tone?: string;
  };
  characters?: Array<{ id: string; name: string; role?: string; description?: string }>;
  locations?: Array<{ id: string; name: string; description?: string }>;
  outlines?: ChapterOutline[];
  onSaveOutline?: (outline: ChapterOutline) => Promise<void>;
  onDeleteOutline?: (outlineId: string) => Promise<void>;
  className?: string;
}

export function OutlineBuilder({
  projectId,
  framework,
  characters = [],
  locations = [],
  outlines = [],
  onSaveOutline,
  onDeleteOutline,
  className
}: OutlineBuilderProps) {
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [editingOutline, setEditingOutline] = useState<ChapterOutline | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingChapter, setGeneratingChapter] = useState<number | null>(null);

  const toggleChapter = useCallback((outlineId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(outlineId)) {
        next.delete(outlineId);
      } else {
        next.add(outlineId);
      }
      return next;
    });
  }, []);

  const handleGenerateOutline = useCallback(async (chapterNumber: number) => {
    setIsGenerating(true);
    setGeneratingChapter(chapterNumber);

    try {
      const response = await fetch('/api/ai/outline/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framework,
          characters,
          locations,
          existingOutlines: outlines,
          chapterNumber,
          totalChapters: Math.max(outlines.length + 1, 10),
          model: selectedModel.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate outline');
      }

      const data = await response.json();
      
      if (data.outline) {
        const newOutline: ChapterOutline = {
          id: `outline-${Date.now()}`,
          summary: data.outline.summary,
          beats: data.outline.beats || [],
          sequenceOrder: chapterNumber,
          targetWordCount: data.outline.target_word_count || 3000,
          status: 'outlined'
        };
        
        await onSaveOutline?.(newOutline);
        setExpandedChapters(prev => new Set([...prev, newOutline.id]));
      }
    } catch (error) {
      console.error('Failed to generate outline:', error);
    } finally {
      setIsGenerating(false);
      setGeneratingChapter(null);
    }
  }, [framework, characters, locations, outlines, selectedModel, onSaveOutline]);

  const handleUpdateBeatStatus = useCallback(async (
    outlineId: string, 
    beatId: string, 
    status: SceneBeat['status']
  ) => {
    const outline = outlines.find(o => o.id === outlineId);
    if (!outline) return;

    const updatedOutline: ChapterOutline = {
      ...outline,
      beats: outline.beats.map(beat => 
        beat.id === beatId ? { ...beat, status } : beat
      )
    };

    await onSaveOutline?.(updatedOutline);
  }, [outlines, onSaveOutline]);

  const getStatusColor = (status: SceneBeat['status']) => {
    switch (status) {
      case 'planned': return 'bg-neutral-600';
      case 'writing': return 'bg-yellow-600';
      case 'complete': return 'bg-green-600';
      default: return 'bg-neutral-600';
    }
  };

  const calculateProgress = (outline: ChapterOutline) => {
    if (outline.beats.length === 0) return 0;
    const completed = outline.beats.filter(b => b.status === 'complete').length;
    return Math.round((completed / outline.beats.length) * 100);
  };

  return (
    <div className={cn("flex flex-col h-full bg-neutral-900", className)}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-neutral-700 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Chapter Outlines</h2>
          </div>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
        <button
          onClick={() => handleGenerateOutline(outlines.length + 1)}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isGenerating && generatingChapter === outlines.length + 1 ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Chapter {outlines.length + 1}...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Chapter {outlines.length + 1} Outline
            </>
          )}
        </button>
      </div>

      {/* Outlines List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {outlines.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No chapter outlines yet.</p>
            <p className="text-xs mt-1">Click the button above to generate your first chapter outline.</p>
          </div>
        ) : (
          outlines.map((outline, index) => {
            const isExpanded = expandedChapters.has(outline.id);
            const progress = calculateProgress(outline);

            return (
              <div
                key={outline.id}
                className="bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden"
              >
                {/* Chapter Header */}
                <div
                  className="flex items-center gap-2 p-3 cursor-pointer hover:bg-neutral-700/50"
                  onClick={() => toggleChapter(outline.id)}
                >
                  <GripVertical className="w-4 h-4 text-neutral-500" />
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        Chapter {index + 1}
                      </span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-xs",
                        outline.status === 'complete' ? 'bg-green-900/50 text-green-400' :
                        outline.status === 'writing' ? 'bg-yellow-900/50 text-yellow-400' :
                        'bg-neutral-700 text-neutral-400'
                      )}>
                        {outline.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {outline.summary || 'No summary'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-400 w-8">{progress}%</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingOutline(outline);
                      }}
                      className="p-1 hover:bg-neutral-600 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteOutline?.(outline.id);
                      }}
                      className="p-1 hover:bg-red-900/50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Scene Beats */}
                {isExpanded && (
                  <div className="border-t border-neutral-700 p-3 space-y-2">
                    {outline.beats.length === 0 ? (
                      <p className="text-xs text-neutral-500 text-center py-2">
                        No scene beats defined
                      </p>
                    ) : (
                      outline.beats.map((beat, beatIndex) => (
                        <div
                          key={beat.id}
                          className="flex items-start gap-2 p-2 bg-neutral-900 rounded border border-neutral-700"
                        >
                          <button
                            onClick={() => {
                              const nextStatus: SceneBeat['status'] = 
                                beat.status === 'planned' ? 'writing' :
                                beat.status === 'writing' ? 'complete' : 'planned';
                              handleUpdateBeatStatus(outline.id, beat.id, nextStatus);
                            }}
                            className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                              getStatusColor(beat.status)
                            )}
                          >
                            {beat.status === 'complete' && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-neutral-500">#{beatIndex + 1}</span>
                              <span className="text-sm font-medium text-white">{beat.title}</span>
                              {beat.wordTarget && (
                                <span className="text-xs text-neutral-500">~{beat.wordTarget} words</span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-400 mt-1">{beat.description}</p>
                            {beat.characters && beat.characters.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                {beat.characters.map((char: string, i: number) => (
                                  <span key={i} className="text-xs bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded">
                                    {char}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    
                    {/* Add Beat Button */}
                    <button
                      className="w-full flex items-center justify-center gap-1 py-2 border border-dashed border-neutral-600 rounded hover:border-neutral-500 text-neutral-500 hover:text-neutral-400 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="text-xs">Add Beat</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default OutlineBuilder;
