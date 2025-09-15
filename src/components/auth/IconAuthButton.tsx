'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Toolbar } from '@/components/ui/Toolbar'

export default function IconAuthButton({ user }: { user: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    
    if (!error) {
      router.refresh()
    }
    setLoading(false)
  }

  return user ? (
    <div className="flex items-center gap-1 sm:gap-2">
      <Toolbar.Button
        tooltip={`Signed in as ${user.email}`}
        className="hover:bg-neutral-100 dark:hover:bg-neutral-800 p-2"
      >
        <Icon name="User" className="w-4 h-4" />
      </Toolbar.Button>
      <Toolbar.Button
        tooltip={loading ? 'Signing out...' : 'Sign out'}
        onClick={handleSignOut}
        disabled={loading}
        className="hover:bg-neutral-100 dark:hover:bg-neutral-800 p-2"
      >
        <Icon name={loading ? 'Loader2' : 'LogOut'} className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </Toolbar.Button>
    </div>
  ) : (
    <Toolbar.Button
      tooltip="Sign in"
      onClick={() => router.push('/login')}
      className="hover:bg-neutral-100 dark:hover:bg-neutral-800 p-2"
    >
      <Icon name="LogIn" className="w-4 h-4" />
    </Toolbar.Button>
  )
}