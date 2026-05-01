'use client'
import React from 'react'

interface State {
  hasError: boolean
  error: string
}

export class VideoErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry?: () => void; resetKey?: string | number },
  State
> {
  constructor(props: { children: React.ReactNode; onRetry?: () => void; resetKey?: string | number }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message }
  }

  componentDidUpdate(prevProps: Readonly<{ children: React.ReactNode; onRetry?: () => void; resetKey?: string | number }>) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: '' })
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: '' })
    if (this.props.onRetry) {
      this.props.onRetry()
      return
    }

    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-warm-white">
          <h2 className="text-xl font-semibold text-red-500 mb-2">
            Video Call Error
          </h2>
          <p className="text-ink-muted mb-4">{this.state.error}</p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-ink text-warm-white rounded-2xl text-[13px] font-semibold hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
