'use client'

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface SpectreWeaveLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
  onClick?: () => void
  bordered?: boolean
}

const sizePx: Record<NonNullable<SpectreWeaveLogoProps['size']>, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
}

const textSizeClasses = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl'
}

export default function SpectreWeaveLogo({
  size = 'md',
  showText = true,
  className,
  onClick,
  bordered = false,
}: SpectreWeaveLogoProps) {
  const logoContent = (
    <div className={cn(
      'flex items-center space-x-3',
      onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
      className
    )}>
      {/* Logo Image */}
      <div className={cn('relative flex-shrink-0', bordered && 'ai-neural-border')}>
        <Image
          src="/images/SpectreWeaveLogo.png"
          alt="SpectreWeave"
          width={sizePx[size]}
          height={sizePx[size]}
          style={{ width: sizePx[size], height: 'auto' }}
          priority
          className="bg-transparent"
        />
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            'font-surgena font-bold text-neutral-900 dark:text-white leading-none',
            textSizeClasses[size]
          )}>
            SpectreWeave
          </span>
          {size !== 'xs' && (
            <span className={cn(
              'text-neutral-500 dark:text-neutral-400 font-medium leading-none',
              size === 'sm' ? 'text-xs' :
              size === 'md' ? 'text-sm' :
              size === 'lg' ? 'text-base' : 'text-lg'
            )}>
              AI-Enhanced Writing
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black rounded-lg">
        {logoContent}
      </button>
    )
  }

  return logoContent
}
