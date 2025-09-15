import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...rest }, ref) => {
    const selectClassName = cn(
      'bg-black/5 border-0 rounded-lg text-black text-sm font-medium h-9 px-3 py-2 w-full',
      'dark:bg-white/10 dark:text-white',
      'hover:bg-black/10',
      'dark:hover:bg-white/20',
      'focus:bg-transparent active:bg-transparent focus:outline focus:outline-black active:outline active:outline-black',
      'dark:focus:outline-white dark:active:outline-white',
      'cursor-pointer',
      className,
    )

    return (
      <select className={selectClassName} ref={ref} {...rest}>
        {children}
      </select>
    )
  },
)

Select.displayName = 'Select'

export const SelectContent = ({ children }: { children: React.ReactNode }) => children
export const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <option value={value}>{children}</option>
)
export const SelectTrigger = Select
export const SelectValue = ({ placeholder }: { placeholder?: string }) => null