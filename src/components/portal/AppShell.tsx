"use client";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/portal/utils";
import type { ComponentType } from "react";
import { LayoutDashboard, Bot, Folder, Settings, BarChart3, Menu, ChevronLeft, MessageSquare, List, LogOut, Baby, Image as ImageIcon, GitBranch } from "lucide-react";
import { ThemeToggle } from "@/components/portal/ThemeToggle";
import { BridgeStatus } from "@/components/portal/BridgeStatus";
import { CommandPalette } from "@/components/portal/CommandPalette";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

// Enhanced navigation items with conditional children's book features
const getNavItems = (showChildrensBookFeatures: boolean = true): NavItem[] => {
  const baseItems = [
    { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/portal/projects", icon: Folder },
    { label: "Agents", href: "/portal/agents", icon: Bot },
    { label: "Workflows", href: "/portal/workflows", icon: GitBranch },
    { label: "Analytics", href: "/portal/analytics", icon: BarChart3 },
  ]

  if (showChildrensBookFeatures) {
    baseItems.splice(2, 0, // Insert after Projects, before Agents
      { label: "Book Creator", href: "/portal/book-creator", icon: Baby },
      { label: "Gallery", href: "/portal/gallery", icon: ImageIcon }
    )
  }

  return [
    ...baseItems,
    { label: "Generations", href: "/portal/generations", icon: List },
    { label: "Settings", href: "/portal/settings", icon: Settings },
  ]
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWriter = pathname?.startsWith('/portal/writer/');
  const isDashboard = pathname === '/portal/dashboard';
  const isProjects = pathname === '/portal/projects';
  const isBookCreator = pathname?.startsWith('/portal/book-creator');
  const isGallery = pathname === '/portal/gallery';
  const [collapsed, setCollapsed] = React.useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = React.useState<number>(200);
  const [user, setUser] = React.useState<User | null>(null);
  const [words, setWords] = React.useState<number>(0);
  const [chars, setChars] = React.useState<number>(0);
  const [aiOpen, setAiOpen] = React.useState<boolean>(false);
  const [ghostEnabled, setGhostEnabled] = React.useState<boolean>(true);
  const [ghostSentences, setGhostSentences] = React.useState<1 | 2 | 3>(3);
  const [docTitle, setDocTitle] = React.useState<string | null>(null);
  const [docVersion, setDocVersion] = React.useState<string | null>(null);
  const supabase = React.useMemo(() => createClient(), []);
  const minWidth = 160;
  const maxWidth = 360;
  const effectiveLeft = collapsed ? 56 : Math.min(Math.max(sidebarWidth, minWidth), maxWidth);
  const contentPaddingLeft = collapsed ? 56 : Math.min(Math.max(sidebarWidth, minWidth), maxWidth);

  React.useEffect(() => {
    // hydrate persisted prefs
    try {
      const c = localStorage.getItem("sw5-collapsed");
      if (c === "1" || c === "0") setCollapsed(c === "1");
      const s = localStorage.getItem("sw5-sidebar-width");
      const v = s ? parseInt(s, 10) : NaN;
      if (Number.isFinite(v)) setSidebarWidth(v as number);
    } catch {}
  }, []);

  React.useEffect(() => {
    const run = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user ?? null);
      } catch {}
    };
    run();
  }, [supabase]);

  React.useEffect(() => {
    if (!pathname?.startsWith('/portal/writer/')) { setDocTitle(null); setDocVersion(null); return }
    const syncFromWindow = () => {
      try {
        const meta: any = (window as any).swDocMeta
        if (meta?.title) setDocTitle(meta.title)
        if (meta?.version) setDocVersion(meta.version)
      } catch {}
    }
    const onMeta = (e: any) => {
      try {
        if (e?.detail?.title) setDocTitle(e.detail.title)
        if (e?.detail?.version) setDocVersion(e.detail.version)
      } catch {}
    }
    syncFromWindow()
    window.addEventListener('sw:doc-meta', onMeta)
    return () => window.removeEventListener('sw:doc-meta', onMeta)
  }, [pathname])

  const profileInitials = React.useMemo(() => {
    if (!user) return "?";
    const name: string | undefined = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string);
    const email: string | undefined = user.email || undefined;
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(/\s+/);
      const first = parts[0]?.charAt(0) ?? "";
      const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) ?? "" : "";
      return (first + last).toUpperCase() || first.toUpperCase();
    }
    if (email && email.length > 0) {
      return email.charAt(0).toUpperCase();
    }
    return "?";
  }, [user]);

  React.useEffect(() => {
    try { localStorage.setItem("sw5-collapsed", collapsed ? "1" : "0"); } catch {}
  }, [collapsed]);

  // Periodically read counts and AI chat state from active editor on writer pages
  React.useEffect(() => {
    if (!pathname?.startsWith('/portal/writer/')) return
    let timer: any = null
    const tick = () => {
      try {
        const w: any = window as any
        const ed = w.activeEditor || w.manuscriptEditor || w.editor
        if (ed?.storage?.characterCount) {
          try { setWords(ed.storage.characterCount.words() ?? 0) } catch {}
          try { setChars(ed.storage.characterCount.characters() ?? 0) } catch {}
        }
        setAiOpen(!!w.swAIChatIsOpen)
        // Read ghost settings from window (if editor exposed them)
        try {
          if (typeof w.swGhostGetEnabled === 'function') {
            const enabled = !!w.swGhostGetEnabled()
            setGhostEnabled(prev => prev !== enabled ? enabled : prev)
          }
          if (typeof w.swGhostGetPlanCount === 'function') {
            const pc = w.swGhostGetPlanCount()
            if (pc === 1 || pc === 2 || pc === 3) {
              setGhostSentences(prev => prev !== pc ? pc : prev)
            }
          }
        } catch {}
      } catch {}
      timer = setTimeout(tick, 800)
    }
    tick()
    return () => { if (timer) clearTimeout(timer) }
  }, [pathname])

  const handleToggleAI = React.useCallback(() => {
    try {
      const w: any = window as any
      if (typeof w.swToggleAIChat === 'function') {
        w.swToggleAIChat()
        setAiOpen((v) => !v)
      }
    } catch {}
  }, [])

  const toggleGhostEnabled = React.useCallback(() => {
    try {
      const w: any = window as any
      if (typeof w.swGhostSetEnabled === 'function' && typeof w.swGhostGetEnabled === 'function') {
        // Get current state and toggle it
        const currentState = !!w.swGhostGetEnabled()
        const newState = !currentState
        
        // Set the new state
        w.swGhostSetEnabled(newState)
        
        // Update local state immediately
        setGhostEnabled(newState)
        
        // Verify it worked after a short delay
        setTimeout(() => {
          const verifyState = !!w.swGhostGetEnabled()
          setGhostEnabled(verifyState)
        }, 100)
      }
    } catch (error) {
      console.error('Toggle ghost failed:', error)
    }
  }, [])

  const cycleGhostSentences = React.useCallback(() => {
    setGhostSentences((v) => {
      const next = (v === 3 ? 1 : (v + 1)) as 1 | 2 | 3
      try {
        const w: any = window as any
        if (typeof w.swGhostSetPlanCount === 'function') { w.swGhostSetPlanCount(next) }
      } catch {}
      return next
    })
  }, [])


  return (
    <div
      className="h-screen grid grid-cols-1 grid-rows-[56px_1fr] transition-[grid-template-columns] duration-200"
      style={{ gridTemplateColumns: `minmax(56px, ${effectiveLeft}px) 1fr` }}
    >
      {/* Top Bar */}
      <header className="md:col-span-2 h-14 flex items-center justify-between px-4 border-b border-[--border] bg-[--background]/80 backdrop-blur sticky top-0 z-40 relative">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Portal sidebar collapse toggle - SpectreWeave logo */}
          <button aria-label="Toggle portal sidebar" onClick={() => setCollapsed((v) => !v)} className="rounded-md p-1 hover:bg-white/5">
            <Image
              src="/images/SpectreWeaveLogo.png"
              alt="SpectreWeave"
              width={22}
              height={22}
              style={{ width: 'auto', height: 'auto' }}
              className="inline-block"
              priority
            />
          </button>
          <Link href="/portal/dashboard" className="font-heading text-lg tracking-tight bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] bg-clip-text text-transparent">
            SpectreWeave
          </Link>
          {pathname?.startsWith('/portal/writer/') && (
            <button aria-label="Toggle document sidebar" onClick={() => {
              try {
                const w: any = window as any
                if (typeof w.swToggleDocSidebar === 'function') { w.swToggleDocSidebar() }
              } catch {}
            }} className="rounded-md p-1 hover:bg-white/5 ml-1">
              <List className="h-4 w-4" />
            </button>
          )}
        </div>
        {pathname?.startsWith('/portal/writer/') && (
          <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none hidden xs:flex items-center gap-1 min-w-0">
            <div className="text-xs sm:text-sm text-[--muted-foreground] truncate max-w-[60vw] flex items-center gap-1 sm:gap-2">
              <span className="font-medium line-clamp-1">{docTitle || 'Untitled Document'}</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden sm:inline font-mono text-[10px] sm:text-xs">{docVersion || 'v0.1.0'}</span>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          {/* Counts shown only on writer route */}
          {pathname?.startsWith('/portal/writer/') && (
            <div className="hidden sm:flex items-center gap-3 text-xs text-[--muted-foreground]">
              <span className="rounded-md border border-[--border] px-2 py-1 bg-[--card]/60 text-[--card-foreground]">{words.toLocaleString()} words</span>
            </div>
          )}
          {/* Quick Ghost settings (writer route only) */}
          {pathname?.startsWith('/portal/writer/') && (
            <div className="hidden md:flex items-center gap-2">
              <div className="inline-flex items-center gap-2 h-9 px-2 rounded-md border border-[--border] bg-white/5">
                <span className="text-[10px] uppercase tracking-wide text-[--foreground]">Ghost</span>
                <button
                  onClick={toggleGhostEnabled}
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 ${
                    ghostEnabled ? 'bg-emerald-500' : 'bg-neutral-400'
                  }`}
                  title={ghostEnabled ? 'Disable ghost completions' : 'Enable ghost completions'}
                  aria-label="Toggle ghost completions"
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
                      ghostEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <button
                onClick={cycleGhostSentences}
                className="inline-flex items-center gap-1 h-9 px-2 rounded-md border border-[--border] hover:bg-white/5 text-[--foreground]/80"
                title="Cycle plan sentences (1-3)"
                aria-label="Cycle plan sentences"
              >
                <span className="text-[10px] uppercase tracking-wide">Plan</span>
                <span className="text-[10px] font-mono">x{ghostSentences}</span>
              </button>
            </div>
          )}
          <BridgeStatus />
          {/* AI chat toggle */}
          {pathname?.startsWith('/portal/writer/') && (
            <button
              onClick={handleToggleAI}
              className={`inline-flex items-center justify-center h-9 w-9 rounded-md border border-[--border] ${aiOpen ? 'bg-white/10 text-[--foreground]' : 'hover:bg-white/5 text-[--foreground]/80'}`}
              title={aiOpen ? 'Close AI chat' : 'Open AI chat'}
              aria-label="Toggle AI chat"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          )}
          <CommandPalette />
          {/* Logout moved to sidebar footer near profile */}
        </div>
      </header>

      {/* Sidebar */}
      {collapsed ? (
        <aside className="hidden md:flex col-start-1 row-start-2 sticky top-14 h-[calc(100vh-56px)] border-r border-[--border] bg-[--background] w-full flex-col items-center gap-2 py-2 overflow-y-auto">
          {getNavItems().map((item) => {
            const Icon = item.icon as any;
            const active = pathname?.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn("flex h-10 w-10 items-center justify-center rounded-md", active ? "bg-white/10 text-[--foreground]" : "hover:bg-white/5 text-[--foreground]/80")} aria-label={item.label}>
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
          <div className="mt-auto flex flex-col items-center gap-2 pt-2 border-t border-[--border] w-full">
            <ThemeToggle />
            <Link href="/portal/profile" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/5 text-[--foreground]" aria-label="Profile">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                {profileInitials}
              </div>
            </Link>
            <button
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                  if (typeof window !== 'undefined') {
                    window.location.href = '/portal/login';
                  }
                } catch (e) {
                  console.error('Logout failed', e);
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/5 text-[--foreground]"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </aside>
      ) : (
        <aside className="hidden md:block col-start-1 row-start-2 sticky top-14 h-[calc(100vh-56px)] border-r border-[--border] bg-[--background] relative overflow-y-auto">
          <nav className="p-2 space-y-1 pr-3">
            {getNavItems().map((item) => {
              const Icon = item.icon as any;
              const active = pathname?.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-sm", active ? "bg-white/10 text-[--foreground]" : "hover:bg-white/5 text-[--foreground]/80") }>
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="absolute left-0 right-1 bottom-0 p-2 border-t border-[--border] bg-[--background] space-y-2">
            <div className="px-2">
              <ThemeToggle />
            </div>
            <Link href="/portal/profile" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-white/5 text-[--foreground]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                {profileInitials}
              </div>
              <span>Profile</span>
            </Link>
            <button
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                  if (typeof window !== 'undefined') {
                    window.location.href = '/portal/login';
                  }
                } catch (e) {
                  console.error('Logout failed', e);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-white/5 text-[--foreground] w-full"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
          <div
            role="separator"
            aria-orientation="vertical"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = effectiveLeft;
              const onMove = (ev: MouseEvent) => {
                const dx = ev.clientX - startX;
                const next = Math.min(Math.max(startWidth + dx, minWidth), maxWidth);
                setSidebarWidth(next);
              };
              const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
                try { localStorage.setItem("sw5-sidebar-width", String(Math.min(Math.max(sidebarWidth, minWidth), maxWidth))); } catch {}
              };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp, { once: true });
            }}
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/20"
          />
        </aside>
      )}

      {/* Main */}
      <main
        className={`${
          isWriter || isDashboard || isProjects || isBookCreator || isGallery
            ? 'p-0'
            : 'p-4 sm:p-6 overflow-y-auto h-full'
        } col-start-2 row-start-2 min-w-0 min-h-0`}
      >
        {children}
      </main>
    </div>
  );
}


