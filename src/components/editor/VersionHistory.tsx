'use client'

import React, { useState, useEffect } from 'react'
import { History, RotateCcw, Calendar, FileText, Star, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/portal/ui/toast'
import { formatDistanceToNow } from 'date-fns'

interface Version {
  id: string
  version_number: number
  summary?: string
  created_at: string
  created_by?: string
  word_count?: number
  is_milestone?: boolean
  tags?: string[]
}

interface VersionHistoryProps {
  docId: string
  onRestore?: (version: Version) => void
  onClose?: () => void
}

export function VersionHistory({ docId, onRestore, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [restoring, setRestoring] = useState(false)
  const supabase = createClient()
  const toast = useToast()

  // Format version number to string
  const formatVersion = (versionNumber: number): string => {
    const major = Math.floor(versionNumber / 100)
    const minor = Math.floor((versionNumber % 100) / 10)
    const patch = versionNumber % 10
    return `v${major}.${minor}.${patch}`
  }

  // Load version history
  useEffect(() => {
    loadVersions()
  }, [docId])

  const loadVersions = async () => {
    try {
      setLoading(true)
      console.log('🔍 Loading versions for docId:', docId)
      
      // Try direct Supabase query first
      const { data: versions, error } = await supabase
        .from('document_versions')
        .select(`
          id,
          version_number,
          content,
          summary,
          change_summary,
          word_count,
          created_at,
          created_by,
          is_milestone,
          tags
        `)
        .eq('project_id', docId)
        .order('version_number', { ascending: false })
      
      console.log('📦 Supabase response:', { versions, error })
      
      if (error) {
        console.error('❌ Supabase Error:', error)
        throw new Error(`Supabase error: ${error.message}`)
      }
      
      // Transform versions data to match component expectations
      const transformedVersions = (versions || []).map(version => ({
        id: version.id,
        version_number: version.version_number,
        summary: version.summary || version.change_summary || `Version v${Math.floor(version.version_number / 100)}.${Math.floor((version.version_number % 100) / 10)}.${version.version_number % 10}`,
        created_at: version.created_at,
        created_by: version.created_by,
        word_count: version.word_count,
        is_milestone: version.is_milestone,
        tags: version.tags || []
      }))
      
      console.log('📚 Versions found:', transformedVersions.length)
      setVersions(transformedVersions)
    } catch (error) {
      console.error('💥 Load versions error:', error)
      toast({
        title: 'Failed to load versions',
        description: error instanceof Error ? error.message : 'Could not retrieve version history',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle version restoration
  const handleRestore = async (version: Version) => {
    if (restoring) return
    
    const confirmed = window.confirm(
      `Are you sure you want to restore ${formatVersion(version.version_number)}? Current changes will be saved as a new version.`
    )
    
    if (!confirmed) return
    
    setRestoring(true)
    
    try {
      console.log('🔄 Starting restore for version:', version.id)
      
      // First, get the version data including content
      const { data: versionData, error: versionError } = await supabase
        .from('document_versions')
        .select('content, content_snapshot')
        .eq('id', version.id)
        .single()
      
      if (versionError || !versionData) {
        throw new Error(`Failed to fetch version data: ${versionError?.message}`)
      }
      
      console.log('📦 Version data retrieved:', versionData)
      
      // Parse the content - try content_snapshot first, then content
      let restoredContent
      if (versionData.content_snapshot) {
        restoredContent = versionData.content_snapshot
      } else if (versionData.content) {
        try {
          restoredContent = typeof versionData.content === 'string' 
            ? JSON.parse(versionData.content) 
            : versionData.content
        } catch (e) {
          restoredContent = versionData.content
        }
      } else {
        throw new Error('No content found in version')
      }
      
      console.log('🎯 Content to restore:', restoredContent)
      
      // Get current project state to create backup
      const { data: currentProject, error: projectError } = await supabase
        .from('projects')
        .select('manuscript_content, framework_content, content')
        .eq('id', docId)
        .single()
      
      if (projectError) {
        console.warn('Could not fetch current project for backup:', projectError)
      }
      
      // Create backup version from current state
      if (currentProject) {
        const { data: lastVersion } = await supabase
          .from('document_versions')
          .select('version_number')
          .eq('project_id', docId)
          .order('version_number', { ascending: false })
          .limit(1)
          .single()
        
        const nextVersionNumber = (lastVersion?.version_number || 0) + 1
        
        await supabase
          .from('document_versions')
          .insert({
            project_id: docId,
            version_number: nextVersionNumber,
            content: JSON.stringify({
              mode: 'dual',
              manuscript: currentProject.manuscript_content || currentProject.content,
              framework: currentProject.framework_content
            }),
            content_snapshot: {
              mode: 'dual',
              manuscript: currentProject.manuscript_content || currentProject.content,
              framework: currentProject.framework_content
            },
            summary: `Backup before restoring to ${formatVersion(version.version_number)}`,
            is_milestone: false,
            tags: ['backup', 'pre-restore']
          })
        
        console.log('✅ Backup version created')
      }
      
      // Now restore the content to the project
      const updateData: any = {}
      
      if (restoredContent.mode === 'dual') {
        updateData.manuscript_content = restoredContent.manuscript
        updateData.framework_content = restoredContent.framework
        updateData.manuscript_updated_at = new Date().toISOString()
        updateData.framework_updated_at = new Date().toISOString()
      } else {
        // Legacy single content
        updateData.manuscript_content = restoredContent
        updateData.content = restoredContent
        updateData.manuscript_updated_at = new Date().toISOString()
      }
      
      const { error: restoreError } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', docId)
      
      if (restoreError) {
        throw new Error(`Failed to restore content: ${restoreError.message}`)
      }
      
      console.log('✅ Content restored successfully')
      
      toast({
        title: 'Version restored',
        description: `Restored to ${formatVersion(version.version_number)}`
      })
      
      // Clear any cached content to force fresh load from database
      localStorage.removeItem(`sw-doc-${docId}`)
      sessionStorage.removeItem(`sw-doc-${docId}`)
      
      // Add a delay before reload to ensure database update completes
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
      onRestore?.(version)
    } catch (error) {
      console.error('💥 Restore error:', error)
      toast({
        title: 'Restore failed',
        description: error instanceof Error ? error.message : 'Could not restore version. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[--card] rounded-lg border border-[--border] max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[--border]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <h2 className="text-sm font-semibold">Version History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[--accent]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Version List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-xs opacity-60">Loading versions...</div>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <History className="w-8 h-8 opacity-20 mb-2" />
              <div className="text-xs opacity-60">No version history yet</div>
            </div>
          ) : (
            <div className="divide-y divide-[--border]">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-3 hover:bg-[--accent] cursor-pointer transition-colors ${
                    selectedVersion?.id === version.id ? 'bg-[--accent]' : ''
                  }`}
                  onClick={() => setSelectedVersion(version)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {formatVersion(version.version_number)}
                        </span>
                        {version.is_milestone && (
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        )}
                        {version.tags?.map(tag => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500/10 text-blue-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      {version.summary && (
                        <p className="text-xs opacity-70 mt-1">{version.summary}</p>
                      )}
                      
                      <div className="flex items-center gap-3 mt-2 text-[10px] opacity-50">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                        </div>
                        {version.word_count && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {version.word_count.toLocaleString()} words
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      className="px-2 py-1 text-xs rounded border border-[--border] hover:bg-[--background] flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRestore(version)
                      }}
                      disabled={restoring}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedVersion && (
          <div className="p-4 border-t border-[--border] bg-[--accent]/50">
            <div className="flex items-center justify-between">
              <div className="text-xs">
                <div className="font-medium mb-1">
                  {formatVersion(selectedVersion.version_number)}
                </div>
                <div className="opacity-60">
                  Created {formatDistanceToNow(new Date(selectedVersion.created_at), { addSuffix: true })}
                  {selectedVersion.word_count && ` • ${selectedVersion.word_count.toLocaleString()} words`}
                </div>
              </div>
              <button
                className="px-3 py-1.5 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1"
                onClick={() => handleRestore(selectedVersion)}
                disabled={restoring}
              >
                <RotateCcw className="w-3 h-3" />
                {restoring ? 'Restoring...' : 'Restore This Version'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}