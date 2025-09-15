'use client'

import { TiptapCollabProvider } from '@hocuspocus/provider'
import 'iframe-resizer/js/iframeResizer.contentWindow'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Doc as YDoc } from 'yjs'
import { BlockEditor } from '@/components/BlockEditor'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { AIProvider } from '@/contexts/AIContext'


export default function Document({ params }: { params: { room: string } }) {
  const [provider, setProvider] = useState<TiptapCollabProvider | null>(null)
  const [collabToken, setCollabToken] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const searchParams = useSearchParams()

  const hasCollab = parseInt(searchParams.get('noCollab') as string) !== 1

  const { room } = params

  useEffect(() => {
    setMounted(true)
    
    // Get current user
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    
    getUser()
  }, [])

  useEffect(() => {
    // fetch data
    const dataFetch = async () => {
      const data = await (
        await fetch('/api/collaboration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      ).json()

      const { token } = data

      // set state when the data received
      setCollabToken(token)
    }

    dataFetch()
  }, [])

  const ydoc = useMemo(() => new YDoc(), [])
  const frameworkYdoc = useMemo(() => new YDoc(), [])

  useLayoutEffect(() => {
    if (hasCollab && collabToken) {
      // For now, disable external collaboration and use local-only
      // This prevents connection to TipTap Cloud
      setProvider(null)
    }
  }, [setProvider, collabToken, ydoc, room, hasCollab])

  // Skip collaboration check for now - use local editor only
  // if (hasCollab && (!collabToken || !provider)) return


  if (!mounted) {
    return <div className="flex items-center justify-center h-screen">Loading editor...</div>
  }

  return (
    <div className="h-full bg-white dark:bg-black">
      <AIProvider>
        <BlockEditor ydoc={ydoc} frameworkYdoc={frameworkYdoc} provider={provider} user={user} mode="dual" />
      </AIProvider>
    </div>
  )
}
