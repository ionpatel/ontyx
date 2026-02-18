'use client'

import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component that catches JavaScript errors in child components.
 * Shows a friendly error message instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback 
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Default error fallback UI
 */
interface ErrorFallbackProps {
  error: Error | null
  onRetry?: () => void
  title?: string
  description?: string
}

export function ErrorFallback({
  error,
  onRetry,
  title = 'Something went wrong',
  description = "We're sorry, but something unexpected happened. Please try again.",
}: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">{description}</p>
          
          {error && process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                Technical Details
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
          {onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

/**
 * Inline error for smaller components
 */
export function InlineError({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <span className="text-sm">{message}</span>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0">
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  )
}

/**
 * Loading error state (when data fails to load)
 */
export function LoadError({
  title = 'Failed to load',
  message = 'There was a problem loading this content.',
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  )
}
