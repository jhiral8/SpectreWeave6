'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AuthButton({ user }: { user: any }) {
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
    <div className="flex items-center gap-4">
      <span className="text-sm text-neutral-600 dark:text-neutral-400">
        Hey, {user.email}!
      </span>
      <Button
        variant="secondary"
        onClick={handleSignOut}
        disabled={loading}
        buttonSize="small"
      >
        {loading ? 'Signing out...' : 'Sign out'}
      </Button>
    </div>
  ) : (
    <Button
      variant="primary"
      onClick={() => router.push('/login')}
      buttonSize="small"
    >
      Sign in
    </Button>
  )
}