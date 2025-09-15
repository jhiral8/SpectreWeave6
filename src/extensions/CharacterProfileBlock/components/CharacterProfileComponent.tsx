import React, { useState, useCallback, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { 
  ChevronDown, 
  ChevronRight, 
  Users, 
  User, 
  Heart,
  Target,
  Zap,
  Edit3,
  X,
  Plus,
  Sparkles,
  Download,
  Upload,
  Camera,
  Brain,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useAIContext } from '@/contexts/AIContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface CharacterProfileComponentProps {
  node: any;
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
  decorations: any[];
  selected: boolean;
  view: any;
  getPos: () => number;
  innerDecorations: any;
  editor: any;
  extension: any;
  HTMLAttributes: Record<string, any>;
  ref: React.RefObject<HTMLElement>;
}

export const CharacterProfileComponent: React.FC<CharacterProfileComponentProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  const { 
    characterId, 
    name, 
    description, 
    traits, 
    backstory, 
    goals, 
    conflicts, 
    relationships, 
    development, 
    notes, 
    avatar, 
    aiSuggestions, 
    lastAIUpdate, 
    collapsed 
  } = node.attrs;
  
  const ai = useAIContext() as any;
  
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    name,
    description,
    traits: [...traits],
    backstory,
    goals,
    conflicts,
    relationships,
    development,
    notes,
    avatar,
  });

  // AI Integration methods
  const generateCharacterSuggestions = useCallback(async () => {
    if (!name && !description) {
      setAIError('Please provide at least a character name or description before generating suggestions.');
      return;
    }

    setIsGeneratingAI(true);
    setAIError(null);

    try {
      const characterData = {
        name,
        description,
        traits,
        backstory,
        goals,
        conflicts,
        relationships,
      };

      const generateCharacterDevelopment: (data: any) => Promise<{
        additionalTraits: string[];
        backstoryElements: string[];
        relationshipDynamics: string[];
        characterArc: string[];
        potentialConflicts: string[];
      }> = ai?.generateCharacterDevelopment || (async () => ({
        additionalTraits: [],
        backstoryElements: [],
        relationshipDynamics: [],
        characterArc: [],
        potentialConflicts: [],
      }));
      const suggestions = await generateCharacterDevelopment(characterData);
      
      // Convert AI response to suggestion format
      const formattedSuggestions = [
        ...suggestions.additionalTraits.map((trait: string) => `Trait: ${trait}`),
        ...suggestions.backstoryElements.map((element: string) => `Backstory: ${element}`),
        ...suggestions.relationshipDynamics.map((dynamic: string) => `Relationship: ${dynamic}`),
        ...suggestions.characterArc.map((arc: string) => `Development: ${arc}`),
        ...suggestions.potentialConflicts.map((conflict: string) => `Conflict: ${conflict}`),
      ];

      updateAttributes({
        aiSuggestions: formattedSuggestions,
        lastAIUpdate: new Date().toISOString(),
      });
      
      setShowAISuggestions(true);
    } catch (error) {
      console.error('AI suggestion generation failed:', error);
      setAIError('Failed to generate AI suggestions. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  }, [name, description, traits, backstory, goals, conflicts, relationships, ai, updateAttributes]);

  // Listen for AI suggestion events
  useEffect(() => {
    const handleAISuggestionRequest = (event: CustomEvent) => {
      if (event.detail.characterId === characterId) {
        generateCharacterSuggestions();
      }
    };

    window.addEventListener('character-ai-suggestion-request', handleAISuggestionRequest as EventListener);
    return () => {
      window.removeEventListener('character-ai-suggestion-request', handleAISuggestionRequest as EventListener);
    };
  }, [characterId, generateCharacterSuggestions]);

  const toggleCollapsed = useCallback(() => {
    updateAttributes({ collapsed: !collapsed });
  }, [collapsed, updateAttributes]);

  const handleSave = useCallback(() => {
    updateAttributes(editValues);
    setIsEditing(false);
  }, [editValues, updateAttributes]);

  const handleCancel = useCallback(() => {
    setEditValues({
      name,
      description,
      traits: [...traits],
      backstory,
      goals,
      conflicts,
      relationships,
      development,
      notes,
      avatar,
    });
    setIsEditing(false);
  }, [name, description, traits, backstory, goals, conflicts, relationships, development, notes, avatar]);

  const addTrait = useCallback(() => {
    setEditValues(prev => ({
      ...prev,
      traits: [...prev.traits, ''],
    }));
  }, []);

  const updateTrait = useCallback((index: number, value: string) => {
    setEditValues(prev => ({
      ...prev,
      traits: prev.traits.map((trait, i) => i === index ? value : trait),
    }));
  }, []);

  const removeTrait = useCallback((index: number) => {
    setEditValues(prev => ({
      ...prev,
      traits: prev.traits.filter((_, i) => i !== index),
    }));
  }, []);

  const applySuggestion = useCallback((suggestion: string) => {
    const [type, content] = suggestion.split(': ');
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('trait')) {
      if (content && !traits.includes(content)) {
        updateAttributes({ traits: [...traits, content] });
      }
    } else if (lowerType.includes('backstory')) {
      updateAttributes({ 
        backstory: backstory ? `${backstory}\n\n${content}` : content 
      });
    } else if (lowerType.includes('relationship')) {
      updateAttributes({ 
        relationships: relationships ? `${relationships}\n\n${content}` : content 
      });
    } else if (lowerType.includes('development')) {
      updateAttributes({ 
        development: development ? `${development}\n\n${content}` : content 
      });
    } else if (lowerType.includes('conflict')) {
      updateAttributes({ 
        conflicts: conflicts ? `${conflicts}\n\n${content}` : content 
      });
    }
  }, [traits, backstory, relationships, development, conflicts, updateAttributes]);

  const exportCharacterData = useCallback(() => {
    const data = {
      id: characterId,
      name,
      description,
      traits,
      backstory,
      goals,
      conflicts,
      relationships,
      development,
      notes,
      avatar,
      aiSuggestions,
      lastAIUpdate,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `character_${name || 'unnamed'}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [characterId, name, description, traits, backstory, goals, conflicts, relationships, development, notes, avatar, aiSuggestions, lastAIUpdate]);

  const importCharacterData = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            updateAttributes({
              name: data.name || name,
              description: data.description || description,
              traits: Array.isArray(data.traits) ? data.traits : traits,
              backstory: data.backstory || backstory,
              goals: data.goals || goals,
              conflicts: data.conflicts || conflicts,
              relationships: data.relationships || relationships,
              development: data.development || development,
              notes: data.notes || notes,
              avatar: data.avatar || avatar,
            });
          } catch (error) {
            console.error('Failed to import character data:', error);
            setAIError('Failed to import character data. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [name, description, traits, backstory, goals, conflicts, relationships, development, notes, avatar, updateAttributes]);

  return (
    <NodeViewWrapper className="character-profile-block my-4">
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleCollapsed}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>
            
            <Avatar className="h-8 w-8">
              {avatar ? (
                <AvatarImage src={avatar} alt={name || 'Character'} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                  <Users className="w-4 h-4 text-white" />
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex flex-col">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {name || 'Character Profile'}
              </h3>
              {lastAIUpdate && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  AI updated {new Date(lastAIUpdate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {aiSuggestions.length > 0 && (
              <Button
                buttonSize="small"
                variant="ghost"
                onClick={() => setShowAISuggestions(!showAISuggestions)}
                className="h-7 px-2 relative"
                title={`${aiSuggestions.length} AI suggestions available`}
              >
                <Sparkles className="w-3 h-3" />
                <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 px-1 text-[10px]">
                  {aiSuggestions.length}
                </Badge>
              </Button>
            )}
            
            <Button
              buttonSize="small"
              variant="ghost"
              onClick={generateCharacterSuggestions}
              disabled={isGeneratingAI}
              className="h-7 px-2"
              title="Generate AI suggestions"
            >
              {isGeneratingAI ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Brain className="w-3 h-3" />
              )}
            </Button>
            
            <Button
              buttonSize="iconSmall"
              variant="ghost"
              onClick={exportCharacterData}
              title="Export character data"
            >
              <Download className="w-3 h-3" />
            </Button>
            
            <Button
              buttonSize="iconSmall"
              variant="ghost"
              onClick={importCharacterData}
              title="Import character data"
            >
              <Upload className="w-3 h-3" />
            </Button>
            
            <Button
              buttonSize="iconSmall"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              title="Edit character profile"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            
            <Button
              buttonSize="iconSmall"
              variant="ghost"
              onClick={deleteNode}
              className="hover:bg-red-100 dark:hover:bg-red-900/20"
              title="Delete character profile"
            >
              <X className="w-3 h-3 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!collapsed && (
          <div className="p-4 space-y-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
            {/* AI Error Display */}
            {aiError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700 dark:text-red-300">{aiError}</span>
                <Button
                  buttonSize="iconSmall"
                  variant="ghost"
                  onClick={() => setAIError(null)}
                  className="ml-auto"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
            
            {/* AI Suggestions Panel */}
            {showAISuggestions && aiSuggestions.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/10 dark:to-pink-950/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    AI Character Suggestions
                  </h4>
                  <Button
                    buttonSize="iconSmall"
                    variant="ghost"
                    onClick={() => setShowAISuggestions(false)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {aiSuggestions.map((suggestion: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-white/80 dark:bg-gray-800/80 rounded border border-gray-200/50 dark:border-gray-700/50">
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{suggestion}</span>
                      <Button
                        buttonSize="iconSmall"
                        variant="ghost"
                        onClick={() => applySuggestion(suggestion)}
                        className="hover:bg-purple-100 dark:hover:bg-purple-900/20"
                        title="Apply suggestion"
                      >
                        <CheckCircle className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isEditing ? (
              <div className="space-y-4">
                {/* Edit Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Character Name
                    </label>
                    <Input
                      value={editValues.name}
                      onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Character name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Avatar URL
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={editValues.avatar}
                        onChange={(e) => setEditValues(prev => ({ ...prev, avatar: e.target.value }))}
                        placeholder="https://example.com/avatar.jpg"
                        className="flex-1"
                      />
                      <Button
                        buttonSize="small"
                        variant="secondary"
                        title="Upload avatar"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={editValues.description}
                    onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Physical appearance, personality overview..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Character Traits
                    </label>
                    <Button
                      buttonSize="small"
                      variant="secondary"
                      onClick={addTrait}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Trait
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editValues.traits.map((trait, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={trait}
                          onChange={(e) => updateTrait(index, e.target.value)}
                          placeholder="Character trait..."
                        />
                        <Button
                          buttonSize="iconSmall"
                          variant="ghost"
                          onClick={() => removeTrait(index)}
                          className="hover:bg-red-100 dark:hover:bg-red-900/20"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Backstory
                    </label>
                    <Textarea
                      value={editValues.backstory}
                      onChange={(e) => setEditValues(prev => ({ ...prev, backstory: e.target.value }))}
                      rows={3}
                      placeholder="Character's history, formative experiences..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Relationships
                    </label>
                    <Textarea
                      value={editValues.relationships}
                      onChange={(e) => setEditValues(prev => ({ ...prev, relationships: e.target.value }))}
                      rows={3}
                      placeholder="Family, friends, enemies, romantic interests..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Goals & Motivations
                    </label>
                    <Textarea
                      value={editValues.goals}
                      onChange={(e) => setEditValues(prev => ({ ...prev, goals: e.target.value }))}
                      rows={2}
                      placeholder="What does this character want? What drives them?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Character Development
                    </label>
                    <Textarea
                      value={editValues.development}
                      onChange={(e) => setEditValues(prev => ({ ...prev, development: e.target.value }))}
                      rows={2}
                      placeholder="How does this character grow and change?"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Conflicts & Obstacles
                    </label>
                    <Textarea
                      value={editValues.conflicts}
                      onChange={(e) => setEditValues(prev => ({ ...prev, conflicts: e.target.value }))}
                      rows={2}
                      placeholder="Internal/external conflicts, what stands in their way?"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <Textarea
                      value={editValues.notes}
                      onChange={(e) => setEditValues(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      placeholder="Additional notes and ideas..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    buttonSize="small"
                    variant="secondary"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    buttonSize="small"
                    variant="primary"
                    onClick={handleSave}
                  >
                    Save Character
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Display Mode */}
                {description && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Description</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{description}</p>
                    </div>
                  </div>
                )}

                {traits.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Traits</h4>
                      <div className="flex flex-wrap gap-2">
                        {traits.map((trait: string, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
                          >
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {backstory && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Backstory</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{backstory}</p>
                    </div>
                  </div>
                )}

                {goals && (
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Goals & Motivations</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{goals}</p>
                    </div>
                  </div>
                )}

                {conflicts && (
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Conflicts & Obstacles</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{conflicts}</p>
                    </div>
                  </div>
                )}
                
                {relationships && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Relationships</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{relationships}</p>
                    </div>
                  </div>
                )}
                
                {development && (
                  <div className="flex items-start gap-3">
                    <ArrowUp className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Character Development</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{development}</p>
                    </div>
                  </div>
                )}
                
                {notes && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Notes</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic">{notes}</p>
                    </div>
                  </div>
                )}

                {!description && !backstory && !goals && !conflicts && !relationships && !development && !notes && traits.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click the edit button to add character information</p>
                    <p className="text-xs mt-1">Or use the AI button to generate suggestions</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content area for nested content */}
        <NodeViewContent className="character-profile-content" />
      </div>
    </NodeViewWrapper>
  );
};