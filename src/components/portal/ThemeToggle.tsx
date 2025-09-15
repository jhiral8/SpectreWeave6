"use client";
import * as React from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark");

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("sw5-theme");
      if (stored === "light" || stored === "dark") setTheme(stored as any);
    } catch {}
  }, []);

  React.useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", theme);
    if (theme === "dark") html.classList.add("dark"); else html.classList.remove("dark");
    try { localStorage.setItem("sw5-theme", theme); } catch {}
  }, [theme]);

  return (
    <button
      type="button"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-[--border] text-[--foreground] hover:bg-white/5 transition-colors"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      aria-label="Toggle theme"
      aria-pressed={theme === 'dark'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Sun
        className={`h-4 w-4 transition-all duration-200 ${theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
        aria-hidden
      />
      <Moon
        className={`absolute h-4 w-4 transition-all duration-200 ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}
        aria-hidden
      />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}


