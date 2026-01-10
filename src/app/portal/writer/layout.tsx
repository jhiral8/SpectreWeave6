import { ToastProvider } from '@/components/portal/ui/toast'
import { AuthGuard } from '@/components/portal/AuthGuard'

export default function WriterLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthGuard>
        {children}
      </AuthGuard>
    </ToastProvider>
  )
}


