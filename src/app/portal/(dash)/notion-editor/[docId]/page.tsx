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

// Dynamic import of the new Notion-style editor
const NotionEditor = dynamic(() => import('@/components/NotionEditor/NotionEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full grid place-items-center">
      <LogoLoader message="Preparing Notion-style editor…" />
    </div>
  ),
})

export default function NotionEditorPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = React.use(params)
  const [user, setUser] = React.useState<User | null>(null)
  const supabase = React.useMemo(() => createClient(), [])
  const toast = useToast()
  const isUuid = React.useMemo(() => /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(docId), [docId])

  // Y.js document for collaboration
  const ydoc = React.useMemo(() => new YDoc(), [])
  const provider = null as TiptapCollabProvider | null // Collaboration disabled for now
  const saveTimer = React.useRef<NodeJS.Timeout | null>(null)

  // Purge any non-UUID local drafts
  React.useEffect(() => {
    try {
      const UUID_RE = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i
      const toRemove: string[] = []
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (!key) continue
        if (key.startsWith('sw-notion-doc-')) {
          const id = key.substring('sw-notion-doc-'.length)
          if (!UUID_RE.test(id)) toRemove.push(key)
        }
      }
      toRemove.forEach((k) => localStorage.removeItem(k))
    } catch {}
  }, [])

  // Get user authentication
  React.useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    run()
  }, [supabase])

  // Load document content
  React.useEffect(() => {
    const load = async () => {
      try {
        // Non-UUID ids: use localStorage only
        if (!isUuid) {
          const getEditor = (): Promise<any> => new Promise(resolve => {
            const tick = () => {
              const ed = (window as any).notionEditor || (window as any).activeEditor
              if (ed) return resolve(ed)
              setTimeout(tick, 120)
            }
            tick()
          })
          const ed: any = await getEditor()
          const local = typeof window !== 'undefined' ? localStorage.getItem(`sw-notion-doc-${docId}`) : null
          const incoming = local ? JSON.parse(local) : emptyContent
          try {
            ed.commands.setContent(incoming)
          } catch {
            ed.commands.setContent(incoming)
          }
          return
        }

        // Load from database for UUID documents
        let data: any
        let error: any
        try {
          const res = await supabase
            .from('projects')
            .select('content,notion_content,title,version')
            .eq('id', docId)
            .single()
          data = res.data
          error = res.error
        } catch (e: any) {
          error = e
        }

        // Fallback to legacy content if new columns don't exist
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
                title: 'Untitled Notion Document',
                user_id: userId,
                status: 'draft',
                archived: false,
              })
              if (!insertError) {
                ;(window as any).__sw_fallback_project = { title: 'Untitled Notion Document' }
              }
            }
          } else {
            throw error
          }
        }

        const w = window as any
        const fallback = w.__sw_fallback_project

        // Expose document meta for the portal header
        w.swDocMeta = {
          title: (data?.title || fallback?.title || 'Untitled Notion Document'),
          version: data?.version || 'v0.1.0',
        }
        try {
          window.dispatchEvent(new CustomEvent('sw:doc-meta', { detail: w.swDocMeta }))
        } catch {}

        // Wait for notion editor to be ready
        const waitForEditor = (): Promise<any> => new Promise(resolve => {
          const check = () => {
            const notionEditor = (window as any).notionEditor
            if (notionEditor) return resolve(notionEditor)
            setTimeout(check, 120)
          }
          check()
        })

        // Load content into editor
        const incomingContent = data?.notion_content || data?.content
        if (incomingContent) {
          const editor = await waitForEditor()
          let parsed: any = incomingContent
          try {
            if (typeof parsed === 'string') parsed = JSON.parse(parsed)
          } catch {}

          const looksLikeDoc = parsed && typeof parsed === 'object' && (parsed.type === 'doc' || Array.isArray(parsed.content))
          if (looksLikeDoc) {
            try {
              editor.commands.setContent(parsed)
            } catch {
              editor.commands.setContent(parsed)
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

  // Autosave functionality
  React.useEffect(() => {
    let disposed = false

    const scheduleSave = () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        try {
          // Non-UUID ids: persist only locally
          if (!isUuid) {
            try {
              const w: any = window
              const content = w.notionEditor ? w.notionEditor.getJSON() : null
              if (content) {
                localStorage.setItem(`sw-notion-doc-${docId}`, JSON.stringify(content))
              }
            } catch {}
            return
          }

          const w: any = window
          const content = w.notionEditor ? w.notionEditor.getJSON() : null

          console.log('NotionEditorPage: Autosave starting', {
            docId,
            hasNotionEditor: !!w.notionEditor,
            content: content ? 'present' : 'null'
          })

          const payload = {
            content: JSON.stringify(content),
            notion_content: content,
            updated_at: new Date().toISOString()
          }
          const payloadLegacy = { content: JSON.stringify(content) }

          console.log('NotionEditorPage: Attempting autosave with payload', payload)

          // Save to projects table
          const { error: projErr } = await supabase
            .from('projects')
            .update(payload)
            .eq('id', docId)

          if (projErr) {
            console.log('NotionEditorPage: Primary autosave failed', projErr)
            const message = String((projErr as any)?.message || '')
            if (/column|does not exist|unknown/i.test(message)) {
              console.log('NotionEditorPage: Trying legacy format autosave')
              const { error: projLegacyErr } = await supabase
                .from('projects')
                .update(payloadLegacy)
                .eq('id', docId)
              if (projLegacyErr) {
                console.error('NotionEditorPage: Legacy autosave failed', projLegacyErr)
                throw projLegacyErr
              } else {
                console.log('NotionEditorPage: Legacy autosave succeeded')
              }
            } else {
              throw projErr
            }
          } else {
            console.log('NotionEditorPage: Primary autosave succeeded')
          }
        } catch (e: any) {
          toast({ title: 'Autosave failed', description: String(e?.message || e) })
        }
      }, 800)
    }

    const tryAttach = () => {
      if (disposed) return
      const w: any = window
      const editor = w.notionEditor
      if (editor && !editor._saveHandlerAttached) {
        const handler = () => {
          try {
            scheduleSave()
          } catch {}
        }
        try {
          editor.on('update', handler)
          editor._saveHandlerAttached = true
        } catch {}
      }
      setTimeout(tryAttach, 250)
    }

    tryAttach()
    return () => {
      disposed = true
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [docId, supabase, toast, isUuid])

  return (
    <div className="h-[calc(100vh-56px)]">
      <NotionEditor
        ydoc={ydoc}
        provider={provider}
        user={user}
        docId={docId}
      />
    </div>
  )
}