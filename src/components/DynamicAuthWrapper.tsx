'use client'

import { useState, useEffect } from 'react'
import { LoginGate } from './LoginGate'

interface DynamicAuthWrapperProps {
  children: React.ReactNode
}

export function DynamicAuthWrapper({ children }: DynamicAuthWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Always render the same structure to prevent hydration mismatch
  return (
    <div suppressHydrationWarning>
      {!mounted ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <LoginGate>{children}</LoginGate>
      )}
    </div>
  )
}
