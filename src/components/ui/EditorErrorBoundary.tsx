'use client'

import React from 'react'
import { Button } from './Button'
import { AlertTriangle } from 'lucide-react'

interface EditorErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface EditorErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export class EditorErrorBoundary extends React.Component<
  EditorErrorBoundaryProps,
  EditorErrorBoundaryState
> {
  constructor(props: EditorErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): EditorErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Editor Error Boundary caught an error:', error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent 
            error={this.state.error!} 
            retry={this.retry} 
          />
        )
      }

      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Editor Loading Error
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              There was an issue loading the editor. This might be due to browser compatibility or network issues.
            </p>
            <div className="space-y-2">
              <Button onClick={this.retry} className="mr-2">
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-neutral-500 dark:text-neutral-400">
                Technical Details
              </summary>
              <pre className="mt-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded text-xs overflow-auto max-h-32">
                {this.state.error?.stack || this.state.error?.message || 'Unknown error'}
              </pre>
            </details>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default EditorErrorBoundary