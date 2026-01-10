/**
 * Framework Wizard
 * 
 * A multi-step wizard that guides users through creating a comprehensive
 * story framework with AI assistance at each stage.
 * 
 * Features:
 * - Step-by-step guided framework building
 * - AI chat assistance at each step
 * - Import existing framework (paste JSON or text for AI parsing)
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  User,
  Users,
  MapPin,
  Swords,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  MessageSquare,
  Wand2,
  Plus,
  X,
  Save,
  ChevronDown,
  Lightbulb,
  Target,
  Heart,
  Zap,
  Upload,
  FileText,
} from 'lucide-react';
import { ModelSelector } from '../AICopilotPanel/ModelSelector';
import { AIModel, DEFAULT_MODEL } from '../AICopilotPanel/types';

// Wizard Steps
type WizardStep = 
  | 'welcome'
  | 'genre'
  | 'premise'
  | 'protagonist'
  | 'antagonist'
  | 'supporting'
  | 'world'
  | 'locations'
  | 'conflict'
  | 'themes'
  | 'review';

interface StepConfig {
  id: WizardStep;
  label: string;
  icon: React.ElementType;
  description: string;
}

const WIZARD_STEPS: StepConfig[] = [
  { id: 'welcome', label: 'Welcome', icon: BookOpen, description: 'Start your story journey' },
  { id: 'genre', label: 'Genre & Tone', icon: Sparkles, description: 'Define your genre and tone' },
  { id: 'premise', label: 'Premise', icon: Lightbulb, description: 'Your story\'s core concept' },
  { id: 'protagonist', label: 'Protagonist', icon: User, description: 'Your main character' },
  { id: 'antagonist', label: 'Antagonist', icon: Swords, description: 'The opposition' },
  { id: 'supporting', label: 'Supporting Cast', icon: Users, description: 'Key supporting characters' },
  { id: 'world', label: 'World', icon: MapPin, description: 'Your story\'s setting' },
  { id: 'locations', label: 'Key Locations', icon: MapPin, description: 'Important places' },
  { id: 'conflict', label: 'Conflict', icon: Target, description: 'Stakes and obstacles' },
  { id: 'themes', label: 'Themes', icon: Heart, description: 'Deeper meaning' },
  { id: 'review', label: 'Review', icon: Check, description: 'Finalize your framework' },
];

// Framework data structure
interface FrameworkData {
  genre: {
    primary: string;
    subgenres: string[];
    tone: string;
    targetAudience: string;
  };
  premise: {
    logline: string;
    hook: string;
    synopsis: string;
  };
  protagonist: {
    name: string;
    age?: string;
    occupation?: string;
    description: string;
    motivation: string;
    flaw: string;
    arc: string;
    traits: string[];
  };
  antagonist: {
    name: string;
    type: 'person' | 'organization' | 'nature' | 'society' | 'self' | 'technology';
    description: string;
    motivation: string;
    relationship: string;
  };
  supportingCharacters: Array<{
    id: string;
    name: string;
    role: string;
    relationship: string;
    description: string;
  }>;
  world: {
    timePeriod: string;
    settingType: string;
    technology: string;
    society: string;
    rules: string;
    atmosphere: string;
  };
  locations: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    significance: string;
  }>;
  conflict: {
    external: string;
    internal: string;
    stakes: string;
    obstacles: string[];
  };
  themes: {
    primary: string;
    secondary: string[];
    symbols: string[];
    questions: string[];
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: Array<{ label: string; value: string }>;
}

interface FrameworkWizardProps {
  projectId: string;
  projectTitle: string;
  existingFramework?: Partial<FrameworkData>;
  onSave: (framework: FrameworkData) => Promise<void>;
  onCreateCharacter?: (data: any) => Promise<any>;
  onCreateLocation?: (data: any) => Promise<any>;
  onCreateNote?: (data: any) => Promise<any>;
  onClose: () => void;
  className?: string;
}

const DEFAULT_FRAMEWORK: FrameworkData = {
  genre: { primary: '', subgenres: [], tone: '', targetAudience: '' },
  premise: { logline: '', hook: '', synopsis: '' },
  protagonist: { name: '', description: '', motivation: '', flaw: '', arc: '', traits: [] },
  antagonist: { name: '', type: 'person', description: '', motivation: '', relationship: '' },
  supportingCharacters: [],
  world: { timePeriod: '', settingType: '', technology: '', society: '', rules: '', atmosphere: '' },
  locations: [],
  conflict: { external: '', internal: '', stakes: '', obstacles: [] },
  themes: { primary: '', secondary: [], symbols: [], questions: [] },
};

// Helper: Clean JSON from message content for display
function cleanMessageContent(content: string): string {
  let cleaned = content;
  
  // Remove JSON code blocks
  cleaned = cleaned.replace(/```json[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/```framework[\s\S]*?```/g, '');
  
  // Framework-like JSON keys to detect and remove
  const frameworkKeys = [
    'story_setting', 'protagonist', 'antagonist', 'genre', 'premise', 
    'themes', 'conflict', 'world', 'locations', 'characters',
    'novel_title', 'trilogy_structure', 'core_engine', 'mythology',
    'book_1', 'book_2', 'book_3', 'key_components', 'rules',
    'supportingCharacter', 'location', 'greek_lens', 'christian_lens',
    'buddhist_lens', 'quantum_lens'
  ];
  const keyPattern = frameworkKeys.join('|');
  
  // Remove JSON objects containing framework keys (multiline)
  cleaned = cleaned.replace(new RegExp(`\\{\\s*"(?:${keyPattern})"[\\s\\S]*?\\n\\}`, 'g'), '');
  
  // Also catch incomplete JSON at end of message
  cleaned = cleaned.replace(new RegExp(`\\{\\s*"(?:${keyPattern})"[\\s\\S]*$`, 'g'), '');
  
  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  
  return cleaned || content;
}

export function FrameworkWizard({
  projectId,
  projectTitle,
  existingFramework,
  onSave,
  onCreateCharacter,
  onCreateLocation,
  onCreateNote,
  onClose,
  className
}: FrameworkWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [framework, setFramework] = useState<FrameworkData>({
    ...DEFAULT_FRAMEWORK,
    ...existingFramework
  });
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get current step index
  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);
  const currentStepConfig = WIZARD_STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100;

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize step with welcome message
  useEffect(() => {
    const welcomeMessage = getStepWelcomeMessage(currentStep, framework);
    setMessages([{
      id: `welcome-${currentStep}`,
      role: 'assistant',
      content: welcomeMessage.content,
      suggestions: welcomeMessage.suggestions
    }]);
  }, [currentStep]);

  // Navigate steps
  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
    setInput('');
  }, []);

  const nextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < WIZARD_STEPS.length) {
      goToStep(WIZARD_STEPS[nextIndex].id);
    }
  }, [currentStepIndex, goToStep]);

  const prevStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      goToStep(WIZARD_STEPS[prevIndex].id);
    }
  }, [currentStepIndex, goToStep]);

  // Send message to AI
  const sendMessage = useCallback(async (messageContent?: string) => {
    const content = messageContent || input.trim();
    if (!content || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/framework/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: currentStep,
          prompt: content,
          framework,
          projectTitle,
          model: selectedModel.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      // Update framework with any extracted data
      if (data.frameworkUpdate) {
        setFramework(prev => deepMerge(prev, data.frameworkUpdate));
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        suggestions: data.suggestions
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Framework wizard error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.';
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, currentStep, framework, projectTitle, selectedModel]);

  // Quick suggestion click
  const handleSuggestionClick = useCallback((value: string) => {
    sendMessage(value);
  }, [sendMessage]);

  // AI Generate for current step
  const generateWithAI = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/framework/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: currentStep,
          prompt: `Generate creative suggestions for my ${currentStep} based on what we've discussed so far.`,
          framework,
          projectTitle,
          model: selectedModel.id,
          generateMode: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate');
      }

      const data = await response.json();

      if (data.frameworkUpdate) {
        setFramework(prev => deepMerge(prev, data.frameworkUpdate));
      }

      setMessages(prev => [...prev, {
        id: `ai-generate-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        suggestions: data.suggestions
      }]);

    } catch (error) {
      console.error('AI generation error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentStep, framework, projectTitle, selectedModel]);

  // Import existing framework
  const handleImport = useCallback(async () => {
    if (!importText.trim()) {
      setImportError('Please paste your framework content');
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const response = await fetch('/api/ai/framework/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: importText,
          projectTitle,
          model: selectedModel.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import framework');
      }

      const data = await response.json();

      if (data.framework) {
        // Merge imported framework with existing
        setFramework(prev => deepMerge(prev, data.framework));
        
        // Add success message to chat
        setMessages(prev => [...prev, {
          id: `import-${Date.now()}`,
          role: 'assistant',
          content: `✅ **Framework Imported Successfully!**\n\n${data.summary}\n\nYou can now review and refine each section using the wizard steps.`,
          suggestions: [
            { label: 'Review Genre', value: "Let's review the genre and tone" },
            { label: 'Review Characters', value: "Let's review the characters" },
            { label: 'Go to Review', value: "Take me to the final review" }
          ]
        }]);

        // Close import modal
        setShowImportModal(false);
        setImportText('');
        
        // Jump to review step to see what was imported
        setCurrentStep('review');
      }

    } catch (error) {
      console.error('Import error:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to import framework');
    } finally {
      setIsImporting(false);
    }
  }, [importText, projectTitle, selectedModel]);

  // Save framework
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(framework);
      
      // Also create individual items if handlers provided
      if (onCreateCharacter) {
        // Create protagonist
        if (framework.protagonist.name) {
          await onCreateCharacter({
            name: framework.protagonist.name,
            role: 'protagonist',
            description: framework.protagonist.description,
            traits: framework.protagonist.traits,
            notes: `Motivation: ${framework.protagonist.motivation}\nFlaw: ${framework.protagonist.flaw}\nArc: ${framework.protagonist.arc}`
          }).catch(err => console.error('Failed to create protagonist:', err));
        }
        // Create antagonist
        if (framework.antagonist.name) {
          await onCreateCharacter({
            name: framework.antagonist.name,
            role: 'antagonist',
            description: framework.antagonist.description,
            notes: `Type: ${framework.antagonist.type}\nMotivation: ${framework.antagonist.motivation}\nRelationship: ${framework.antagonist.relationship}`
          }).catch(err => console.error('Failed to create antagonist:', err));
        }
        // Create supporting characters
        for (const char of framework.supportingCharacters) {
          // Sanitize role for DB (protagonist, antagonist, supporting, minor, narrator)
          const validRoles = ['protagonist', 'antagonist', 'supporting', 'minor', 'narrator'];
          const sanitizedRole = validRoles.includes(char.role?.toLowerCase()) 
            ? char.role.toLowerCase() 
            : 'supporting';

          await onCreateCharacter({
            name: char.name,
            role: sanitizedRole,
            description: char.description,
            notes: `Relationship: ${char.relationship}`
          }).catch(err => console.error(`Failed to create supporting character ${char.name}:`, err));
        }
      }

      // Create locations
      if (onCreateLocation) {
        for (const loc of framework.locations) {
          // Sanitize type (city, town, village, building, room, landscape, region, country, world, other)
          const validTypes = ['city', 'town', 'village', 'building', 'room', 'landscape', 'region', 'country', 'world', 'other'];
          const sanitizedType = validTypes.includes(loc.type?.toLowerCase()) 
            ? loc.type.toLowerCase() 
            : 'other';

          await onCreateLocation({
            name: loc.name,
            type: sanitizedType,
            description: `${loc.description}\n\nSignificance: ${loc.significance}`
          }).catch(err => console.error(`Failed to create location ${loc.name}:`, err));
        }
      }

      // Create notes for themes and world-building
      if (onCreateNote) {
        const notesToCreate = [
          {
            title: 'Story Premise',
            category: 'plot',
            content: `Logline: ${framework.premise.logline}\n\nHook: ${framework.premise.hook}\n\nSynopsis: ${framework.premise.synopsis}`
          },
          {
            title: 'World Building',
            category: 'worldbuilding',
            content: `Time Period: ${framework.world.timePeriod}\nSetting: ${framework.world.settingType}\nTechnology: ${framework.world.technology}\nSociety: ${framework.world.society}\nRules: ${framework.world.rules}\nAtmosphere: ${framework.world.atmosphere}`
          },
          {
            title: 'Themes & Conflict',
            category: 'theme',
            content: `Primary Theme: ${framework.themes.primary}\nSecondary Themes: ${framework.themes.secondary.join(', ')}\n\nExternal Conflict: ${framework.conflict.external}\nInternal Conflict: ${framework.conflict.internal}\nStakes: ${framework.conflict.stakes}`
          }
        ];

        for (const note of notesToCreate) {
          await onCreateNote(note as any).catch(err => console.error(`Failed to create note ${note.title}:`, err));
        }
      }

      onClose();
    } catch (error) {
      console.error('Failed to save framework:', error);
      setSaveError(error instanceof Error ? error.message : 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  }, [framework, onSave, onCreateCharacter, onCreateLocation, onCreateNote, onClose]);

  // Handle keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm",
      className
    )}>
      <div className="w-[95vw] max-w-7xl h-[90vh] bg-[--ide-sidebar-bg] rounded-xl border border-[--ide-border] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[--ide-border] bg-[--ide-titlebar-bg]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[--ide-accent] flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[--ide-foreground]">Story Framework Wizard</h2>
              <p className="text-xs text-[--ide-foreground-secondary]">{projectTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Import Button */}
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[--ide-input-bg] hover:bg-[--ide-list-hover] text-[--ide-foreground-secondary] rounded-lg text-xs font-medium transition-colors border border-[--ide-border]"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Framework
            </button>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
            <button
              onClick={onClose}
              className="p-2 hover:bg-[--ide-list-hover] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[--ide-foreground-secondary]" />
            </button>
          </div>
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
            <div className="w-[600px] max-h-[80vh] bg-[--ide-sidebar-bg] rounded-xl border border-[--ide-border] shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[--ide-border]">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[--ide-accent]" />
                  <h3 className="font-semibold text-[--ide-foreground]">Import Existing Framework</h3>
                </div>
                <button
                  onClick={() => { setShowImportModal(false); setImportError(null); }}
                  className="p-1 hover:bg-[--ide-list-hover] rounded"
                >
                  <X className="w-4 h-4 text-[--ide-foreground-secondary]" />
                </button>
              </div>
              
              <div className="p-4 flex-1 overflow-auto">
                <p className="text-sm text-[--ide-foreground-secondary] mb-3">
                  Paste your existing framework below. This can be:
                </p>
                <ul className="text-xs text-[--ide-foreground-muted] mb-4 space-y-1 ml-4">
                  <li>• JSON from a previous export</li>
                  <li>• Plain text description of your story</li>
                  <li>• Notes about characters, world, plot</li>
                  <li>• Any structured or unstructured framework data</li>
                </ul>
                
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste your framework JSON or text description here..."
                  className="w-full h-64 bg-[--ide-input-bg] border border-[--ide-border] rounded-lg px-3 py-2 text-sm text-[--ide-foreground] placeholder-[--ide-foreground-muted] resize-none focus:outline-none focus:ring-2 focus:ring-[--ide-accent] font-mono"
                />
                
                {importError && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                    {importError}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[--ide-border]">
                <button
                  onClick={() => { setShowImportModal(false); setImportError(null); }}
                  className="px-4 py-2 text-sm text-[--ide-foreground-secondary] hover:bg-[--ide-list-hover] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={isImporting || !importText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-[--ide-accent] hover:opacity-90 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Import & Parse
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="px-6 py-2 bg-[--ide-editor-bg]/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[--ide-foreground-secondary]">{currentStepConfig.label}</span>
            <span className="text-xs text-[--ide-foreground-muted]">{currentStepIndex + 1} of {WIZARD_STEPS.length}</span>
          </div>
          <div className="h-1.5 bg-[--ide-border] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[--ide-accent] to-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Step Navigation */}
          <div className="w-56 border-r border-[--ide-border] bg-[--ide-sidebar-bg] overflow-y-auto">
            <div className="p-2 space-y-1">
              {WIZARD_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = index < currentStepIndex;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(step.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors",
                      isActive 
                        ? "bg-[--ide-accent]/20 text-[--ide-accent] border border-[--ide-accent]/30"
                        : isCompleted
                          ? "text-green-400 hover:bg-[--ide-list-hover]"
                          : "text-[--ide-foreground-muted] hover:bg-[--ide-list-hover] hover:text-[--ide-foreground]"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <Icon className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="text-xs font-medium truncate">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-[--ide-editor-bg]">
            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-[--ide-accent] flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[75%] rounded-xl px-4 py-3",
                    message.role === 'user'
                      ? "bg-[--ide-accent] text-white"
                      : "bg-[--ide-sidebar-bg] text-[--ide-foreground] border border-[--ide-border]"
                  )}>
                    <p className="text-sm whitespace-pre-wrap">
                      {message.role === 'user' ? message.content : cleanMessageContent(message.content)}
                    </p>
                    
                    {/* Quick Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion.value)}
                            className="px-3 py-1.5 bg-[--ide-input-bg] hover:bg-[--ide-list-hover] text-[--ide-foreground-secondary] text-xs rounded-full border border-[--ide-border] transition-colors"
                          >
                            {suggestion.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-[--ide-accent] flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[--ide-accent] flex items-center justify-center flex-shrink-0">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="bg-[--ide-sidebar-bg] rounded-xl px-4 py-3 border border-[--ide-border]">
                    <p className="text-sm text-[--ide-foreground-secondary]">Thinking...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-[--ide-border] p-4 bg-[--ide-sidebar-bg]">
              <div className="flex items-end gap-3">
                <button
                  onClick={generateWithAI}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[--ide-accent] hover:opacity-90 disabled:bg-[--ide-input-bg] disabled:text-[--ide-foreground-muted] text-white rounded-lg text-sm font-medium transition-colors"
                  title="Generate AI suggestions"
                >
                  <Zap className="w-4 h-4" />
                  Generate
                </button>
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your ideas or ask for suggestions..."
                    className="w-full bg-[--ide-input-bg] border border-[--ide-border] rounded-xl px-4 py-3 text-sm text-[--ide-foreground] placeholder-[--ide-foreground-muted] resize-none focus:outline-none focus:ring-2 focus:ring-[--ide-accent] focus:border-transparent"
                    rows={2}
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-[--ide-input-bg] disabled:text-[--ide-foreground-muted] text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Framework Preview */}
          <div className="w-80 border-l border-[--ide-border] bg-[--ide-sidebar-bg] overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[--ide-foreground] mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[--ide-accent]" />
                Framework Preview
              </h3>
              <FrameworkPreview framework={framework} currentStep={currentStep} />
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col border-t border-[--ide-border] bg-[--ide-titlebar-bg]">
          {saveError && (
            <div className="px-6 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-xs text-red-400 font-medium">Save Error: {saveError}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[--ide-input-bg] hover:bg-[--ide-list-hover] disabled:opacity-50 disabled:cursor-not-allowed text-[--ide-foreground] rounded-lg text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            
            <div className="flex items-center gap-3">
              {currentStep === 'review' ? (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Framework
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-2 bg-[--ide-accent] hover:opacity-90 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Framework Preview Component
function FrameworkPreview({ 
  framework, 
  currentStep 
}: { 
  framework: FrameworkData; 
  currentStep: WizardStep;
}) {
  const sections = [
    {
      id: 'genre',
      label: 'Genre',
      content: framework.genre.primary ? `${framework.genre.primary}${framework.genre.tone ? ` • ${framework.genre.tone}` : ''}` : null
    },
    {
      id: 'premise',
      label: 'Premise',
      content: framework.premise.logline || null
    },
    {
      id: 'protagonist',
      label: 'Protagonist',
      content: framework.protagonist.name ? `${framework.protagonist.name}${framework.protagonist.motivation ? ` - ${framework.protagonist.motivation}` : ''}` : null
    },
    {
      id: 'antagonist',
      label: 'Antagonist',
      content: framework.antagonist.name || null
    },
    {
      id: 'supporting',
      label: 'Supporting',
      content: framework.supportingCharacters.length > 0 ? `${framework.supportingCharacters.length} character(s)` : null
    },
    {
      id: 'world',
      label: 'World',
      content: framework.world.settingType || framework.world.timePeriod || null
    },
    {
      id: 'locations',
      label: 'Locations',
      content: framework.locations.length > 0 ? `${framework.locations.length} location(s)` : null
    },
    {
      id: 'conflict',
      label: 'Conflict',
      content: framework.conflict.external || null
    },
    {
      id: 'themes',
      label: 'Themes',
      content: framework.themes.primary || null
    },
  ];

  return (
    <div className="space-y-2">
      {sections.map((section) => {
        const isActive = section.id === currentStep || 
          (section.id === 'supporting' && currentStep === 'supporting') ||
          (section.id === 'locations' && currentStep === 'locations');
        
        return (
          <div
            key={section.id}
            className={cn(
              "p-2 rounded-lg border transition-colors",
              isActive
                ? "bg-[--ide-accent]/10 border-[--ide-accent]/30"
                : section.content
                  ? "bg-green-600/10 border-green-500/30"
                  : "bg-[--ide-input-bg] border-[--ide-border]"
            )}
          >
            <div className="text-xs font-medium text-[--ide-foreground-secondary] mb-0.5">{section.label}</div>
            <div className={cn(
              "text-xs truncate",
              section.content ? "text-[--ide-foreground]" : "text-[--ide-foreground-muted] italic"
            )}>
              {section.content || 'Not defined'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper: Get step welcome message
function getStepWelcomeMessage(step: WizardStep, framework: FrameworkData): { content: string; suggestions?: Array<{ label: string; value: string }> } {
  const messages: Record<WizardStep, { content: string; suggestions?: Array<{ label: string; value: string }> }> = {
    welcome: {
      content: `Welcome to the Story Framework Wizard! 🎭

I'm here to help you build a comprehensive framework for your novel. We'll work through several key areas:

• **Genre & Tone** - Define your story's genre and mood
• **Premise** - Craft your core concept and hook
• **Characters** - Develop your protagonist, antagonist, and supporting cast
• **World Building** - Create your setting and key locations
• **Conflict & Themes** - Define stakes and deeper meaning

Let's start by exploring what kind of story you want to tell. Click "Next" when you're ready, or ask me any questions!`,
      suggestions: [
        { label: "I have a general idea", value: "I have a general concept for my story but need help developing it" },
        { label: "Starting from scratch", value: "I'm starting from scratch and need inspiration" },
        { label: "Adapting existing work", value: "I'm adapting an existing idea or concept" }
      ]
    },
    genre: {
      content: `Let's define your story's **genre and tone**.

What genre are you writing in? This helps set reader expectations and guides many creative decisions.

Common genres include:
• Fantasy, Science Fiction, Horror
• Mystery, Thriller, Romance
• Literary Fiction, Historical Fiction
• Young Adult, Middle Grade

What's the overall tone? (Dark, humorous, epic, intimate, etc.)`,
      suggestions: [
        { label: "Fantasy", value: "I'm writing fantasy" },
        { label: "Science Fiction", value: "I'm writing science fiction" },
        { label: "Mystery/Thriller", value: "I'm writing a mystery or thriller" },
        { label: "Romance", value: "I'm writing romance" },
        { label: "Literary Fiction", value: "I'm writing literary fiction" }
      ]
    },
    premise: {
      content: `Now let's craft your **story premise**.

A strong premise has:
• A clear protagonist with a goal
• An obstacle or conflict
• Stakes (what happens if they fail?)

Try to describe your story in one or two sentences. What's the hook that makes it unique?

${framework.genre.primary ? `Since you're writing ${framework.genre.primary}, think about what fresh angle you're bringing to the genre.` : ''}`,
      suggestions: [
        { label: "Help me brainstorm", value: "Help me brainstorm premise ideas" },
        { label: "Refine my idea", value: "I have a rough idea, help me refine it into a strong premise" }
      ]
    },
    protagonist: {
      content: `Let's develop your **protagonist** - the heart of your story.

Tell me about your main character:
• Name and basic details
• What do they want? (external goal)
• What do they need? (internal need)
• What's their fatal flaw or wound?
• How will they change?

${framework.premise.logline ? `Based on your premise: "${framework.premise.logline}"` : ''}`,
      suggestions: [
        { label: "Generate character ideas", value: "Generate some protagonist ideas for my story" },
        { label: "I have a character", value: "I have a character in mind, let me describe them" }
      ]
    },
    antagonist: {
      content: `Every great protagonist needs a worthy **antagonist**.

Your antagonist can be:
• A person (villain, rival, authority figure)
• An organization (corporation, government, cult)
• Nature (disaster, environment, survival)
• Society (prejudice, expectations, systems)
• Self (internal demons, addiction, fear)
• Technology (AI, machines, progress)

What opposes your protagonist? Remember: the best antagonists believe they're right.

${framework.protagonist.name ? `What threatens ${framework.protagonist.name}'s goals?` : ''}`,
      suggestions: [
        { label: "Human antagonist", value: "I want a human antagonist" },
        { label: "Organization/System", value: "The antagonist is an organization or system" },
        { label: "Internal conflict", value: "The main conflict is internal - person vs self" },
        { label: "Help me decide", value: "Help me decide what kind of antagonist fits my story" }
      ]
    },
    supporting: {
      content: `Now let's build your **supporting cast**.

Key supporting character roles:
• **Mentor** - guides the protagonist
• **Ally/Sidekick** - loyal friend
• **Love Interest** - romantic connection
• **Foil** - contrasts with protagonist
• **Trickster** - comic relief, chaos agent

Who surrounds your protagonist? Each character should serve the story.

${framework.supportingCharacters.length > 0 ? `You've already added: ${framework.supportingCharacters.map(c => c.name).join(', ')}` : ''}`,
      suggestions: [
        { label: "Add a mentor", value: "Help me create a mentor character" },
        { label: "Add an ally", value: "Help me create an ally or sidekick" },
        { label: "Add love interest", value: "Help me create a love interest" },
        { label: "Suggest characters", value: "Suggest supporting characters for my story" }
      ]
    },
    world: {
      content: `Let's build your **story world**.

Consider:
• **Time Period** - When does your story take place?
• **Setting Type** - Urban, rural, fantastical, etc.
• **Technology Level** - What tech exists?
• **Society** - How is society structured?
• **Rules** - Any special rules (magic systems, etc.)?
• **Atmosphere** - What's the overall feel?

${framework.genre.primary ? `For ${framework.genre.primary}, think about what makes your world unique.` : ''}`,
      suggestions: [
        { label: "Contemporary", value: "My story is set in the contemporary real world" },
        { label: "Historical", value: "My story is set in a historical period" },
        { label: "Secondary world", value: "My story is set in a completely fictional world" },
        { label: "Near future", value: "My story is set in the near future" }
      ]
    },
    locations: {
      content: `Now let's define **key locations** in your story.

Important locations often include:
• **Home Base** - Where the protagonist starts
• **Destination** - Where they're headed
• **Threshold** - Point of no return
• **Ordeal Location** - Where major challenges occur
• **Sacred Space** - Place of reflection/growth

What places are significant to your story?

${framework.locations.length > 0 ? `Locations so far: ${framework.locations.map(l => l.name).join(', ')}` : ''}`,
      suggestions: [
        { label: "Add starting location", value: "Help me create the protagonist's starting location" },
        { label: "Add key destination", value: "Help me create a key destination" },
        { label: "Generate locations", value: "Generate important locations for my story" }
      ]
    },
    conflict: {
      content: `Let's define your story's **central conflict**.

Every story needs:
• **External Conflict** - What must be overcome?
• **Internal Conflict** - What inner struggle?
• **Stakes** - What happens if they fail?
• **Obstacles** - What stands in the way?

${framework.protagonist.name && framework.antagonist.name ? `How does ${framework.protagonist.name}'s conflict with ${framework.antagonist.name} manifest?` : ''}`,
      suggestions: [
        { label: "Define external conflict", value: "Help me define the external conflict" },
        { label: "Define internal conflict", value: "Help me define the internal conflict" },
        { label: "Raise the stakes", value: "Help me raise the stakes in my story" }
      ]
    },
    themes: {
      content: `Finally, let's explore your story's **themes**.

Themes give your story depth and resonance:
• **Primary Theme** - The main question/idea explored
• **Secondary Themes** - Supporting ideas
• **Symbols** - Objects/images that represent themes
• **Questions** - What questions does your story ask?

Great themes are explored, not preached. What deeper meaning do you want readers to take away?`,
      suggestions: [
        { label: "Love & relationships", value: "My story explores themes of love and relationships" },
        { label: "Identity & self", value: "My story explores themes of identity and self-discovery" },
        { label: "Power & corruption", value: "My story explores themes of power and corruption" },
        { label: "Help me identify", value: "Help me identify themes in my story" }
      ]
    },
    review: {
      content: `🎉 **Framework Complete!**

Here's a summary of your story framework. Review each section and make any final adjustments.

**Genre:** ${framework.genre.primary || 'Not defined'}
**Premise:** ${framework.premise.logline || 'Not defined'}
**Protagonist:** ${framework.protagonist.name || 'Not defined'}
**Antagonist:** ${framework.antagonist.name || 'Not defined'}
**World:** ${framework.world.settingType || framework.world.timePeriod || 'Not defined'}
**Primary Theme:** ${framework.themes.primary || 'Not defined'}

When you're satisfied, click "Save Framework" to save everything to your project. This will create characters, locations, and notes in your story framework.`,
      suggestions: [
        { label: "Looks good!", value: "Everything looks good, I'm ready to save" },
        { label: "Review again", value: "Let me review the details again" },
        { label: "Make changes", value: "I want to make some changes before saving" }
      ]
    }
  };

  return messages[step];
}

// Helper: Deep merge objects
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' && 
        source[key] !== null && 
        !Array.isArray(source[key]) &&
        typeof result[key] === 'object' &&
        result[key] !== null
      ) {
        result[key] = deepMerge(result[key], source[key] as any);
      } else {
        result[key] = source[key] as T[Extract<keyof T, string>];
      }
    }
  }
  
  return result;
}
