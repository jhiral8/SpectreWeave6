"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type TabItem = { label: string; href: string };

export function TabbedNav({ tabs }: { tabs: TabItem[] }) {
  const pathname = usePathname();
  return (
    <div className="border-b border-[--border] mb-4 sticky top-14 z-30 bg-[--background]/80 backdrop-blur">
      <div className="flex gap-2 relative overflow-x-auto">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname?.startsWith(tab.href + "/") ||
            (tab.href.endsWith('/documents') && (pathname?.includes('/writer') || pathname?.includes('/editor-test')));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative px-3 py-2 text-sm -mb-px",
                active ? "text-[--foreground]" : "text-[--foreground]/70 hover:text-[--foreground]"
              )}
            >
              {tab.label}
              {active && (
                <span className="pointer-events-none absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-[linear-gradient(90deg,#8ec5ff,#b39fff,#ff9ecf)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}


