/**
 * AI-Powered Writing Blocks for SpectreWeave5
 * 
 * Enhanced writing assistance components that integrate with TipTap editor:
 * - Author Style Analysis and Suggestions
 * - Character Profile Development 
 * - AI Feedback and Writing Analysis
 * - Smart Content Generation
 * - Real-time Writing Assistance
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Editor } from '@tiptap/core';
import { useAdvancedAI } from '../../lib/ai/advancedAIContext';
import { 
  AIFeedback, 
  AISuggestion, 
  AIContext,
  AIFeedbackType,
  AISuggestionType,
} from '../../lib/ai/types';

// UI Components (these would typically come from your design system)
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-md border ${className}`}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = ''
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}) => {
  const baseClasses = 'font-medium rounded-md transition-colors focus:outline-none focus:ring-2';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500'
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

// Author Style Analysis Block
interface AuthorStyleBlockProps {
  editor: Editor | null;
  selectedText?: string;
}

export const AuthorStyleBlock: React.FC<AuthorStyleBlockProps> = ({ 
  editor, 
  selectedText 
}) => {
  const { 
    analyzeTextStyle, 
    generateWithStyleProfile, 
    getStyleProfiles,
    isConnectedToBridge 
  } = useAdvancedAI();

  const [analysis, setAnalysis] = useState<any>(null);
  const [styleProfiles, setStyleProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load style profiles on mount
  useEffect(() => {
    if (isConnectedToBridge) {
      getStyleProfiles().then(setStyleProfiles).catch(console.error);
    }
  }, [isConnectedToBridge, getStyleProfiles]);

  const analyzeStyle = useCallback(async () => {
    if (!editor) return;

    const content = selectedText || editor.getText();
    if (content.length < 100) {
      alert('Please select or write at least 100 characters for analysis.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeTextStyle(content);
      setAnalysis(result);
    } catch (error) {
      console.error('Style analysis failed:', error);
      alert('Failed to analyze text style. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [editor, selectedText, analyzeTextStyle]);

  const generateWithStyle = useCallback(async () => {
    if (!editor || !selectedProfile) return;

    const prompt = selectedText || 'Continue writing in the established style...';
    setIsGenerating(true);
    
    try {
      const response = await generateWithStyleProfile(prompt, selectedProfile);
      
      // Insert generated content at cursor position
      const currentPos = editor.state.selection.from;
      editor.chain().focus().insertContentAt(currentPos, `\n\n${response.content}\n\n`).run();
    } catch (error) {
      console.error('Style generation failed:', error);
      alert('Failed to generate content with style profile. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [editor, selectedText, selectedProfile, generateWithStyleProfile]);

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Author Style Analysis</h3>
        <Button
          onClick={analyzeStyle}
          disabled={isAnalyzing}
          size="sm"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Style'}
        </Button>
      </div>

      {analysis && (
        <div className="mb-4 space-y-3">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Detected Genre</h4>
            <Badge variant="default">{analysis.genre}</Badge>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Style Attributes</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(analysis.style_attributes || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>

          {analysis.writing_techniques && analysis.writing_techniques.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Writing Techniques</h4>
              <div className="flex flex-wrap gap-1">
                {analysis.writing_techniques.map((technique: string, index: number) => (
                  <Badge key={index} variant="success">{technique}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isConnectedToBridge && styleProfiles.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-700 mb-2">Generate with Style Profile</h4>
          <div className="flex gap-2">
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Select a style profile...</option>
              {styleProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.fingerprint} ({profile.writers?.length || 0} writers)
                </option>
              ))}
            </select>
            <Button
              onClick={generateWithStyle}
              disabled={!selectedProfile || isGenerating}
              size="sm"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

// Character Profile Block
interface CharacterProfileBlockProps {
  editor: Editor | null;
  characters?: Array<{
    id: string;
    name: string;
    description: string;
    traits: string[];
  }>;
}

export const CharacterProfileBlock: React.FC<CharacterProfileBlockProps> = ({
  editor,
  characters = []
}) => {
  const { generateText, buildContext } = useAdvancedAI();
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [profileType, setProfileType] = useState<'dialogue' | 'description' | 'backstory' | 'development'>('dialogue');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCharacterContent = useCallback(async () => {
    if (!editor || !selectedCharacter) return;

    const character = characters.find(c => c.id === selectedCharacter);
    if (!character) return;

    setIsGenerating(true);
    
    try {
      let prompt = '';
      const context = buildContext();

      switch (profileType) {
        case 'dialogue':
          prompt = `Write authentic dialogue for ${character.name}. Character traits: ${character.traits.join(', ')}. Description: ${character.description}. Make the dialogue distinctive and true to their character.`;
          break;
        case 'description':
          prompt = `Write a vivid physical and personality description of ${character.name}. Include their traits: ${character.traits.join(', ')}. Base description: ${character.description}. Make it engaging and detailed.`;
          break;
        case 'backstory':
          prompt = `Create a compelling backstory for ${character.name}. Character traits: ${character.traits.join(', ')}. Current description: ${character.description}. Include formative experiences that shaped their personality.`;
          break;
        case 'development':
          prompt = `Suggest character development opportunities for ${character.name}. Traits: ${character.traits.join(', ')}. Description: ${character.description}. Include potential character arcs and growth moments.`;
          break;
      }

      const response = await generateText(prompt, {
        temperature: 0.8,
        maxTokens: 500,
      });

      // Insert generated content
      const currentPos = editor.state.selection.from;
      editor.chain().focus().insertContentAt(currentPos, `\n\n**${character.name} - ${profileType.charAt(0).toUpperCase() + profileType.slice(1)}:**\n\n${response.content}\n\n`).run();

    } catch (error) {
      console.error('Character content generation failed:', error);
      alert('Failed to generate character content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [editor, selectedCharacter, profileType, characters, generateText, buildContext]);

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Character Development</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Character
          </label>
          <select
            value={selectedCharacter}
            onChange={(e) => setSelectedCharacter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Choose a character...</option>
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content Type
          </label>
          <select
            value={profileType}
            onChange={(e) => setProfileType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="dialogue">Dialogue Sample</option>
            <option value="description">Physical Description</option>
            <option value="backstory">Backstory</option>
            <option value="development">Character Development</option>
          </select>
        </div>

        <Button
          onClick={generateCharacterContent}
          disabled={!selectedCharacter || isGenerating}
          className="w-full"
        >
          {isGenerating ? 'Generating...' : 'Generate Character Content'}
        </Button>
      </div>

      {selectedCharacter && (
        <div className="mt-4 pt-4 border-t">
          {(() => {
            const character = characters.find(c => c.id === selectedCharacter);
            if (!character) return null;

            return (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">{character.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{character.description}</p>
                <div className="flex flex-wrap gap-1">
                  {character.traits.map((trait, index) => (
                    <Badge key={index} variant="success">{trait}</Badge>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </Card>
  );
};

// AI Feedback Block
interface AIFeedbackBlockProps {
  editor: Editor | null;
  selectedText?: string;
}

export const AIFeedbackBlock: React.FC<AIFeedbackBlockProps> = ({
  editor,
  selectedText
}) => {
  const { 
    generateFeedback, 
    generateSuggestions, 
    buildContext,
    selectedGenre,
    selectedAuthors 
  } = useAdvancedAI();

  const [feedback, setFeedback] = useState<AIFeedback[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'feedback' | 'suggestions'>('feedback');

  const analyzeFeedback = useCallback(async () => {
    if (!editor) return;

    const content = selectedText || editor.getText();
    if (content.length < 50) {
      alert('Please select or write at least 50 characters for analysis.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const context = buildContext({
        selectedText: selectedText,
        documentContent: editor.getText(),
        genre: selectedGenre || undefined,
        authorStyles: selectedAuthors,
      });

      const [feedbackResults, suggestionResults] = await Promise.all([
        generateFeedback(content, context),
        generateSuggestions(content, context)
      ]);

      setFeedback(feedbackResults);
      setSuggestions(suggestionResults);
    } catch (error) {
      console.error('Feedback analysis failed:', error);
      alert('Failed to generate feedback. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [editor, selectedText, generateFeedback, generateSuggestions, buildContext, selectedGenre, selectedAuthors]);

  const applySuggestion = useCallback((suggestion: AISuggestion) => {
    if (!editor) return;

    // Insert suggestion at current position
    const currentPos = editor.state.selection.from;
    editor.chain().focus().insertContentAt(currentPos, suggestion.text).run();

    // Mark as applied
    setSuggestions(prev => 
      prev.map(s => s.id === suggestion.id ? { ...s, applied: true } : s)
    );
  }, [editor]);

  const getFeedbackColor = (type: AIFeedbackType, severity: string) => {
    if (severity === 'error') return 'error';
    if (severity === 'warning') return 'warning';
    if (type === 'grammar') return 'error';
    if (type === 'style') return 'warning';
    return 'default';
  };

  const getSuggestionColor = (type: AISuggestionType) => {
    switch (type) {
      case 'correction': return 'error';
      case 'enhancement': return 'success';
      case 'alternative': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Writing Analysis</h3>
        <Button
          onClick={analyzeFeedback}
          disabled={isAnalyzing}
          size="sm"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Writing'}
        </Button>
      </div>

      {(feedback.length > 0 || suggestions.length > 0) && (
        <div>
          <div className="flex border-b mb-4">
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'feedback'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Feedback ({feedback.length})
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'suggestions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Suggestions ({suggestions.length})
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activeTab === 'feedback' && feedback.map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 rounded-md">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant={getFeedbackColor(item.type, item.severity)}>
                    {item.type}
                  </Badge>
                  <span className="text-xs text-gray-500 capitalize">{item.severity}</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{item.content}</p>
                {item.suggestions && item.suggestions.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-600 mb-1">Suggestions:</h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {item.suggestions.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {activeTab === 'suggestions' && suggestions.map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 rounded-md">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant={getSuggestionColor(item.type)}>
                    {item.type}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {Math.round(item.confidence * 100)}% confidence
                    </span>
                    {!item.applied && (
                      <Button
                        onClick={() => applySuggestion(item)}
                        variant="secondary"
                        size="sm"
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">{item.reason}</p>
                <div className="p-2 bg-white rounded border">
                  <p className="text-sm font-mono">{item.text}</p>
                </div>
                {item.alternatives && item.alternatives.length > 0 && (
                  <div className="mt-2">
                    <h5 className="text-xs font-medium text-gray-600 mb-1">Alternatives:</h5>
                    <div className="space-y-1">
                      {item.alternatives.map((alt, index) => (
                        <p key={index} className="text-xs text-gray-600 font-mono">• {alt}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// Combined Writing Assistant Panel
interface AIWritingAssistantPanelProps {
  editor: Editor | null;
  selectedText?: string;
  characters?: Array<{
    id: string;
    name: string;
    description: string;
    traits: string[];
  }>;
}

export const AIWritingAssistantPanel: React.FC<AIWritingAssistantPanelProps> = ({
  editor,
  selectedText,
  characters
}) => {
  return (
    <div className="space-y-4">
      <AuthorStyleBlock editor={editor} selectedText={selectedText} />
      <CharacterProfileBlock editor={editor} characters={characters} />
      <AIFeedbackBlock editor={editor} selectedText={selectedText} />
    </div>
  );
};