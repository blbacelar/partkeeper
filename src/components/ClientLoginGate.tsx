'use client'

import dynamic from 'next/dynamic'

const LoginGate = dynamic(() => import('./LoginGate').then(mod => ({ default: mod.LoginGate })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
})

interface ClientLoginGateProps {
  children: React.ReactNode
}

export function ClientLoginGate({ children }: ClientLoginGateProps) {
  return <LoginGate>{children}</LoginGate>
}
