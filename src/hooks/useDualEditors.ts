import { useEffect, useState, useCallback } from 'react'
import { Editor, useEditor } from '@tiptap/react'
import type { Doc as YDoc } from 'yjs'
import { ExtensionKit } from '@/extensions/extension-kit'
import { emptyContent, emptyFrameworkContent } from '@/lib/data/emptyContent'
import { Surface } from '@/components/ui/SurfaceSwitcher'
import { StoryFramework } from '@/types/story-frameworks'

// Simple framework content for demo
const frameworkInitialContent = `
<h2>Story Framework</h2>
<h3>Characters</h3>
<p>Add your character profiles, backgrounds, and development arcs here.</p>

<h3>Plot Outline</h3>
<p>Outline your story structure, key plot points, and narrative flow.</p>

<h3>World Building</h3>
<p>Describe settings, rules, history, and other world-building elements.</p>

<h3>Themes</h3>
<p>Define the central themes and messages of your story.</p>
`

// Framework template insertion and management

export const useDualEditors = () => {
  const [activeSurface, setActiveSurface] = useState<Surface>('manuscript')
  const [activeFramework, setActiveFramework] = useState<string | null>(null)
  
  // Manuscript editor (main story content)
  const manuscriptEditor = useEditor({
    immediatelyRender: false,
    autofocus: true,
    content: emptyContent,
    extensions: ExtensionKit({}),
  })

  // Framework editor (story context and planning)
  const frameworkEditor = useEditor({
    immediatelyRender: false,
    autofocus: false,
    content: emptyFrameworkContent,
    extensions: ExtensionKit({}),
  })

  // Handle surface switching
  const switchSurface = (surface: Surface) => {
    setActiveSurface(surface)
    
    // Focus the active editor after switching
    setTimeout(() => {
      if (surface === 'manuscript' && manuscriptEditor) {
        manuscriptEditor.commands.focus()
      } else if (surface === 'framework' && frameworkEditor) {
        frameworkEditor.commands.focus()
      }
    }, 100)
  }

  // Convert markdown-like template to HTML for TipTap editor
  const markdownToHtml = (markdown: string): string => {
    return markdown
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^- (.+)$/gm, '<ul><li>$1</li></ul>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^---$/gm, '<hr>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>')
      .replace(/<\/ul>\s*<ul>/g, '') // Merge consecutive lists
      .replace(/<p><(h[1-6]|hr)>/g, '<$1>') // Remove p tags around headers and hr
      .replace(/<\/(h[1-6]|hr)><\/p>/g, '</$1>') // Remove p tags around headers and hr
      .replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>') // Fix list wrapping
  }

  // Handle framework template insertion
  const applyFrameworkTemplate = useCallback((framework: StoryFramework) => {
    if (!frameworkEditor) return

    // Convert markdown template to HTML
    const htmlContent = markdownToHtml(framework.template)
    
    // Replace the content in the framework editor
    frameworkEditor.commands.setContent(htmlContent)
    
    // Set active framework
    setActiveFramework(framework.id)
    
    // Switch to framework surface and focus
    setActiveSurface('framework')
    setTimeout(() => {
      frameworkEditor.commands.focus()
    }, 100)
  }, [frameworkEditor])

  // Clear framework content
  const clearFramework = useCallback(() => {
    if (!frameworkEditor) return
    
    frameworkEditor.commands.setContent(frameworkInitialContent)
    setActiveFramework(null)
  }, [frameworkEditor])

  // Keyboard shortcut for switching surfaces (Ctrl/Cmd + Tab)
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
        e.preventDefault()
        const newSurface = activeSurface === 'manuscript' ? 'framework' : 'manuscript'
        switchSurface(newSurface)
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [activeSurface])

  return {
    manuscriptEditor,
    frameworkEditor,
    activeSurface,
    switchSurface,
    activeEditor: activeSurface === 'manuscript' ? manuscriptEditor : frameworkEditor,
    applyFrameworkTemplate,
    clearFramework,
    activeFramework
  }
}