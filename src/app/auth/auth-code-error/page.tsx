import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
          Authentication Error
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Sorry, we couldn't complete your authentication. Please try again.
        </p>
        <Link href="/login">
          <Button variant="primary">
            Back to Login
          </Button>
        </Link>
      </div>
    </div>
  )
}