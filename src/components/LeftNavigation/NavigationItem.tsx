import { memo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { icons } from 'lucide-react'

export interface NavigationItemProps {
  href?: string
  icon: keyof typeof icons
  label: string
  isActive?: boolean
  isCollapsed?: boolean
  onClick?: () => void
  badge?: string | number
  className?: string
}

export const NavigationItem = memo(({
  href,
  icon,
  label,
  isActive = false,
  isCollapsed = false,
  onClick,
  badge,
  className
}: NavigationItemProps) => {
  const itemClasses = cn(
    'group relative flex items-center transition-all duration-200',
    'text-neutral-700 dark:text-neutral-300',
    'hover:text-neutral-900 dark:hover:text-white',
    'hover:bg-neutral-100 dark:hover:bg-neutral-800',
    isCollapsed ? 'justify-center px-3 py-3 mx-2' : 'px-4 py-3 mx-3',
    'rounded-lg border border-transparent',
    isActive && [
      'text-blue-600 dark:text-blue-400',
      'bg-blue-50 dark:bg-blue-900/20',
      'border-blue-200 dark:border-blue-800',
      'hover:text-blue-700 dark:hover:text-blue-300',
      'hover:bg-blue-100 dark:hover:bg-blue-900/30'
    ],
    className
  )

  const content = (
    <>
      <div className="flex items-center justify-center flex-shrink-0">
        <Icon 
          name={icon} 
          className={cn(
            'transition-colors duration-200',
            isActive 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200'
          )}
        />
      </div>
      
      {!isCollapsed && (
        <>
          <span 
            className={cn(
              'ml-3 text-sm font-medium truncate transition-colors duration-200',
              isActive 
                ? 'text-blue-700 dark:text-blue-300' 
                : 'text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white'
            )}
          >
            {label}
          </span>
          
          {badge && (
            <div className={cn(
              'ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full',
              isActive
                ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
            )}>
              {badge}
            </div>
          )}
        </>
      )}
      
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
          {label}
          {badge && (
            <span className="ml-1 opacity-75">
              ({badge})
            </span>
          )}
        </div>
      )}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={itemClasses} onClick={onClick}>
        {content}
      </Link>
    )
  }

  return (
    <button className={itemClasses} onClick={onClick} type="button">
      {content}
    </button>
  )
})

NavigationItem.displayName = 'NavigationItem'