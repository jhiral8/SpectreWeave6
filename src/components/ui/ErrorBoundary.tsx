'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'
import { Surface } from './Surface'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  className?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <Surface className={`p-6 m-4 max-w-md mx-auto ${this.props.className || ''}`}>
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <Icon name="AlertTriangle" className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Something went wrong
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                An error occurred while rendering this component. Please try again.
              </p>
            </div>

            {this.props.showDetails && this.state.error && (
              <details className="text-left">
                <summary className="text-sm text-neutral-500 dark:text-neutral-500 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300">
                  Error Details
                </summary>
                <div className="mt-2 p-3 bg-neutral-100 dark:bg-neutral-800 rounded text-xs font-mono overflow-auto">
                  <div className="text-red-600 dark:text-red-400 font-semibold">
                    {this.state.error.name}: {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <pre className="mt-2 text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-2 justify-center">
              <Button
                variant="primary"
                buttonSize="small"
                onClick={this.handleReset}
              >
                <Icon name="RotateCcw" className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="tertiary"
                buttonSize="small"
                onClick={() => window.location.reload()}
              >
                <Icon name="RefreshCw" className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            </div>
          </div>
        </Surface>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components that need error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default ErrorBoundary