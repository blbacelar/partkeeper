'use client'

import { LoginGate } from './LoginGate'

interface DynamicLoginGateProps {
  children: React.ReactNode
}

export function DynamicLoginGate({ children }: DynamicLoginGateProps) {
  return <LoginGate>{children}</LoginGate>
}
