"use client";
import * as React from "react";
import * as Toast from "@radix-ui/react-toast";

type ToastItem = { id: number; title?: string; description?: string };

const ToastCtx = React.createContext<(t: Omit<ToastItem, "id">) => void>(() => {});
export const useToast = () => React.useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const push = React.useCallback((t: Omit<ToastItem, "id">) => setItems((prev) => [...prev, { id: Date.now() + Math.random(), ...t }]), []);
  const remove = (id: number) => setItems((prev) => prev.filter((x) => x.id !== id));

  return (
    <Toast.Provider swipeDirection="right">
      <ToastCtx.Provider value={push}>{children}</ToastCtx.Provider>
      {items.map((t) => (
        <Toast.Root key={t.id} duration={3000} onOpenChange={(open) => { if (!open) remove(t.id); }} className="rounded-md border border-[--border] bg-[--card] text-[--foreground] shadow p-3 grid gap-1">
          {t.title && <Toast.Title className="text-sm font-medium">{t.title}</Toast.Title>}
          {t.description && <Toast.Description className="text-xs text-[--muted-foreground]">{t.description}</Toast.Description>}
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-80 max-w-[90vw] flex-col gap-2" />
    </Toast.Provider>
  );
}


