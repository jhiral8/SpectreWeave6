'use client'

import React, { Suspense, lazy } from 'react'
import { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'

// Lazy load heavy editor components for better performance
const AIWritingAssistant = lazy(() => import('./AIWritingAssistant'))
const AdvancedFormatting = lazy(() => import('./AdvancedFormatting'))
const WritingAnalytics = lazy(() => import('./WritingAnalytics'))

// Loading fallback components
const AIAssistantSkeleton = () => (
  <Button variant="ghost" buttonSize="icon" disabled>
    <Icon name="Bot" className="opacity-50" />
  </Button>
)

const FormattingSkeleton = () => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
    ))}
  </div>
)

const AnalyticsSkeleton = () => (
  <div className="flex items-center gap-2 px-3 py-2">
    <div className="w-16 h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
    <div className="w-20 h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
    <div className="w-12 h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
  </div>
)

// Lazy wrapper components with error boundaries
interface LazyComponentProps {
  editor: Editor
  className?: string
}

export const LazyAIWritingAssistant: React.FC<LazyComponentProps> = ({ editor, className }) => (
  <Suspense fallback={<AIAssistantSkeleton />}>
    <AIWritingAssistant editor={editor} className={className} />
  </Suspense>
)

export const LazyAdvancedFormatting: React.FC<LazyComponentProps> = ({ editor, className }) => (
  <Suspense fallback={<FormattingSkeleton />}>
    <AdvancedFormatting editor={editor} className={className} />
  </Suspense>
)

export const LazyWritingAnalytics: React.FC<LazyComponentProps> = ({ editor, className }) => (
  <Suspense fallback={<AnalyticsSkeleton />}>
    <WritingAnalytics editor={editor} className={className} />
  </Suspense>
)

// Bundle splitting for different feature sets
export const EditorFeatures = {
  AI: LazyAIWritingAssistant,
  Formatting: LazyAdvancedFormatting,
  Analytics: LazyWritingAnalytics
}

export default EditorFeatures