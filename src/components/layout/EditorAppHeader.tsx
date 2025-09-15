'use client'

import { Icon } from '@/components/ui/Icon'
import { Toolbar } from '@/components/ui/Toolbar'
import IconAuthButton from '@/components/auth/IconAuthButton'
import { WebSocketStatus } from '@hocuspocus/provider'
import { EditorUser } from '@/components/BlockEditor/types'
import { User } from '@supabase/supabase-js'

export type EditorAppHeaderProps = {
  user: User | null
  isSidebarOpen?: boolean
  toggleSidebar?: () => void
  characters?: number
  words?: number
  collabState?: WebSocketStatus
  users?: EditorUser[]
}

export const EditorAppHeader = ({
  user,
  characters = 0,
  collabState = 'disconnected',
  users = [],
  words = 0,
  isSidebarOpen,
  toggleSidebar,
}: EditorAppHeaderProps) => {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-x-4">
          {toggleSidebar && (
            <Toolbar.Button
              tooltip={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              onClick={toggleSidebar}
              active={isSidebarOpen}
              className={isSidebarOpen ? 'bg-transparent' : ''}
            >
              <Icon name={isSidebarOpen ? 'PanelLeftClose' : 'PanelLeft'} />
            </Toolbar.Button>
          )}
          <h1 className="text-lg font-semibold">SpectreWeave</h1>
          {/* Document stats and connection status moved to center */}
          <div className="flex items-center gap-x-2 sm:gap-x-4 ml-2 sm:ml-4">
            <div className="hidden sm:block text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {words} {words === 1 ? 'word' : 'words'}
            </div>
            <div className="hidden sm:block text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {characters} {characters === 1 ? 'character' : 'characters'}
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  collabState === 'connecting' ? 'bg-yellow-500 dark:bg-yellow-400' :
                  collabState === 'connected' ? 'bg-green-500 dark:bg-green-400' :
                  'bg-red-500 dark:bg-red-400'
                }`}
              />
              <span className="hidden sm:inline text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                {collabState === 'connecting' ? 'Connecting' :
                 collabState === 'connected' ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        {/* User profile and sign out icons aligned to the right */}
        <IconAuthButton user={user} />
      </div>
    </header>
  )
}