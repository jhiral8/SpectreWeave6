"use client";
import * as React from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
      if ((isMac && e.metaKey && e.key === "k") || (!isMac && e.ctrlKey && e.key === "k")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => { setOpen(false); router.push(href); };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-md border border-[--border] px-2 py-1 text-sm hover:bg-white/5">Cmd/Ctrl K</button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-4" onClick={() => setOpen(false)}>
          <Command.Dialog open={open} onOpenChange={setOpen} label="Search" className="w-full sm:max-w-xl rounded-lg border border-[--border] bg-[--background] text-[--foreground]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-[--border] px-3">
              <Command.Input placeholder="Type a command or search…" className="h-10 w-full bg-transparent outline-none" />
            </div>
            <Command.List className="max-h-80 overflow-auto p-1">
              <Command.Empty className="p-3 text-sm text-[--muted-foreground]">No results.</Command.Empty>
              <Command.Group heading="Navigate">
                {[
                  ["Dashboard", "/portal/dashboard"],
                  ["Projects", "/portal/projects"],
                  ["Agents", "/portal/agents"],
                  ["Settings", "/portal/settings"],
                ].map(([label, href]) => (
                  <Command.Item key={href as string} onSelect={() => go(href as string)}>
                    {label}
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command.Dialog>
        </div>
      )}
    </>
  );
}


