'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isAuthenticated, authenticate, clearStoredAuth } from '@/lib/auth'

interface LoginGateProps {
  children: React.ReactNode
}

export function LoginGate({ children }: LoginGateProps) {
  const [isAuth, setIsAuth] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setIsAuth(isAuthenticated())
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (authenticate(accessCode)) {
      setIsAuth(true)
      setError('')
    } else {
      setError('Invalid access code')
    }
  }


  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">PartKeeper</CardTitle>
            <CardDescription>
              Enter your access code to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="text-center"
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              <Button type="submit" className="w-full">
                Access PartKeeper
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
