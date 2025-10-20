'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { clearStoredAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  title?: string
  showLogout?: boolean
}

export function Header({ title = 'PartKeeper', showLogout = true }: HeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    clearStoredAuth()
    // Force a page refresh to trigger LoginGate re-render
    window.location.href = '/'
  }

  const handleTitleClick = () => {
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-14 px-4 flex items-center justify-center relative">
        <button 
          onClick={handleTitleClick}
          className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer"
        >
          {title}
        </button>
        {showLogout && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="absolute right-4 flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        )}
      </div>
    </header>
  )
}
