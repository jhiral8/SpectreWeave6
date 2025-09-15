'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
  variant?: 'line' | 'circle' | 'rectangle' | 'text'
  width?: string | number
  height?: string | number
  lines?: number
  animate?: boolean
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  variant = 'line',
  width,
  height,
  lines = 1,
  animate = true
}) => {
  const baseClasses = cn(
    'bg-neutral-200 dark:bg-neutral-700 rounded',
    animate && 'animate-pulse',
    className
  )

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  }

  if (variant === 'circle') {
    return (
      <div
        className={cn(baseClasses, 'rounded-full')}
        style={{
          ...style,
          width: width || height || '2rem',
          height: height || width || '2rem'
        }}
      />
    )
  }

  if (variant === 'rectangle') {
    return (
      <div
        className={cn(baseClasses, 'rounded-lg')}
        style={{
          ...style,
          width: width || '100%',
          height: height || '4rem'
        }}
      />
    )
  }

  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              'h-4',
              index === lines - 1 && lines > 1 && 'w-3/4' // Last line is shorter
            )}
            style={{
              width: index === lines - 1 && lines > 1 ? '75%' : width || '100%'
            }}
          />
        ))}
      </div>
    )
  }

  // Default line variant
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            baseClasses,
            'h-4',
            index === lines - 1 && lines > 1 && 'w-2/3'
          )}
          style={{
            ...style,
            width: index === lines - 1 && lines > 1 ? '66%' : width || '100%',
            height: height || '1rem'
          }}
        />
      ))}
    </div>
  )
}

// Specialized skeleton components for common use cases
export const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className 
}) => (
  <LoadingSkeleton variant="text" lines={lines} className={className} />
)

export const ButtonSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSkeleton 
    variant="rectangle" 
    width="120px" 
    height="36px" 
    className={className} 
  />
)

export const CircleSkeleton: React.FC<{ size?: number; className?: string }> = ({ 
  size = 32, 
  className 
}) => (
  <LoadingSkeleton 
    variant="circle" 
    width={size} 
    height={size} 
    className={className} 
  />
)

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-4 space-y-3', className)}>
    <div className="flex items-center space-x-3">
      <CircleSkeleton size={40} />
      <div className="flex-1">
        <LoadingSkeleton width="60%" height="16px" />
        <LoadingSkeleton width="40%" height="12px" className="mt-2" />
      </div>
    </div>
    <TextSkeleton lines={2} />
    <div className="flex justify-between items-center">
      <ButtonSkeleton />
      <LoadingSkeleton width="80px" height="20px" />
    </div>
  </div>
)

// Analytics specific skeleton
export const AnalyticsSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-4 space-y-4', className)}>
    <div className="flex items-center justify-between">
      <LoadingSkeleton width="120px" height="16px" />
      <CircleSkeleton size={24} />
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <LoadingSkeleton width="60px" height="12px" />
            <LoadingSkeleton width="40px" height="12px" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <LoadingSkeleton width="70px" height="12px" />
            <LoadingSkeleton width="30px" height="12px" />
          </div>
        ))}
      </div>
    </div>
    
    <div className="space-y-2">
      <LoadingSkeleton width="80px" height="12px" />
      <LoadingSkeleton width="100%" height="8px" className="rounded-full" />
    </div>
  </div>
)

// AI Assistant specific skeleton
export const AIAssistantSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-4 space-y-4', className)}>
    <div className="flex items-center justify-between">
      <LoadingSkeleton width="140px" height="16px" />
      <CircleSkeleton size={24} />
    </div>
    
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <ButtonSkeleton key={i} />
      ))}
    </div>
    
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 p-3">
          <CircleSkeleton size={16} />
          <LoadingSkeleton width="60px" height="12px" />
        </div>
      ))}
    </div>
    
    <div className="space-y-2">
      <LoadingSkeleton width="100px" height="12px" />
      <LoadingSkeleton width="100%" height="64px" className="rounded-lg" />
      <ButtonSkeleton />
    </div>
  </div>
)

export default LoadingSkeleton