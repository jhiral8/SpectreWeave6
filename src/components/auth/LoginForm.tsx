'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button/Button'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams?.get('next') || '/portal/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const supabase = createClient()

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })

        if (error) throw error

        if (data?.user && !data?.session) {
          setMessage('Check your email for the confirmation link!')
        } else if (data?.session) {
          router.push(nextPath)
          router.refresh()
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        router.push(nextPath)
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <form 
      className="space-y-5"
      onSubmit={handleAuth}
      aria-labelledby="auth-heading"
      noValidate
    >
      <h2 id="auth-heading" className="sr-only">
        {isSignUp ? 'Sign up form' : 'Sign in form'}
      </h2>

      <fieldset className="space-y-3" disabled={loading}>
        <legend className="sr-only">Account credentials</legend>

        <div>
          <label htmlFor="email" className="sr-only">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-md border border-[--border] bg-[--card] text-[--card-foreground] px-3 py-2 placeholder-neutral-500 dark:placeholder-neutral-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[--ring] sm:text-sm"
            placeholder="Email address"
            aria-describedby={error ? 'auth-error' : undefined}
            aria-invalid={error ? 'true' : 'false'}
          />
        </div>

        <div>
          <label htmlFor="password" className="sr-only">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-md border border-[--border] bg-[--card] text-[--card-foreground] px-3 py-2 placeholder-neutral-500 dark:placeholder-neutral-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[--ring] sm:text-sm"
            placeholder="Password"
            aria-describedby={error ? 'auth-error' : undefined}
            aria-invalid={error ? 'true' : 'false'}
          />
        </div>
      </fieldset>

      {error && (
        <div 
          id="auth-error"
          role="alert"
          aria-live="polite"
          className="rounded-md bg-red-50 dark:bg-red-900/20 p-3"
        >
          <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
        </div>
      )}

      {message && (
        <div role="status" aria-live="polite" className="rounded-md bg-green-50 dark:bg-green-900/20 p-3">
          <div className="text-sm text-green-800 dark:text-green-200">{message}</div>
        </div>
      )}

      <div className="space-y-3">
        <Button
          type="submit"
          disabled={loading}
          className="w-full"
          variant="primary"
          aria-describedby={loading ? 'loading-status' : undefined}
        >
          {loading ? (
            <>
              <span aria-hidden="true">Loading...</span>
              <span id="loading-status" className="sr-only">
                {isSignUp ? 'Creating your account' : 'Signing you in'}
              </span>
            </>
          ) : (
            isSignUp ? 'Sign up' : 'Sign in'
          )}
        </Button>

        <div className="relative" role="separator" aria-label="Or continue with social login">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-300 dark:border-neutral-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[--background] px-2 text-neutral-500 dark:text-neutral-400">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full"
          variant="secondary"
          aria-label="Sign in with Google"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>
        <div className="text-center">
          <Link href={nextPath} className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline underline-offset-4">
            Back to portal
          </Link>
        </div>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black rounded-md px-2 py-1"
          aria-label={isSignUp 
            ? 'Switch to sign in if you already have an account' 
            : 'Switch to sign up if you need to create an account'
          }
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </form>
  )
}