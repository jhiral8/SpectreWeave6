import React, { useState, useCallback } from 'react';
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
  Plus
} from 'lucide-react';

interface CharacterProfileComponentProps {
  node: any; // Full Node object from TipTap
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
  // Additional properties required by ReactNodeViewRenderer
  decorations: any[];
  selected: boolean;
  view: any;
  getPos: () => number;
  innerDecorations: any; // DecorationSource type
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
  const { name, description, traits, backstory, goals, conflicts, collapsed } = node.attrs;
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    name,
    description,
    traits: [...traits],
    backstory,
    goals,
    conflicts,
  });

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
    });
    setIsEditing(false);
  }, [name, description, traits, backstory, goals, conflicts]);

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

  return (
    <NodeViewWrapper className="character-profile-block my-4">
      <div className="border border-gray-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleCollapsed}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <Users className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">
              {name || 'Character Profile'}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Edit character profile"
            >
              <Edit3 className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={deleteNode}
              className="p-1 hover:bg-red-100 rounded transition-colors"
              title="Delete character profile"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!collapsed && (
          <div className="p-4 space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                {/* Edit Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Character Name
                  </label>
                  <input
                    type="text"
                    value={editValues.name}
                    onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Character name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editValues.description}
                    onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Physical appearance, personality overview..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Character Traits
                    </label>
                    <button
                      onClick={addTrait}
                      className="flex items-center gap-1 px-2 py-1 text-sm text-green-600 hover:bg-green-50 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Trait
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editValues.traits.map((trait, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={trait}
                          onChange={(e) => updateTrait(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Character trait..."
                        />
                        <button
                          onClick={() => removeTrait(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Backstory
                  </label>
                  <textarea
                    value={editValues.backstory}
                    onChange={(e) => setEditValues(prev => ({ ...prev, backstory: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Character's history, formative experiences..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goals & Motivations
                  </label>
                  <textarea
                    value={editValues.goals}
                    onChange={(e) => setEditValues(prev => ({ ...prev, goals: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                    placeholder="What does this character want? What drives them?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conflicts & Obstacles
                  </label>
                  <textarea
                    value={editValues.conflicts}
                    onChange={(e) => setEditValues(prev => ({ ...prev, conflicts: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                    placeholder="Internal/external conflicts, what stands in their way?"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Display Mode */}
                {description && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
                    </div>
                  </div>
                )}

                {traits.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Traits</h4>
                      <div className="flex flex-wrap gap-2">
                        {traits.map((trait, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full border border-green-200"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {backstory && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Backstory</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{backstory}</p>
                    </div>
                  </div>
                )}

                {goals && (
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Goals & Motivations</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{goals}</p>
                    </div>
                  </div>
                )}

                {conflicts && (
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Conflicts & Obstacles</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{conflicts}</p>
                    </div>
                  </div>
                )}

                {!description && !backstory && !goals && !conflicts && traits.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click the edit button to add character information</p>
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