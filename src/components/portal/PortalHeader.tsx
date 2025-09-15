'use client';

import React from 'react';
import { Search, Settings, User, Bell, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SpectreWeaveLogo from '@/components/ui/SpectreWeaveLogo'

interface PortalHeaderProps {
  userName?: string;
  userAvatar?: string;
  onSearch?: (query: string) => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
}

const PortalHeader: React.FC<PortalHeaderProps> = ({
  userName = 'User',
  userAvatar,
  onSearch,
  onSettingsClick,
  onProfileClick,
  onNotificationsClick
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const supabase = React.useMemo(() => createClient(), []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        window.location.href = '/portal/login';
      }
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header className="w-full bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-800/30 ai-neural-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title - vertically aligned */}
          <div className="flex items-center gap-3">
            <SpectreWeaveLogo size="md" showText={false} />
            <div className="flex flex-col leading-tight">
              <div className="text-2xl font-surgena text-white mt-[2px]">SpectreWeave</div>
              <div className="hidden md:block text-xs text-purple-200">Writing Portal</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-8">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects, documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-purple-700/30 rounded-lg text-white placeholder-purple-300/70 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 ai-confidence-border"
                />
              </div>
            </form>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button
              onClick={onNotificationsClick}
              className="p-2 text-purple-300 hover:text-white hover:bg-purple-800/30 rounded-lg transition-colors ai-data-flow"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* Settings */}
            <button
              onClick={onSettingsClick}
              className="p-2 text-purple-300 hover:text-white hover:bg-purple-800/30 rounded-lg transition-colors ai-data-flow"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User Profile */}
            <button
              onClick={onProfileClick}
              className="flex items-center space-x-3 p-2 text-purple-300 hover:text-white hover:bg-purple-800/30 rounded-lg transition-colors ai-data-flow"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full border-2 border-purple-500/30"
                />
              ) : (
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="hidden md:block font-surgena text-sm">
                {userName}
              </span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-purple-300 hover:text-white hover:bg-purple-800/30 rounded-lg transition-colors ai-data-flow"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export { PortalHeader };