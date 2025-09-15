'use client'

import React from 'react'
import { User } from '@supabase/supabase-js'
import { Sidebar, Home, FolderOpen, Settings, HelpCircle, User as UserIcon, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/avatar'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import SpectreWeaveLogo from '@/components/ui/SpectreWeaveLogo'
import ThemeSwitcher from '@/components/ui/ThemeSwitcher'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  user: User
  children: React.ReactNode
  sidebarOpen?: boolean
  onSidebarToggle?: () => void
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  current?: boolean
  count?: number
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, current: true },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderOpen, current: false },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, current: false },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle, current: false },
]

export function DashboardLayout({ 
  user, 
  children, 
  sidebarOpen = false,
  onSidebarToggle 
}: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)
  
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const userMenuItems = [
    {
      label: 'Profile',
      icon: UserIcon,
      onClick: () => console.log('Navigate to profile'),
    },
    {
      label: 'Settings', 
      icon: Settings,
      onClick: () => console.log('Navigate to settings'),
    },
    {
      type: 'separator' as const,
    },
    {
      label: 'Sign Out',
      icon: LogOut,
      onClick: handleSignOut,
      variant: 'destructive' as const,
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden" 
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside 
        className={cn(
          'fixed left-0 top-0 z-40 h-full w-64 transform border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black transition-transform duration-300 ease-in-out',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b border-neutral-200 dark:border-neutral-800">
            <SpectreWeaveLogo 
              size="sm" 
              showText={true}
              onClick={() => window.location.href = '/dashboard'}
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    item.current
                      ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white ai-manuscript-border'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 hover:text-neutral-900 dark:hover:text-white'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                  {item.count && (
                    <span className="ml-auto inline-block rounded-full bg-neutral-200 dark:bg-neutral-700 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-300">
                      {item.count}
                    </span>
                  )}
                </a>
              )
            })}
          </nav>

          {/* User profile */}
          <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
            <DropdownMenu
              trigger={
                <button className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
                  <Avatar
                    src={user.user_metadata?.avatar_url}
                    alt={user.user_metadata?.full_name || user.email || 'User'}
                    fallback={(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                    size="sm"
                  />
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                      {user.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </button>
              }
              items={userMenuItems}
              align="end"
            />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-black/95 backdrop-blur-sm px-4 sm:px-6">
          {/* Mobile sidebar toggle */}
          <Button
            variant="ghost"
            buttonSize="icon"
            className="lg:hidden mr-4"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Sidebar className="h-5 w-5" />
          </Button>

          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            buttonSize="icon"
            className="hidden lg:flex mr-4"
            onClick={onSidebarToggle}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Sidebar className="h-5 w-5" />
          </Button>

          {/* Breadcrumb */}
          <div className="flex-1">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <div>
                    <a href="/dashboard" className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300">
                      Dashboard
                    </a>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="h-5 w-5 flex-shrink-0 text-neutral-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 text-sm font-medium text-neutral-900 dark:text-white" aria-current="page">
                      Projects
                    </span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          {/* Search */}
          <div className="hidden sm:block w-96 mr-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <input
                type="search"
                placeholder="Search projects..."
                className="block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-2 pl-10 pr-3 text-sm placeholder-neutral-500 dark:placeholder-neutral-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Theme Switcher */}
          <ThemeSwitcher size="sm" className="mr-2" />
        </header>

        {/* Main content area */}
        <main className="flex-1 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout