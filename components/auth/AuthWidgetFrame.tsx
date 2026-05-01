'use client'

import { ClerkLoaded, ClerkLoading } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { PageLoader } from '@/components/ui/PageLoader'

export function AuthWidgetFrame({ children }: { children: React.ReactNode }) {
  const [takingLong, setTakingLong] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setTakingLong(true)
    }, 8000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [])

  return (
    <>
      <ClerkLoading>
        <PageLoader
          tone="light"
          compact
          title="Loading secure sign-in..."
          detail={
            takingLong
              ? 'Authentication is taking longer than usual. Please wait a moment, then refresh if this still does not move.'
              : 'We are preparing the authentication form.'
          }
        />
      </ClerkLoading>
      <ClerkLoaded>{children}</ClerkLoaded>
    </>
  )
}
