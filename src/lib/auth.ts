'use client'

const AUTH_KEY = 'partkeeper:auth'

export function getStoredAuth(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_KEY)
}

export function setStoredAuth(accessCode: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_KEY, accessCode)
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_KEY)
}

export function isAuthenticated(): boolean {
  const storedCode = getStoredAuth()
  const expectedCode = process.env.NEXT_PUBLIC_ACCESS_CODE
  return storedCode === expectedCode
}

export function authenticate(accessCode: string): boolean {
  const expectedCode = process.env.NEXT_PUBLIC_ACCESS_CODE
  if (accessCode === expectedCode) {
    setStoredAuth(accessCode)
    return true
  }
  return false
}
