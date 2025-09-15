'use client'

import React from 'react'

interface ClientOnlyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const ClientOnlyWrapper: React.FC<ClientOnlyWrapperProps> = ({ 
  children, 
  fallback = (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading...</p>
      </div>
    </div>
  )
}) => {
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export default ClientOnlyWrapper