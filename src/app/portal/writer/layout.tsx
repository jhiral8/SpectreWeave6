import { ToastProvider } from '@/components/portal/ui/toast'
import { AppShell } from '@/components/portal/AppShell'
import { AuthGuard } from '@/components/portal/AuthGuard'

export default function WriterLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthGuard>
        <AppShell>{children}</AppShell>
      </AuthGuard>
    </ToastProvider>
  )
}


