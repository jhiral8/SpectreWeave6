'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  debounceMs?: number
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search projects...",
  className,
  debounceMs = 300
}) => {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localValue, onChange, value, debounceMs])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
  }

  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      <div className="relative flex-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400">
          <SearchIcon className="w-4 h-4" />
        </div>
        <Input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
          aria-label="Search projects"
        />
        {localValue && (
          <Button
            variant="ghost"
            buttonSize="iconSmall"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-black/10 dark:hover:bg-white/10"
            aria-label="Clear search"
          >
            <XIcon className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
)

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
)