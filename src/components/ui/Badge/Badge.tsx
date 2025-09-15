import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export const Badge = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: BadgeVariant }>(
  ({ className, variant = 'default', ...rest }, ref) => {
    const badgeClassName = cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 dark:focus:ring-neutral-300',
      variant === 'default' && 'border-transparent bg-neutral-900 text-neutral-50 hover:bg-neutral-900/80 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/80',
      variant === 'secondary' && 'border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-100/80 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-800/80',
      variant === 'destructive' && 'border-transparent bg-red-500 text-neutral-50 hover:bg-red-500/80 dark:bg-red-900 dark:text-neutral-50 dark:hover:bg-red-900/80',
      variant === 'outline' && 'text-neutral-950 dark:text-neutral-50 border border-neutral-200 dark:border-neutral-800',
      className,
    )

    return <div className={badgeClassName} ref={ref} {...rest} />
  },
)

Badge.displayName = 'Badge'