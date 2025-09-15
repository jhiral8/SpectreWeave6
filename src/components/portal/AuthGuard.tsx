"use client";
import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/portal/login?next=" + encodeURIComponent(pathname || "/portal/dashboard"));
        return;
      }
      setReady(true);
    };
    run();
  }, [router, pathname]);

  if (!ready) return <div className="p-6 text-sm text-[--muted-foreground]">Checking authentication…</div>;
  return <>{children}</>;
}


