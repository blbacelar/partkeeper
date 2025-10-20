'use client'

import { LoginGate } from './LoginGate'

interface ClientAuthWrapperProps {
  children: React.ReactNode
}

export function ClientAuthWrapper({ children }: ClientAuthWrapperProps) {
  return <LoginGate>{children}</LoginGate>
}
