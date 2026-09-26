import React, { useState, useCallback } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { 
  ChevronDown, 
  ChevronRight, 
  User, 
  BookOpen, 
  Lightbulb, 
  Quote,
  Edit3,
  X,
  Plus
} from 'lucide-react';

interface AuthorStyleComponentProps {
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

export const AuthorStyleComponent: React.FC<AuthorStyleComponentProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  const { authorName, genre, styleDescription, sampleText, writingTips, collapsed } = node.attrs;
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    authorName,
    genre,
    styleDescription,
    sampleText,
    writingTips: [...writingTips],
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
      authorName,
      genre,
      styleDescription,
      sampleText,
      writingTips: [...writingTips],
    });
    setIsEditing(false);
  }, [authorName, genre, styleDescription, sampleText, writingTips]);

  const addWritingTip = useCallback(() => {
    setEditValues(prev => ({
      ...prev,
      writingTips: [...prev.writingTips, ''],
    }));
  }, []);

  const updateWritingTip = useCallback((index: number, value: string) => {
    setEditValues(prev => ({
      ...prev,
      writingTips: prev.writingTips.map((tip, i) => i === index ? value : tip),
    }));
  }, []);

  const removeWritingTip = useCallback((index: number) => {
    setEditValues(prev => ({
      ...prev,
      writingTips: prev.writingTips.filter((_, i) => i !== index),
    }));
  }, []);

  const getGenreColor = (genre: string) => {
    const colors = {
      'sci-fi': 'bg-purple-100 text-purple-800 border-purple-200',
      'fantasy': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'mystery': 'bg-gray-100 text-gray-800 border-gray-200',
      'thriller': 'bg-red-100 text-red-800 border-red-200',
      'romance': 'bg-pink-100 text-pink-800 border-pink-200',
      'horror': 'bg-orange-100 text-orange-800 border-orange-200',
      'historical': 'bg-amber-100 text-amber-800 border-amber-200',
      'literary': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[genre.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <NodeViewWrapper className="author-style-block my-4">
      <div className="border border-gray-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
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
            <User className="w-5 h-5 text-blue-600" />
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                {authorName || 'Author Style Guide'}
              </h3>
              {genre && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getGenreColor(genre)}`}>
                  {genre}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Edit style guide"
            >
              <Edit3 className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={deleteNode}
              className="p-1 hover:bg-red-100 rounded transition-colors"
              title="Delete style guide"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Author Name
                    </label>
                    <input
                      type="text"
                      value={editValues.authorName}
                      onChange={(e) => setEditValues(prev => ({ ...prev, authorName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Ernest Hemingway"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Genre
                    </label>
                    <select
                      value={editValues.genre}
                      onChange={(e) => setEditValues(prev => ({ ...prev, genre: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select genre</option>
                      <option value="literary">Literary Fiction</option>
                      <option value="sci-fi">Science Fiction</option>
                      <option value="fantasy">Fantasy</option>
                      <option value="mystery">Mystery</option>
                      <option value="thriller">Thriller</option>
                      <option value="romance">Romance</option>
                      <option value="horror">Horror</option>
                      <option value="historical">Historical Fiction</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Style Description
                  </label>
                  <textarea
                    value={editValues.styleDescription}
                    onChange={(e) => setEditValues(prev => ({ ...prev, styleDescription: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe the author's distinctive writing style, voice, and techniques..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sample Text
                  </label>
                  <textarea
                    value={editValues.sampleText}
                    onChange={(e) => setEditValues(prev => ({ ...prev, sampleText: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Include a representative sample of the author's writing..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Writing Tips
                    </label>
                    <button
                      onClick={addWritingTip}
                      className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Tip
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editValues.writingTips.map((tip, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tip}
                          onChange={(e) => updateWritingTip(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter a writing tip or technique..."
                        />
                        <button
                          onClick={() => removeWritingTip(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
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
                    className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Display Mode */}
                {styleDescription && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Style Description</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{styleDescription}</p>
                    </div>
                  </div>
                )}

                {sampleText && (
                  <div className="flex items-start gap-3">
                    <Quote className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Sample Text</h4>
                      <blockquote className="text-gray-700 text-sm italic leading-relaxed border-l-4 border-blue-200 pl-4 bg-blue-50 p-3 rounded-r">
                        {sampleText}
                      </blockquote>
                    </div>
                  </div>
                )}

                {writingTips.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Writing Tips</h4>
                      <ul className="space-y-1">
                        {writingTips.map((tip, index) => (
                          <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {!styleDescription && !sampleText && writingTips.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click the edit button to add author style information</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content area for nested content */}
        <NodeViewContent className="author-style-content" />
      </div>
    </NodeViewWrapper>
  );
};