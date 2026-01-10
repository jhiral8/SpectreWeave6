/**
 * Framework Editor
 * 
 * A tabbed editor view for editing the story framework.
 * Works like the manuscript editor but for framework data.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  User,
  Users,
  MapPin,
  Swords,
  Sparkles,
  Save,
  Loader2,
  Plus,
  Trash2,
  ChevronRight,
  Target,
  Heart,
  Globe,
  Lightbulb,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

// Framework data structure matching the wizard
export interface FrameworkData {
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

const DEFAULT_FRAMEWORK: FrameworkData = {
  genre: { primary: '', subgenres: [], tone: '', targetAudience: '' },
  premise: { logline: '', hook: '', synopsis: '' },
  protagonist: { name: '', description: '', motivation: '', flaw: '', arc: '', traits: [] },
  antagonist: { name: '', type: 'person', description: '', motivation: '', relationship: '' },
  supportingCharacters: [],
  world: { timePeriod: '', settingType: '', technology: '', society: '', rules: '', atmosphere: '' },
  locations: [],
  conflict: { external: '', internal: '', stakes: '', obstacles: [] },
  themes: { primary: '', secondary: [], symbols: [], questions: [] }
};

type FrameworkSection = 
  | 'genre' 
  | 'premise' 
  | 'protagonist' 
  | 'antagonist' 
  | 'supporting' 
  | 'world' 
  | 'locations' 
  | 'conflict' 
  | 'themes';

interface SectionConfig {
  id: FrameworkSection;
  label: string;
  icon: React.ElementType;
  description: string;
}

const SECTIONS: SectionConfig[] = [
  { id: 'genre', label: 'Genre & Tone', icon: Sparkles, description: 'Define your story\'s genre' },
  { id: 'premise', label: 'Premise', icon: Lightbulb, description: 'Core story concept' },
  { id: 'protagonist', label: 'Protagonist', icon: User, description: 'Main character' },
  { id: 'antagonist', label: 'Antagonist', icon: Swords, description: 'Opposition force' },
  { id: 'supporting', label: 'Supporting Cast', icon: Users, description: 'Key characters' },
  { id: 'world', label: 'World Building', icon: Globe, description: 'Story setting' },
  { id: 'locations', label: 'Locations', icon: MapPin, description: 'Key places' },
  { id: 'conflict', label: 'Conflict', icon: Target, description: 'Stakes & obstacles' },
  { id: 'themes', label: 'Themes', icon: Heart, description: 'Deeper meaning' },
];

interface FrameworkEditorProps {
  projectId: string;
  initialData?: FrameworkData;
  onSave: (data: FrameworkData) => Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
  // Database callbacks for syncing with actual tables
  onCreateCharacter?: (data: { name: string; role: string; description?: string; traits?: string[]; notes?: string }) => Promise<any>;
  onUpdateCharacter?: (id: string, data: Partial<{ name: string; role: string; description?: string; traits?: string[]; notes?: string }>) => Promise<void>;
  onDeleteCharacter?: (id: string) => Promise<void>;
  onCreateLocation?: (data: { name: string; type: string; description?: string }) => Promise<any>;
  onUpdateLocation?: (id: string, data: Partial<{ name: string; type: string; description?: string }>) => Promise<void>;
  onDeleteLocation?: (id: string) => Promise<void>;
  onCreateNote?: (data: { title: string; content: string; category: string; tags?: string[] }) => Promise<any>;
  onUpdateNote?: (id: string, data: Partial<{ title: string; content: string; category: string; tags?: string[] }>) => Promise<void>;
  // Existing data from database
  characters?: Array<{ id: string; name: string; role: string; description?: string; traits?: string[]; notes?: string }>;
  locations?: Array<{ id: string; name: string; type: string; description?: string }>;
  notes?: Array<{ id: string; title: string; content: string; category: string; tags?: string[] }>;
  className?: string;
}

export function FrameworkEditor({
  projectId,
  initialData,
  onSave,
  onDirtyChange,
  onCreateCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onCreateLocation,
  onUpdateLocation,
  onDeleteLocation,
  onCreateNote,
  onUpdateNote,
  characters: existingCharacters,
  locations: existingLocations,
  notes: existingNotes,
  className
}: FrameworkEditorProps) {
  const [framework, setFramework] = useState<FrameworkData>(initialData || DEFAULT_FRAMEWORK);
  const [activeSection, setActiveSection] = useState<FrameworkSection>('genre');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Populate framework from existing database records if no initialData
  useEffect(() => {
    if (initialData) return; // Already have framework data
    
    // Build framework from existing characters, locations, and notes
    const buildFromExisting = () => {
      const built: Partial<FrameworkData> = {};
      
      // Extract protagonist
      const protagonist = existingCharacters?.find(c => c.role === 'protagonist');
      if (protagonist) {
        const notesLines = (protagonist.notes || '').split('\n');
        const motivation = notesLines.find(l => l.startsWith('Motivation:'))?.replace('Motivation:', '').trim() || '';
        const flaw = notesLines.find(l => l.startsWith('Flaw:'))?.replace('Flaw:', '').trim() || '';
        const arc = notesLines.find(l => l.startsWith('Arc:'))?.replace('Arc:', '').trim() || '';
        
        built.protagonist = {
          name: protagonist.name,
          description: protagonist.description || '',
          motivation,
          flaw,
          arc,
          traits: protagonist.traits || []
        };
      }
      
      // Extract antagonist
      const antagonist = existingCharacters?.find(c => c.role === 'antagonist');
      if (antagonist) {
        const notesLines = (antagonist.notes || '').split('\n');
        const type = notesLines.find(l => l.startsWith('Type:'))?.replace('Type:', '').trim() || 'person';
        const motivation = notesLines.find(l => l.startsWith('Motivation:'))?.replace('Motivation:', '').trim() || '';
        const relationship = notesLines.find(l => l.startsWith('Relationship:'))?.replace('Relationship:', '').trim() || '';
        
        built.antagonist = {
          name: antagonist.name,
          type: type as any,
          description: antagonist.description || '',
          motivation,
          relationship
        };
      }
      
      // Extract supporting characters
      const supporting = existingCharacters?.filter(c => c.role === 'supporting') || [];
      if (supporting.length > 0) {
        built.supportingCharacters = supporting.map(c => {
          const notesLines = (c.notes || '').split('\n');
          const role = notesLines.find(l => l.startsWith('Role:'))?.replace('Role:', '').trim() || '';
          const relationship = notesLines.find(l => l.startsWith('Relationship:'))?.replace('Relationship:', '').trim() || '';
          
          return {
            id: c.id,
            name: c.name,
            role,
            relationship,
            description: c.description || ''
          };
        });
      }
      
      // Extract locations
      if (existingLocations && existingLocations.length > 0) {
        built.locations = existingLocations.map(l => {
          const [desc, sig] = (l.description || '').split('\n\nSignificance:');
          return {
            id: l.id,
            name: l.name,
            type: l.type || 'other',
            description: desc?.trim() || '',
            significance: sig?.trim() || ''
          };
        });
      }
      
      // Extract framework metadata from notes
      const genreNote = existingNotes?.find(n => n.title === 'Genre & Tone' && n.tags?.includes('framework'));
      const premiseNote = existingNotes?.find(n => n.title === 'Premise' && n.tags?.includes('framework'));
      const conflictNote = existingNotes?.find(n => n.title === 'Conflict' && n.tags?.includes('framework'));
      const themesNote = existingNotes?.find(n => n.title === 'Themes' && n.tags?.includes('framework'));
      const worldNote = existingNotes?.find(n => n.title === 'World Building' && n.tags?.includes('framework'));
      
      if (genreNote) {
        try {
          built.genre = JSON.parse(genreNote.content);
        } catch {}
      }
      if (premiseNote) {
        try {
          built.premise = JSON.parse(premiseNote.content);
        } catch {}
      }
      if (conflictNote) {
        try {
          built.conflict = JSON.parse(conflictNote.content);
        } catch {}
      }
      if (themesNote) {
        try {
          built.themes = JSON.parse(themesNote.content);
        } catch {}
      }
      if (worldNote) {
        try {
          built.world = JSON.parse(worldNote.content);
        } catch {}
      }
      
      // Only update if we found something
      if (Object.keys(built).length > 0) {
        setFramework(prev => ({ ...prev, ...built }));
      }
    };
    
    buildFromExisting();
  }, [initialData, existingCharacters, existingLocations, existingNotes]);

  // Track dirty state
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Update framework field
  const updateField = useCallback(<K extends keyof FrameworkData>(
    section: K,
    field: keyof FrameworkData[K],
    value: any
  ) => {
    setFramework(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  // Update array item
  const updateArrayItem = useCallback((
    section: 'supportingCharacters' | 'locations',
    index: number,
    field: string,
    value: any
  ) => {
    setFramework(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  // Add array item
  const addArrayItem = useCallback((section: 'supportingCharacters' | 'locations') => {
    const newItem = section === 'supportingCharacters'
      ? { id: `char-${Date.now()}`, name: '', role: '', relationship: '', description: '' }
      : { id: `loc-${Date.now()}`, name: '', type: '', description: '', significance: '' };
    
    setFramework(prev => ({
      ...prev,
      [section]: [...prev[section], newItem]
    }));
    setIsDirty(true);
  }, []);

  // Remove array item
  const removeArrayItem = useCallback((section: 'supportingCharacters' | 'locations', index: number) => {
    setFramework(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  }, []);

  // Update string array (traits, subgenres, etc)
  const updateStringArray = useCallback(<K extends keyof FrameworkData>(
    section: K,
    field: keyof FrameworkData[K],
    value: string
  ) => {
    const items = value.split(',').map(s => s.trim()).filter(Boolean);
    updateField(section, field, items);
  }, [updateField]);

  // Sync characters to database
  const syncCharactersToDatabase = useCallback(async () => {
    if (!onCreateCharacter && !onUpdateCharacter) return;

    // Sync protagonist
    if (framework.protagonist.name) {
      const existingProtag = existingCharacters?.find(c => c.role === 'protagonist');
      if (existingProtag && onUpdateCharacter) {
        await onUpdateCharacter(existingProtag.id, {
          name: framework.protagonist.name,
          description: framework.protagonist.description,
          traits: framework.protagonist.traits,
          notes: `Motivation: ${framework.protagonist.motivation}\nFlaw: ${framework.protagonist.flaw}\nArc: ${framework.protagonist.arc}`
        });
      } else if (onCreateCharacter) {
        await onCreateCharacter({
          name: framework.protagonist.name,
          role: 'protagonist',
          description: framework.protagonist.description,
          traits: framework.protagonist.traits,
          notes: `Motivation: ${framework.protagonist.motivation}\nFlaw: ${framework.protagonist.flaw}\nArc: ${framework.protagonist.arc}`
        });
      }
    }

    // Sync antagonist
    if (framework.antagonist.name) {
      const existingAntag = existingCharacters?.find(c => c.role === 'antagonist');
      if (existingAntag && onUpdateCharacter) {
        await onUpdateCharacter(existingAntag.id, {
          name: framework.antagonist.name,
          description: framework.antagonist.description,
          notes: `Type: ${framework.antagonist.type}\nMotivation: ${framework.antagonist.motivation}\nRelationship: ${framework.antagonist.relationship}`
        });
      } else if (onCreateCharacter) {
        await onCreateCharacter({
          name: framework.antagonist.name,
          role: 'antagonist',
          description: framework.antagonist.description,
          notes: `Type: ${framework.antagonist.type}\nMotivation: ${framework.antagonist.motivation}\nRelationship: ${framework.antagonist.relationship}`
        });
      }
    }

    // Sync supporting characters
    for (const char of framework.supportingCharacters) {
      if (!char.name) continue;
      
      // Check if this character already exists by matching ID in notes or by name
      const existing = existingCharacters?.find(c => 
        c.role === 'supporting' && c.name === char.name
      );
      
      if (existing && onUpdateCharacter) {
        await onUpdateCharacter(existing.id, {
          name: char.name,
          description: char.description,
          notes: `Role: ${char.role}\nRelationship: ${char.relationship}`
        });
      } else if (onCreateCharacter) {
        await onCreateCharacter({
          name: char.name,
          role: 'supporting',
          description: char.description,
          notes: `Role: ${char.role}\nRelationship: ${char.relationship}`
        });
      }
    }
  }, [framework, existingCharacters, onCreateCharacter, onUpdateCharacter]);

  // Sync locations to database
  const syncLocationsToDatabase = useCallback(async () => {
    if (!onCreateLocation && !onUpdateLocation) return;

    for (const loc of framework.locations) {
      if (!loc.name) continue;
      
      const existing = existingLocations?.find(l => l.name === loc.name);
      
      if (existing && onUpdateLocation) {
        await onUpdateLocation(existing.id, {
          name: loc.name,
          type: loc.type as any,
          description: `${loc.description}\n\nSignificance: ${loc.significance}`
        });
      } else if (onCreateLocation) {
        await onCreateLocation({
          name: loc.name,
          type: loc.type as any,
          description: `${loc.description}\n\nSignificance: ${loc.significance}`
        });
      }
    }
  }, [framework, existingLocations, onCreateLocation, onUpdateLocation]);

  // Save framework
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      // Save the framework data (as JSON in a note)
      await onSave(framework);
      
      // Also sync characters and locations to their respective tables
      await syncCharactersToDatabase();
      await syncLocationsToDatabase();
      
      setIsDirty(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save framework:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [framework, onSave, syncCharactersToDatabase, syncLocationsToDatabase]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty) handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, handleSave]);

  // Calculate completion percentage
  const getCompletion = useCallback(() => {
    let filled = 0;
    let total = 0;

    // Genre
    if (framework.genre.primary) filled++;
    if (framework.genre.tone) filled++;
    total += 2;

    // Premise
    if (framework.premise.logline) filled++;
    if (framework.premise.synopsis) filled++;
    total += 2;

    // Characters
    if (framework.protagonist.name) filled++;
    if (framework.antagonist.name) filled++;
    total += 2;

    // World
    if (framework.world.settingType) filled++;
    if (framework.world.timePeriod) filled++;
    total += 2;

    // Conflict & Themes
    if (framework.conflict.external) filled++;
    if (framework.themes.primary) filled++;
    total += 2;

    return Math.round((filled / total) * 100);
  }, [framework]);

  return (
    <div className={cn("flex h-full bg-[--ide-editor-bg]", className)}>
      {/* Section Navigation */}
      <div className="w-56 border-r border-[--ide-border] bg-[--ide-sidebar-bg] overflow-y-auto">
        <div className="p-3 border-b border-[--ide-border]">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-[--ide-accent]" />
            <span className="text-sm font-semibold text-[--ide-foreground]">Story Framework</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[--ide-input-bg] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[--ide-accent] transition-all"
                style={{ width: `${getCompletion()}%` }}
              />
            </div>
            <span className="text-xs text-[--ide-foreground-secondary]">{getCompletion()}%</span>
          </div>
        </div>

        <div className="p-2">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors mb-1",
                  isActive 
                    ? "bg-[--ide-accent]/20 text-[--ide-accent]"
                    : "text-[--ide-foreground-secondary] hover:bg-[--ide-list-hover] hover:text-[--ide-foreground]"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{section.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[--ide-border] bg-[--ide-titlebar-bg]">
          <div className="flex items-center gap-3">
            {(() => {
              const config = SECTIONS.find(s => s.id === activeSection);
              const Icon = config?.icon || BookOpen;
              return (
                <>
                  <Icon className="w-5 h-5 text-[--ide-accent]" />
                  <div>
                    <h2 className="text-sm font-semibold text-[--ide-foreground]">{config?.label}</h2>
                    <p className="text-xs text-[--ide-foreground-secondary]">{config?.description}</p>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="flex items-center gap-2">
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Check className="w-3 h-3" />
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <AlertCircle className="w-3 h-3" />
                Error saving
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                isDirty
                  ? "bg-[--ide-accent] text-white hover:opacity-90"
                  : "bg-[--ide-input-bg] text-[--ide-foreground-muted] cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {isDirty ? 'Save Changes' : 'Saved'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {activeSection === 'genre' && (
              <GenreSection 
                data={framework.genre} 
                onUpdate={(field: string, value: string) => updateField('genre', field as any, value)}
                onUpdateArray={(field: string, value: string) => updateStringArray('genre', field as any, value)}
              />
            )}
            {activeSection === 'premise' && (
              <PremiseSection 
                data={framework.premise} 
                onUpdate={(field: string, value: string) => updateField('premise', field as any, value)}
              />
            )}
            {activeSection === 'protagonist' && (
              <ProtagonistSection 
                data={framework.protagonist} 
                onUpdate={(field: string, value: string) => updateField('protagonist', field as any, value)}
                onUpdateArray={(field: string, value: string) => updateStringArray('protagonist', field as any, value)}
              />
            )}
            {activeSection === 'antagonist' && (
              <AntagonistSection 
                data={framework.antagonist} 
                onUpdate={(field: string, value: string) => updateField('antagonist', field as any, value)}
              />
            )}
            {activeSection === 'supporting' && (
              <SupportingSection 
                characters={framework.supportingCharacters}
                onUpdate={updateArrayItem}
                onAdd={() => addArrayItem('supportingCharacters')}
                onRemove={(index: number) => removeArrayItem('supportingCharacters', index)}
              />
            )}
            {activeSection === 'world' && (
              <WorldSection 
                data={framework.world} 
                onUpdate={(field: string, value: string) => updateField('world', field as any, value)}
              />
            )}
            {activeSection === 'locations' && (
              <LocationsSection 
                locations={framework.locations}
                onUpdate={updateArrayItem}
                onAdd={() => addArrayItem('locations')}
                onRemove={(index: number) => removeArrayItem('locations', index)}
              />
            )}
            {activeSection === 'conflict' && (
              <ConflictSection 
                data={framework.conflict} 
                onUpdate={(field: string, value: string) => updateField('conflict', field as any, value)}
                onUpdateArray={(field: string, value: string) => updateStringArray('conflict', field as any, value)}
              />
            )}
            {activeSection === 'themes' && (
              <ThemesSection 
                data={framework.themes} 
                onUpdate={(field: string, value: string) => updateField('themes', field as any, value)}
                onUpdateArray={(field: string, value: string) => updateStringArray('themes', field as any, value)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Section Components
function InputField({ 
  label, 
  value, 
  onChange, 
  placeholder,
  multiline = false,
  rows = 3
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[--ide-foreground-secondary]">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-3 py-2 bg-[--ide-input-bg] border border-[--ide-border] rounded-lg text-sm text-[--ide-foreground] placeholder:text-[--ide-foreground-muted] focus:outline-none focus:ring-1 focus:ring-[--ide-accent] resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-[--ide-input-bg] border border-[--ide-border] rounded-lg text-sm text-[--ide-foreground] placeholder:text-[--ide-foreground-muted] focus:outline-none focus:ring-1 focus:ring-[--ide-accent]"
        />
      )}
    </div>
  );
}

function GenreSection({ data, onUpdate, onUpdateArray }: any) {
  return (
    <div className="space-y-4">
      <InputField 
        label="Primary Genre" 
        value={data.primary} 
        onChange={(v) => onUpdate('primary', v)}
        placeholder="e.g., Fantasy, Sci-Fi, Mystery, Romance..."
      />
      <InputField 
        label="Subgenres (comma-separated)" 
        value={data.subgenres?.join(', ') || ''} 
        onChange={(v) => onUpdateArray('subgenres', v)}
        placeholder="e.g., Urban Fantasy, Noir, Coming-of-age..."
      />
      <InputField 
        label="Tone" 
        value={data.tone} 
        onChange={(v) => onUpdate('tone', v)}
        placeholder="e.g., Dark, Humorous, Epic, Intimate..."
      />
      <InputField 
        label="Target Audience" 
        value={data.targetAudience} 
        onChange={(v) => onUpdate('targetAudience', v)}
        placeholder="e.g., Adult, Young Adult, Middle Grade..."
      />
    </div>
  );
}

function PremiseSection({ data, onUpdate }: any) {
  return (
    <div className="space-y-4">
      <InputField 
        label="Logline (1-2 sentences)" 
        value={data.logline} 
        onChange={(v) => onUpdate('logline', v)}
        multiline
        rows={2}
        placeholder="A concise summary of your story's main conflict..."
      />
      <InputField 
        label="Hook" 
        value={data.hook} 
        onChange={(v) => onUpdate('hook', v)}
        multiline
        rows={2}
        placeholder="What makes this story unique? What grabs the reader?"
      />
      <InputField 
        label="Synopsis" 
        value={data.synopsis} 
        onChange={(v) => onUpdate('synopsis', v)}
        multiline
        rows={6}
        placeholder="A more detailed overview of your story..."
      />
    </div>
  );
}

function ProtagonistSection({ data, onUpdate, onUpdateArray }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <InputField 
          label="Name" 
          value={data.name} 
          onChange={(v) => onUpdate('name', v)}
          placeholder="Character name"
        />
        <InputField 
          label="Age" 
          value={data.age || ''} 
          onChange={(v) => onUpdate('age', v)}
          placeholder="Age or age range"
        />
      </div>
      <InputField 
        label="Occupation / Role" 
        value={data.occupation || ''} 
        onChange={(v) => onUpdate('occupation', v)}
        placeholder="What do they do?"
      />
      <InputField 
        label="Description" 
        value={data.description} 
        onChange={(v) => onUpdate('description', v)}
        multiline
        rows={3}
        placeholder="Physical appearance, personality overview..."
      />
      <InputField 
        label="Core Motivation" 
        value={data.motivation} 
        onChange={(v) => onUpdate('motivation', v)}
        multiline
        rows={2}
        placeholder="What drives them? What do they want?"
      />
      <InputField 
        label="Fatal Flaw" 
        value={data.flaw} 
        onChange={(v) => onUpdate('flaw', v)}
        placeholder="Their weakness or internal obstacle"
      />
      <InputField 
        label="Character Arc" 
        value={data.arc} 
        onChange={(v) => onUpdate('arc', v)}
        multiline
        rows={2}
        placeholder="How do they change throughout the story?"
      />
      <InputField 
        label="Traits (comma-separated)" 
        value={data.traits?.join(', ') || ''} 
        onChange={(v) => onUpdateArray('traits', v)}
        placeholder="e.g., Brave, Stubborn, Compassionate..."
      />
    </div>
  );
}

function AntagonistSection({ data, onUpdate }: any) {
  return (
    <div className="space-y-4">
      <InputField 
        label="Name / Title" 
        value={data.name} 
        onChange={(v) => onUpdate('name', v)}
        placeholder="Antagonist name or what they represent"
      />
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-[--ide-foreground-secondary]">
          Type
        </label>
        <select
          value={data.type}
          onChange={(e) => onUpdate('type', e.target.value)}
          className="w-full px-3 py-2 bg-[--ide-input-bg] border border-[--ide-border] rounded-lg text-sm text-[--ide-foreground] focus:outline-none focus:ring-1 focus:ring-[--ide-accent]"
        >
          <option value="person">Person</option>
          <option value="organization">Organization</option>
          <option value="nature">Nature / Environment</option>
          <option value="society">Society / System</option>
          <option value="self">Self (Internal)</option>
          <option value="technology">Technology</option>
        </select>
      </div>
      <InputField 
        label="Description" 
        value={data.description} 
        onChange={(v) => onUpdate('description', v)}
        multiline
        rows={3}
        placeholder="Who or what are they? What makes them formidable?"
      />
      <InputField 
        label="Motivation" 
        value={data.motivation} 
        onChange={(v) => onUpdate('motivation', v)}
        multiline
        rows={2}
        placeholder="Why do they oppose the protagonist? (They should believe they're right)"
      />
      <InputField 
        label="Relationship to Protagonist" 
        value={data.relationship} 
        onChange={(v) => onUpdate('relationship', v)}
        placeholder="How are they connected? What's their history?"
      />
    </div>
  );
}

function SupportingSection({ characters, onUpdate, onAdd, onRemove }: any) {
  return (
    <div className="space-y-4">
      {characters.map((char: any, index: number) => (
        <div key={char.id} className="p-4 bg-[--ide-sidebar-bg] rounded-lg border border-[--ide-border] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[--ide-foreground-secondary]">
              Character {index + 1}
            </span>
            <button
              onClick={() => onRemove(index)}
              className="p-1 text-red-400 hover:bg-red-400/10 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField 
              label="Name" 
              value={char.name} 
              onChange={(v) => onUpdate('supportingCharacters', index, 'name', v)}
              placeholder="Character name"
            />
            <InputField 
              label="Role" 
              value={char.role} 
              onChange={(v) => onUpdate('supportingCharacters', index, 'role', v)}
              placeholder="e.g., Mentor, Sidekick, Love Interest..."
            />
          </div>
          <InputField 
            label="Relationship to Protagonist" 
            value={char.relationship} 
            onChange={(v) => onUpdate('supportingCharacters', index, 'relationship', v)}
            placeholder="How do they connect to the main character?"
          />
          <InputField 
            label="Description" 
            value={char.description} 
            onChange={(v) => onUpdate('supportingCharacters', index, 'description', v)}
            multiline
            rows={2}
            placeholder="Brief description..."
          />
        </div>
      ))}
      
      <button
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[--ide-border] rounded-lg text-[--ide-foreground-secondary] hover:border-[--ide-accent] hover:text-[--ide-accent] transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Supporting Character
      </button>
    </div>
  );
}

function WorldSection({ data, onUpdate }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <InputField 
          label="Time Period" 
          value={data.timePeriod} 
          onChange={(v) => onUpdate('timePeriod', v)}
          placeholder="e.g., Medieval, Modern, Future..."
        />
        <InputField 
          label="Setting Type" 
          value={data.settingType} 
          onChange={(v) => onUpdate('settingType', v)}
          placeholder="e.g., Urban, Rural, Space..."
        />
      </div>
      <InputField 
        label="Technology Level" 
        value={data.technology} 
        onChange={(v) => onUpdate('technology', v)}
        placeholder="What technology exists in this world?"
      />
      <InputField 
        label="Society & Culture" 
        value={data.society} 
        onChange={(v) => onUpdate('society', v)}
        multiline
        rows={3}
        placeholder="How is society organized? What are the power structures?"
      />
      <InputField 
        label="Special Rules (Magic, Physics, etc.)" 
        value={data.rules} 
        onChange={(v) => onUpdate('rules', v)}
        multiline
        rows={3}
        placeholder="What special systems or rules govern this world?"
      />
      <InputField 
        label="Atmosphere & Mood" 
        value={data.atmosphere} 
        onChange={(v) => onUpdate('atmosphere', v)}
        multiline
        rows={2}
        placeholder="The overall feeling of your world..."
      />
    </div>
  );
}

function LocationsSection({ locations, onUpdate, onAdd, onRemove }: any) {
  return (
    <div className="space-y-4">
      {locations.map((loc: any, index: number) => (
        <div key={loc.id} className="p-4 bg-[--ide-sidebar-bg] rounded-lg border border-[--ide-border] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[--ide-foreground-secondary]">
              Location {index + 1}
            </span>
            <button
              onClick={() => onRemove(index)}
              className="p-1 text-red-400 hover:bg-red-400/10 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField 
              label="Name" 
              value={loc.name} 
              onChange={(v) => onUpdate('locations', index, 'name', v)}
              placeholder="Location name"
            />
            <InputField 
              label="Type" 
              value={loc.type} 
              onChange={(v) => onUpdate('locations', index, 'type', v)}
              placeholder="e.g., City, Building, Forest..."
            />
          </div>
          <InputField 
            label="Description" 
            value={loc.description} 
            onChange={(v) => onUpdate('locations', index, 'description', v)}
            multiline
            rows={2}
            placeholder="What does it look like? What's the atmosphere?"
          />
          <InputField 
            label="Story Significance" 
            value={loc.significance} 
            onChange={(v) => onUpdate('locations', index, 'significance', v)}
            placeholder="Why is this location important to the story?"
          />
        </div>
      ))}
      
      <button
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[--ide-border] rounded-lg text-[--ide-foreground-secondary] hover:border-[--ide-accent] hover:text-[--ide-accent] transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Location
      </button>
    </div>
  );
}

function ConflictSection({ data, onUpdate, onUpdateArray }: any) {
  return (
    <div className="space-y-4">
      <InputField 
        label="External Conflict" 
        value={data.external} 
        onChange={(v) => onUpdate('external', v)}
        multiline
        rows={3}
        placeholder="What external obstacles does the protagonist face?"
      />
      <InputField 
        label="Internal Conflict" 
        value={data.internal} 
        onChange={(v) => onUpdate('internal', v)}
        multiline
        rows={3}
        placeholder="What internal struggles does the protagonist face?"
      />
      <InputField 
        label="Stakes" 
        value={data.stakes} 
        onChange={(v) => onUpdate('stakes', v)}
        multiline
        rows={2}
        placeholder="What happens if the protagonist fails? What's at risk?"
      />
      <InputField 
        label="Key Obstacles (comma-separated)" 
        value={data.obstacles?.join(', ') || ''} 
        onChange={(v) => onUpdateArray('obstacles', v)}
        multiline
        rows={2}
        placeholder="Major obstacles the protagonist must overcome..."
      />
    </div>
  );
}

function ThemesSection({ data, onUpdate, onUpdateArray }: any) {
  return (
    <div className="space-y-4">
      <InputField 
        label="Primary Theme" 
        value={data.primary} 
        onChange={(v) => onUpdate('primary', v)}
        placeholder="The central message or idea of your story"
      />
      <InputField 
        label="Secondary Themes (comma-separated)" 
        value={data.secondary?.join(', ') || ''} 
        onChange={(v) => onUpdateArray('secondary', v)}
        placeholder="e.g., Redemption, Identity, Power..."
      />
      <InputField 
        label="Symbols & Motifs (comma-separated)" 
        value={data.symbols?.join(', ') || ''} 
        onChange={(v) => onUpdateArray('symbols', v)}
        placeholder="Recurring images or objects that represent themes..."
      />
      <InputField 
        label="Thematic Questions (comma-separated)" 
        value={data.questions?.join(', ') || ''} 
        onChange={(v) => onUpdateArray('questions', v)}
        multiline
        rows={2}
        placeholder="Questions your story explores..."
      />
    </div>
  );
}

export default FrameworkEditor;
