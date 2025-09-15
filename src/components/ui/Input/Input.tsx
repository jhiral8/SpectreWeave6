import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => {
    const inputClassName = cn(
      'bg-black/5 border-0 rounded-lg caret-black block text-black text-sm font-medium h-9 px-3 py-2 w-full',
      'dark:bg-white/10 dark:text-white dark:caret-white',
      'hover:bg-black/10',
      'dark:hover:bg-white/20',
      'focus:bg-transparent active:bg-transparent focus:outline focus:outline-black active:outline active:outline-black',
      'dark:focus:outline-white dark:active:outline-white',
      'placeholder:text-neutral-500 dark:placeholder:text-neutral-400',
      className,
    )

    return <input className={inputClassName} ref={ref} {...rest} />
  },
)

Input.displayName = 'Input'