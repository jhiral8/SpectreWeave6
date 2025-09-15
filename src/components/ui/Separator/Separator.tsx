import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Separator = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => {
    const separatorClassName = cn(
      'shrink-0 bg-neutral-200 dark:bg-neutral-800 h-[1px] w-full',
      className,
    )

    return <div className={separatorClassName} ref={ref} {...rest} />
  },
)

Separator.displayName = 'Separator'