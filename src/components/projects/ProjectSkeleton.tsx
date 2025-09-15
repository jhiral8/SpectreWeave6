'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ProjectSkeletonProps {
  viewMode: 'grid' | 'list'
  count?: number
}

export const ProjectSkeleton: React.FC<ProjectSkeletonProps> = ({ 
  viewMode, 
  count = 6 
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {viewMode === 'grid' ? <GridSkeleton /> : <ListSkeleton />}
        </div>
      ))}
    </>
  )
}

const GridSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 animate-pulse">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
      <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
    </div>

    <div className="space-y-2 mb-4">
      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
    </div>

    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded-full w-16"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-12"></div>
      </div>
      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div>
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
      <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
      <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
    </div>
  </div>
)

const ListSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg animate-pulse">
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
          </div>
        </div>
        <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
      </div>
    </div>
  </div>
)

export const SearchSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-9 bg-neutral-200 dark:bg-neutral-700 rounded-lg mb-4"></div>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-32"></div>
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-28"></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div>
      </div>
    </div>
  </div>
)