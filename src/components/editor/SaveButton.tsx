'use client'

import React, { useState, useEffect } from 'react'
import { Save, Check, Loader2, History, ChevronDown } from 'lucide-react'
import { Editor } from '@tiptap/react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/portal/ui/toast'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

interface SaveButtonProps {
  editor: Editor | null
  docId: string
  onVersionUpdate?: (version: string) => void
}

export function SaveButton({ editor, docId, onVersionUpdate }: SaveButtonProps) {
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [currentVersion, setCurrentVersion] = useState<string>('v0.1.0')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [versionSummary, setVersionSummary] = useState('')
  const [isMilestone, setIsMilestone] = useState(false)
  const supabase = createClient()
  const toast = useToast()

  // Listen for version updates from the document meta and load initial version
  useEffect(() => {
    // Load initial version from database
    const loadInitialVersion = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('version')
          .eq('id', docId)
          .single()
          
        if (!error && data?.version) {
          setCurrentVersion(data.version)
        }
      } catch (e) {
        console.warn('Failed to load initial version:', e)
      }
    }
    
    loadInitialVersion()
    
    const handleDocMeta = (event: CustomEvent) => {
      if (event.detail?.version) {
        setCurrentVersion(event.detail.version)
      }
    }
    window.addEventListener('sw:doc-meta' as any, handleDocMeta)
    return () => window.removeEventListener('sw:doc-meta' as any, handleDocMeta)
  }, [docId, supabase])

  // Format version number to string
  const formatVersion = (versionNumber: number): string => {
    const major = Math.floor(versionNumber / 100)
    const minor = Math.floor((versionNumber % 100) / 10)
    const patch = versionNumber % 10
    return `v${major}.${minor}.${patch}`
  }

  // Parse version string to number
  const parseVersion = (versionString: string): number => {
    const match = versionString.match(/v?(\d+)\.(\d+)\.(\d+)/)
    if (!match) return 10 // Default to v0.1.0
    const [, major, minor, patch] = match
    return parseInt(major) * 100 + parseInt(minor) * 10 + parseInt(patch)
  }

  // Handle quick save (minor version increment)
  const handleQuickSave = async () => {
    if (!editor || saveState === 'saving') return
    
    setSaveState('saving')
    
    try {
      // Get current content from both editors
      const w: any = window
      const manuscript = w.manuscriptEditor?.getJSON?.() || null
      const framework = w.frameworkEditor?.getJSON?.() || null
      const combined = { mode: 'dual', manuscript, framework }
      
      console.log('SaveButton: Quick save starting', { 
        docId,
        hasManuscriptEditor: !!w.manuscriptEditor,
        hasFrameworkEditor: !!w.frameworkEditor,
        manuscriptContent: manuscript ? 'present' : 'null',
        frameworkContent: framework ? 'present' : 'null'
      })
      
      // Use the same dual-column format as autosave
      const payload = { 
        content: JSON.stringify(combined), 
        manuscript_content: manuscript, 
        framework_content: framework, 
        manuscript_updated_at: new Date().toISOString(), 
        framework_updated_at: new Date().toISOString() 
      }

      console.log('SaveButton: Attempting save with payload', payload)

      // Save directly to projects table to match autosave behavior
      const { error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', docId)
        
      if (error) {
        console.log('SaveButton: Primary save failed, trying legacy format', error)
        // Fallback to legacy content-only format if new columns don't exist
        const { error: legacyError } = await supabase
          .from('projects')
          .update({ content: JSON.stringify(combined) })
          .eq('id', docId)
          
        if (legacyError) {
          console.error('SaveButton: Legacy save also failed', legacyError)
          throw legacyError
        } else {
          console.log('SaveButton: Legacy save succeeded')
        }
      } else {
        console.log('SaveButton: Primary save succeeded')
      }

      setLastSaved(new Date())
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
      
      toast({
        title: 'Document saved',
        description: 'Changes saved successfully'
      })
    } catch (error) {
      console.error('Save error:', error)
      setSaveState('idle')
      toast({
        title: 'Save failed',
        description: 'Could not save document. Please try again.',
        variant: 'destructive'
      })
    }
  }

  // Handle save with version (manual version creation)
  const handleSaveWithVersion = async () => {
    if (!editor || saveState === 'saving') return
    
    setSaveState('saving')
    setShowVersionDialog(false)
    
    try {
      // Get current content
      const w: any = window
      const manuscript = w.manuscriptEditor?.getJSON?.() || null
      const framework = w.frameworkEditor?.getJSON?.() || null
      const combined = { mode: 'dual', manuscript, framework }

      // Increment version number
      const currentVersionNum = parseVersion(currentVersion)
      const newVersionNum = isMilestone 
        ? Math.ceil(currentVersionNum / 100) * 100 // Major version
        : currentVersionNum + 1 // Minor version
        
      const newVersion = formatVersion(newVersionNum)
      
      // Use the same dual-column format as autosave
      const payload = { 
        content: JSON.stringify(combined), 
        manuscript_content: manuscript, 
        framework_content: framework, 
        manuscript_updated_at: new Date().toISOString(), 
        framework_updated_at: new Date().toISOString() 
      }

      // Save directly to projects table
      const { error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', docId)
        
      if (error) {
        // Fallback to legacy content-only format if new columns don't exist
        const { error: legacyError } = await supabase
          .from('projects')
          .update({ content: JSON.stringify(combined) })
          .eq('id', docId)
          
        if (legacyError) throw legacyError
      }

      // Create version record
      try {
        const { error: versionError } = await supabase
          .from('document_versions')
          .insert({
            project_id: docId,
            version_number: newVersionNum,
            content: JSON.stringify(combined),
            content_snapshot: combined, // Add the missing field
            summary: versionSummary || `Version ${newVersion}`,
            word_count: JSON.stringify(combined).length, // Rough estimate
            created_by: (await supabase.auth.getUser()).data?.user?.id,
            is_milestone: isMilestone,
            tags: versionSummary ? [versionSummary] : []
          })
          
        if (versionError) {
          console.warn('Version creation failed:', versionError)
          // Continue - version creation is optional
        }
      } catch (e) {
        console.warn('Version creation error:', e)
      }
      
      // Update the projects table version to persist it
      try {
        await supabase
          .from('projects')
          .update({ version: newVersion })
          .eq('id', docId)
      } catch (e) {
        console.warn('Failed to update project version:', e)
      }
      
      setCurrentVersion(newVersion)
      onVersionUpdate?.(newVersion)
      setLastSaved(new Date())
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
      
      // Update header
      window.dispatchEvent(new CustomEvent('sw:doc-meta', {
        detail: { version: newVersion }
      }))
      
      toast({
        title: 'Version saved',
        description: `Created ${isMilestone ? 'milestone' : 'version'} ${newVersion}`
      })
      
      // Reset dialog state
      setVersionSummary('')
      setIsMilestone(false)
    } catch (error) {
      console.error('Version save error:', error)
      setSaveState('idle')
      toast({
        title: 'Version save failed',
        description: 'Could not create version. Please try again.',
        variant: 'destructive'
      })
    }
  }

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return null
    const now = new Date()
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000)
    
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return lastSaved.toLocaleDateString()
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-[--border] bg-[--card] hover:bg-[--accent] transition-colors"
            disabled={saveState === 'saving'}
          >
            {saveState === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saveState === 'saved' && <Check className="w-3.5 h-3.5 text-green-500" />}
            {saveState === 'idle' && <Save className="w-3.5 h-3.5" />}
            <span className="font-medium">
              {saveState === 'saving' ? 'Saving...' : 
               saveState === 'saved' ? 'Saved' : 'Save'}
            </span>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[180px] bg-[--card] rounded-lg border border-[--border] shadow-lg p-1 z-50"
            sideOffset={5}
          >
            <DropdownMenu.Item
              className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-[--accent] cursor-pointer outline-none"
              onSelect={handleQuickSave}
            >
              <Save className="w-3.5 h-3.5" />
              <div className="flex-1">
                <div className="font-medium">Quick Save</div>
                <div className="text-[10px] opacity-60">Save changes</div>
              </div>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-[--accent] cursor-pointer outline-none"
              onSelect={() => setShowVersionDialog(true)}
            >
              <History className="w-3.5 h-3.5" />
              <div className="flex-1">
                <div className="font-medium">Save as Version</div>
                <div className="text-[10px] opacity-60">Create new version</div>
              </div>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-[--border] my-1" />

            <div className="px-2 py-1.5 text-[10px] opacity-60">
              <div>Current: {currentVersion}</div>
              {lastSaved && <div>Saved: {formatLastSaved()}</div>}
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Version Dialog */}
      {showVersionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[--card] rounded-lg border border-[--border] p-4 max-w-md w-full mx-4">
            <h3 className="text-sm font-semibold mb-3">Create Version</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs opacity-70">Version Summary (optional)</label>
                <textarea
                  className="w-full mt-1 px-2 py-1.5 text-xs rounded border border-[--border] bg-[--background] resize-none"
                  rows={3}
                  placeholder="Describe the changes in this version..."
                  value={versionSummary}
                  onChange={(e) => setVersionSummary(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={isMilestone}
                  onChange={(e) => setIsMilestone(e.target.checked)}
                  className="rounded border-[--border]"
                />
                <span>Mark as milestone version</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-3 py-1.5 text-xs rounded border border-[--border] hover:bg-[--accent]"
                onClick={() => setShowVersionDialog(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 text-xs rounded bg-blue-500 text-white hover:bg-blue-600"
                onClick={handleSaveWithVersion}
              >
                Create Version
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}