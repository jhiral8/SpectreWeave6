"use client"

import * as React from 'react'
import dynamic from 'next/dynamic'
import { Doc as YDoc } from 'yjs'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useToast } from '@/components/portal/ui/toast'
import { emptyContent } from '@/lib/data/emptyContent'

const BlockEditor = dynamic(() => import('@/components/BlockEditor/BlockEditor'), { ssr: false })

export default function Page({ params }: { params: { projectId: string; docId: string } }) {
  const { docId } = params
  const [user, setUser] = React.useState<User | null>(null)
  const supabase = React.useMemo(() => createClient(), [])
  const toast = useToast()
  const ydoc = React.useMemo(() => new YDoc(), [])
  const provider = null as TiptapCollabProvider | null
  const saveTimer = React.useRef<NodeJS.Timeout | null>(null)

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
        const { data, error } = await supabase
          .from('documents')
          .select('content,title,version')
          .eq('id', docId)
          .single()
        if (error) {
          const status = (error as any)?.status
          const message = String((error as any)?.message || '')
          if (status === 404 || /route|relation|not found|does not exist/i.test(message)) {
            const { data: proj, error: projErr } = await supabase
              .from('projects')
              .select('content,title')
              .eq('id', docId)
              .single()
            if (projErr) {
              const { data: auth } = await supabase.auth.getUser()
              const userId = auth?.user?.id
              if (userId) {
                const { error: insertError } = await supabase.from('projects').insert({
                  id: docId,
                  title: 'Untitled Document',
                  user_id: userId,
                  status: 'draft',
                  archived: false,
                  content: JSON.stringify(emptyContent),
                })
                if (insertError) throw insertError
              }
            } else {
              ;(window as any).__sw_fallback_project = proj
            }
          } else {
            throw error
          }
        }
        const w = window as any
        w.swDocMeta = {
          title: data?.title || 'Untitled Document',
          version: data?.version || 'v0.1.0',
        }
        try { window.dispatchEvent(new CustomEvent('sw:doc-meta', { detail: w.swDocMeta })) } catch {}

        const waitForEditor = (): Promise<any> => new Promise(resolve => {
          const check = () => {
            const ed = (window as any).activeEditor || (window as any).manuscriptEditor || (window as any).editor
            if (ed) return resolve(ed)
            setTimeout(check, 120)
          }
          check()
        })

        const fallback = (window as any).__sw_fallback_project
        const incomingContent = fallback ? fallback.content : data?.content
        if (incomingContent) {
          const ed: any = await waitForEditor()
          try {
            ed.commands.setContent(typeof incomingContent === 'string' ? JSON.parse(incomingContent) : incomingContent)
          } catch {
            ed.commands.setContent(incomingContent)
          }
        }
      } catch (e: any) {
        toast({ title: 'Failed to load content', description: String(e?.message || e) })
      }
    }
    const t = setTimeout(load, 50)
    return () => clearTimeout(t)
  }, [docId, supabase, toast])

  React.useEffect(() => {
    let disposed = false
    const attached: Array<{ ed: any; handler: () => void }> = []

    const scheduleSave = (json: any) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        try {
          const payload = { content: JSON.stringify(json) }
          const { error: projErr } = await supabase
            .from('projects')
            .update(payload)
            .eq('id', docId)
          if (projErr) {
            const status = (projErr as any)?.status
            const message = String((projErr as any)?.message || '')
            if (status === 404 || /route|relation|not found|does not exist/i.test(message)) {
              const { error: docErr } = await supabase
                .from('documents')
                .update(payload)
                .eq('id', docId)
              if (docErr) throw docErr
            } else {
              throw projErr
            }
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
        const handler = () => {
          try {
            const json = ed.getJSON()
            scheduleSave(json)
          } catch {}
        }
        try { ed.on('update', handler) } catch {}
        attached.push({ ed, handler })
      }
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
  }, [docId, supabase, toast])

  return (
    <div className="h-[calc(100vh-56px)]">
      <BlockEditor ydoc={ydoc} provider={provider} hasCollab={false} user={user} />
    </div>
  )
}


