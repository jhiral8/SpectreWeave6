/**
 * Example usage of the SpectreWeave Editor with all writing tools
 * 
 * This component demonstrates how to integrate the complete
 * Phase 3.5 editor with all writing tools enabled.
 */

import React, { useState } from 'react';
import { SpectreWeaveEditor } from '../editor/SpectreWeaveEditor';

const initialContent = `
<h1>Welcome to SpectreWeave5 ✨</h1>

<p>This editor includes all Phase 3.5 writing tools:</p>

<ul>
  <li><strong>Enhanced Slash Commands</strong> - Type "/" to see categorized commands</li>
  <li><strong>Text Selection Toolbar</strong> - Select text to see formatting options</li>
  <li><strong>Block Handles</strong> - Hover over blocks to see action handles</li>
  <li><strong>Writing Blocks</strong> - Use /character, /author, or /research</li>
  <li><strong>AI Research</strong> - Create research notes with AI-powered search</li>
</ul>

<h2>Try these commands:</h2>

<p>Type <code>/character</code> to add a character profile</p>
<p>Type <code>/author</code> to add an author style guide</p>
<p>Type <code>/research</code> to add a research note</p>

<blockquote>
  <p>💡 <strong>Tip:</strong> Select any text to see the floating toolbar, or hover over any block to see the block handles.</p>
</blockquote>

<p>Start writing below...</p>
`;

export const EditorExample: React.FC = () => {
  const [content, setContent] = useState(initialContent);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSave = (content: string) => {
    setLastSaved(new Date());
    console.log('Saved content:', content);
    // Here you would typically save to your backend
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          SpectreWeave5 Editor Demo
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Complete writing environment with AI-powered tools and research integration
        </p>
        {lastSaved && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            Last saved: {lastSaved.toLocaleTimeString()}
          </p>
        )}
      </div>

      <SpectreWeaveEditor
        content={content}
        onUpdate={setContent}
        onSave={handleSave}
        placeholder="Start writing your story..."
        enableAI={true}
        enableResearch={true}
        enableWritingTools={true}
        projectId="example-project"
        userId="example-user"
        userName="Demo Writer"
        className="min-h-[600px]"
      />

      <div className="mt-8 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
        <h3 className="font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
          Features Included:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-neutral-800 dark:text-neutral-200">Writing Tools</h4>
            <ul className="text-neutral-600 dark:text-neutral-400 space-y-1">
              <li>• Character Profile Blocks</li>
              <li>• Author Style Guides</li>
              <li>• Feedback & Notes System</li>
              <li>• Research Integration</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-neutral-800 dark:text-neutral-200">Editor Features</h4>
            <ul className="text-neutral-600 dark:text-neutral-400 space-y-1">
              <li>• Text Selection Toolbar</li>
              <li>• Block Handles & Actions</li>
              <li>• Enhanced Slash Commands</li>
              <li>• Drag & Drop (simplified)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};