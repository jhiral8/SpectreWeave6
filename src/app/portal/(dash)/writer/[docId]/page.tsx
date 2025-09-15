"use client"

import * as React from 'react'
import dynamic from 'next/dynamic'
import LogoLoader from '@/components/ui/LogoLoader'
import { Doc as YDoc } from 'yjs'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useToast } from '@/components/portal/ui/toast'
import { emptyContent } from '@/lib/data/emptyContent'

const BlockEditor = dynamic(() => import('@/components/BlockEditor/BlockEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full grid place-items-center">
      <LogoLoader message="Preparing editor…" />
    </div>
  ),
})

export default function Page({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = React.use(params)
  const [user, setUser] = React.useState<User | null>(null)
  const supabase = React.useMemo(() => createClient(), [])
  const toast = useToast()
  const isUuid = React.useMemo(() => /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(docId), [docId])
  // Manuscript and framework documents (collab providers disabled for now)
  const ydoc = React.useMemo(() => new YDoc(), [])
  const frameworkYdoc = React.useMemo(() => new YDoc(), [])
  const provider = null as TiptapCollabProvider | null
  const frameworkProvider = null as TiptapCollabProvider | null
  const saveTimer = React.useRef<NodeJS.Timeout | null>(null)

  // Purge any non-UUID local drafts (keys like sw-doc-<id>)
  React.useEffect(() => {
    try {
      const UUID_RE = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i
      const toRemove: string[] = []
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (!key) continue
        if (key.startsWith('sw-doc-')) {
          const id = key.substring('sw-doc-'.length)
          if (!UUID_RE.test(id)) toRemove.push(key)
        }
      }
      toRemove.forEach((k) => localStorage.removeItem(k))
    } catch {}
  }, [])

  React.useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    run()
  }, [supabase])

  React.useEffect(() => {
    const load = async () => {
      try {
        // Non-UUID ids: use localStorage only to avoid API 400s
        if (!isUuid) {
          const getEditor = (): Promise<any> => new Promise(resolve => {
            const tick = () => {
              const ed = (window as any).activeEditor || (window as any).manuscriptEditor || (window as any).editor
              if (ed) return resolve(ed)
              setTimeout(tick, 120)
            }
            tick()
          })
          const ed: any = await getEditor()
          const local = typeof window !== 'undefined' ? localStorage.getItem(`sw-doc-${docId}`) : null
          const incoming = local ? JSON.parse(local) : emptyContent
          try { ed.commands.setContent(incoming) } catch { ed.commands.setContent(incoming) }
          return
        }

        // Prefer fetching from projects first to avoid documents 404 noise
        let data: any
        let error: any
        try {
          const res = await supabase
            .from('projects')
            .select('content,manuscript_content,framework_content,title,version')
            .eq('id', docId)
            .single()
          data = res.data
          error = res.error
        } catch (e: any) {
          error = e
        }
        // If remote DB doesn't have new columns, retry with legacy projection
        if (error && /column|does not exist|unknown/i.test(String(error?.message))) {
          const resLegacy = await supabase
            .from('projects')
            .select('content,title')
            .eq('id', docId)
            .single()
          data = resLegacy.data
          error = resLegacy.error
        }
        if (error) {
          const status = (error as any)?.status
          const message = String((error as any)?.message || '')
          if (status === 404 || status === 406 || /no rows|not found/i.test(message)) {
            // Create a minimal project row if not present and we have a user
            const { data: auth } = await supabase.auth.getUser()
            const userId = auth?.user?.id
            if (userId) {
              const { error: insertError } = await supabase.from('projects').insert({
                id: docId,
                title: 'Untitled Document',
                user_id: userId,
                status: 'draft',
                archived: false,
              })
              if (insertError) {
                // If creation fails because of schema mismatch or other reasons, try legacy documents fetch as last resort
                const resDoc = await supabase
                  .from('documents')
                  .select('content,manuscript_content,framework_content,title,version')
                  .eq('id', docId)
                  .single()
                data = resDoc.data
                error = resDoc.error
                if (error && /column|does not exist|unknown/i.test(String(error?.message))) {
                  const resDocLegacy = await supabase
                    .from('documents')
                    .select('content,title,version')
                    .eq('id', docId)
                    .single()
                  data = resDocLegacy.data
                  error = resDocLegacy.error
                }
                if (error && !(error as any)?.status) throw error
              } else {
                // Created locally; synthesize fallback for immediate load
                ;(window as any).__sw_fallback_project = { title: 'Untitled Document' }
              }
            }
          } else {
            throw error
          }
        }
        const w = window as any
        const fallback = w.__sw_fallback_project
        // Expose document meta for the portal header (fallback to project title if document title is missing)
        w.swDocMeta = {
          title: (data?.title || fallback?.title || 'Untitled Document'),
          version: data?.version || 'v0.1.0',
        }
        try { window.dispatchEvent(new CustomEvent('sw:doc-meta', { detail: w.swDocMeta })) } catch {}

        // Wait for both editors (manuscript/framework) to be ready
        const waitForEditors = (): Promise<{ manuscript?: any; framework?: any; anyOne?: any }> => new Promise(resolve => {
          const check = () => {
            const manuscript = (window as any).manuscriptEditor || (window as any).activeEditor
            const framework = (window as any).frameworkEditor
            const anyOne = manuscript || framework || (window as any).editor
            if (anyOne) return resolve({ manuscript, framework, anyOne })
            setTimeout(check, 120)
          }
          check()
        })

        // Prefer new dual columns; fall back to legacy content
        const dual = data?.manuscript_content || data?.framework_content ? {
          manuscript: data?.manuscript_content,
          framework: data?.framework_content,
        } : null
        const incomingContent = dual || (fallback ? fallback.content : data?.content)
        if (incomingContent) {
          const { manuscript, framework, anyOne } = await waitForEditors()
          let parsed: any = incomingContent
          try { if (typeof parsed === 'string') parsed = JSON.parse(parsed) } catch {}

          const looksLikeDoc = parsed && typeof parsed === 'object' && (parsed.type === 'doc' || Array.isArray(parsed.content))
          if (parsed && (parsed.manuscript || parsed.framework)) {
            // Structured dual payload
            if (manuscript && parsed.manuscript) {
              try { manuscript.commands.setContent(parsed.manuscript) } catch { manuscript.commands.setContent(parsed.manuscript) }
            } else if (anyOne && parsed.manuscript) {
              try { anyOne.commands.setContent(parsed.manuscript) } catch { anyOne.commands.setContent(parsed.manuscript) }
            }
            if (framework && parsed.framework) {
              try { framework.commands.setContent(parsed.framework) } catch { framework.commands.setContent(parsed.framework) }
            }
          } else if (looksLikeDoc) {
            // Back-compat: single document content → apply to both if available
            if (manuscript) {
              try { manuscript.commands.setContent(parsed) } catch { manuscript.commands.setContent(parsed) }
            } else if (anyOne) {
              try { anyOne.commands.setContent(parsed) } catch { anyOne.commands.setContent(parsed) }
            }
            if (framework) {
              try { framework.commands.setContent(parsed) } catch { framework.commands.setContent(parsed) }
            }
          }
        }
      } catch (e: any) {
        toast({ title: 'Failed to load content', description: String(e?.message || e) })
      }
    }
    const t = setTimeout(load, 50)
    return () => clearTimeout(t)
  }, [docId, supabase, toast, isUuid])

  React.useEffect(() => {
    let disposed = false
    const attached: Array<{ ed: any; handler: () => void }> = []

    const scheduleSaveCombined = () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        try {
          // Non-UUID ids: persist only locally
          if (!isUuid) {
            try {
              const w: any = window
              const manuscript = w.manuscriptEditor ? w.manuscriptEditor.getJSON() : undefined
              const framework = w.frameworkEditor ? w.frameworkEditor.getJSON() : undefined
              const combined = framework || manuscript ? { mode: 'dual', manuscript, framework } : (w.activeEditor?.getJSON?.() || null)
              if (combined) localStorage.setItem(`sw-doc-${docId}`, JSON.stringify(combined))
            } catch {}
            return
          }
          const w: any = window
          const manuscript = w.manuscriptEditor ? w.manuscriptEditor.getJSON() : undefined
          const framework = w.frameworkEditor ? w.frameworkEditor.getJSON() : undefined
          const combined = framework || manuscript ? { mode: 'dual', manuscript, framework } : (w.activeEditor?.getJSON?.() || null)
          
          console.log('WriterPage: Autosave starting', { 
            docId,
            hasManuscriptEditor: !!w.manuscriptEditor,
            hasFrameworkEditor: !!w.frameworkEditor,
            hasActiveEditor: !!w.activeEditor,
            manuscriptContent: manuscript ? 'present' : 'null',
            frameworkContent: framework ? 'present' : 'null',
            combinedContent: combined ? 'present' : 'null'
          })
          
          const payload = { content: JSON.stringify(combined), manuscript_content: manuscript ?? null, framework_content: framework ?? null, manuscript_updated_at: new Date().toISOString(), framework_updated_at: new Date().toISOString() }
          const payloadLegacy = { content: JSON.stringify(combined) }
          
          console.log('WriterPage: Attempting autosave with payload', payload)
          
          // Prefer projects table to avoid documents 404 noise
          const { error: projErr } = await supabase
            .from('projects')
            .update(payload)
            .eq('id', docId)
          if (projErr) {
            console.log('WriterPage: Primary autosave failed', projErr)
            const status = (projErr as any)?.status
            const message = String((projErr as any)?.message || '')
            if (/column|does not exist|unknown/i.test(message)) {
              console.log('WriterPage: Trying legacy format autosave')
              // Remote DB not migrated: retry without new columns on projects
              const { error: projLegacyErr } = await supabase
                .from('projects')
                .update(payloadLegacy)
                .eq('id', docId)
              if (projLegacyErr) {
                console.error('WriterPage: Legacy autosave failed', projLegacyErr)
                throw projLegacyErr
              } else {
                console.log('WriterPage: Legacy autosave succeeded')
              }
            } else if (status === 404 || /route|relation|not found|does not exist/i.test(message)) {
              // No projects match; try documents table
              const { error: docErr } = await supabase
                .from('documents')
                .update(payload)
                .eq('id', docId)
              if (docErr) {
                const m = String((docErr as any)?.message || '')
                if (/column|does not exist|unknown/i.test(m)) {
                  const { error: docLegacyErr } = await supabase
                    .from('documents')
                    .update(payloadLegacy)
                    .eq('id', docId)
                  if (docLegacyErr) throw docLegacyErr
                } else {
                  throw docErr
                }
              }
            } else {
              throw projErr
            }
          } else {
            console.log('WriterPage: Primary autosave succeeded')
          }
        } catch (e: any) {
          toast({ title: 'Autosave failed', description: String(e?.message || e) })
        }
      }, 800)
    }

    const tryAttach = () => {
      if (disposed) return
      const w: any = window
      const candidates = [w.activeEditor, w.manuscriptEditor, w.frameworkEditor, w.editor].filter(Boolean)
      for (const ed of candidates) {
        if (attached.some(a => a.ed === ed)) continue
        const handler = () => { try { scheduleSaveCombined() } catch {} }
        try { ed.on('update', handler) } catch {}
        attached.push({ ed, handler })
      }
      // Keep polling in case editors become available later (e.g., framework editor)
      setTimeout(tryAttach, 250)
    }

    tryAttach()
    return () => {
      disposed = true
      if (saveTimer.current) clearTimeout(saveTimer.current)
      for (const { ed, handler } of attached) {
        try { ed.off('update', handler) } catch {}
      }
    }
  }, [docId, supabase, toast, isUuid])

  return (
    <div className="h-[calc(100vh-56px)]">
        <BlockEditor
          ydoc={ydoc}
          provider={provider}
          frameworkYdoc={frameworkYdoc}
          frameworkProvider={frameworkProvider}
          user={user}
          mode="dual"
          enableFrameworkEditor
          showSurfaceSwitcher
        />
    </div>
  )
}


