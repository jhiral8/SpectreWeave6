import React, { useState, useRef, useEffect, createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

const DropdownContext = createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
} | null>(null)

export const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  )
}

export const DropdownMenuTrigger = ({ 
  asChild, 
  children 
}: { 
  asChild?: boolean
  children: React.ReactNode 
}) => {
  const context = useContext(DropdownContext)
  if (!context) return <>{children}</>
  
  const { setIsOpen } = context
  
  if (asChild && typeof children === 'object' && children !== null && 'props' in children) {
    const child = children as React.ReactElement
    return React.cloneElement(child, {
      ...child.props,
      onClick: (e: React.MouseEvent) => {
        setIsOpen(true)
        child.props.onClick?.(e)
      }
    })
  }
  
  return (
    <button onClick={() => setIsOpen(true)}>
      {children}
    </button>
  )
}

export const DropdownMenuContent = ({ 
  align = 'start',
  className,
  children 
}: { 
  align?: 'start' | 'end'
  className?: string
  children: React.ReactNode 
}) => {
  const context = useContext(DropdownContext)
  if (!context) return null
  
  const { isOpen, setIsOpen } = context
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, setIsOpen])
  
  if (!isOpen) return null
  
  const contentClassName = cn(
    'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md',
    'bg-[--card] text-[--card-foreground] border-[--border]',
    'animate-in fade-in-0 zoom-in-95',
    align === 'end' ? 'right-0' : 'left-0',
    'mt-2',
    className,
  )

  return <div ref={ref} className={contentClassName}>{children}</div>
}

export const DropdownMenuItem = ({ 
  className,
  onClick,
  children 
}: { 
  className?: string
  onClick?: () => void
  children: React.ReactNode 
}) => {
  const context = useContext(DropdownContext)
  
  const itemClassName = cn(
    'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
    'hover:bg-white/5 hover:text-[--card-foreground]',
    'focus:bg-white/5 focus:text-[--card-foreground]',
    className,
  )

  return (
    <div 
      className={itemClassName} 
      onClick={() => {
        onClick?.()
        context?.setIsOpen(false)
      }}
    >
      {children}
    </div>
  )
}

export const DropdownMenuLabel = ({ 
  className,
  children 
}: { 
  className?: string
  children: React.ReactNode 
}) => {
  const labelClassName = cn('px-2 py-1.5 text-sm font-semibold', className)

  return <div className={labelClassName}>{children}</div>
}

export const DropdownMenuSeparator = ({ className }: { className?: string }) => {
  const separatorClassName = cn('-mx-1 my-1 h-px bg-[--border]', className)

  return <div className={separatorClassName} />
}