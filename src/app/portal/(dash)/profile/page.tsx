'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types/database'

export default function ProfilePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not signed in')
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (error) setError(error.message)
      setProfile(data as any)
      setLoading(false)
    }
    run()
  }, [])

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="font-heading text-xl">Profile</h2>
      {loading ? (
        <p className="mt-4 text-sm text-[--muted-foreground]">Loading…</p>
      ) : error ? (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      ) : profile ? (
        <div className="mt-4 grid gap-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="text-xs text-[--muted-foreground]">Email</label>
              <div className="rounded-md border border-[--border] p-2 text-sm">{profile.email}</div>
            </div>
            <div>
              <label className="text-xs text-[--muted-foreground]">Full name</label>
              <div className="rounded-md border border-[--border] p-2 text-sm">{profile.full_name || '—'}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="text-xs text-[--muted-foreground]">Subscription</label>
              <div className="rounded-md border border-[--border] p-2 text-sm">{profile.subscription_tier || 'free'}</div>
            </div>
            <div>
              <label className="text-xs text-[--muted-foreground]">Updated</label>
              <div className="rounded-md border border-[--border] p-2 text-sm">{new Date(profile.updated_at).toLocaleString()}</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}


