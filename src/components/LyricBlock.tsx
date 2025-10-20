'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'

interface LyricBlockProps {
  lyrics: string
}

export function LyricBlock({ lyrics }: LyricBlockProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="space-y-2">
      <Button
        onClick={() => setIsVisible(!isVisible)}
        variant="outline"
        size="sm"
        className="w-full"
      >
        {isVisible ? (
          <>
            <EyeOff className="w-4 h-4 mr-2" />
            Hide Lyrics
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 mr-2" />
            Show Lyrics
          </>
        )}
      </Button>
      
      {isVisible && (
        <div className="p-4 bg-muted rounded-lg">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">
            {lyrics}
          </pre>
        </div>
      )}
    </div>
  )
}
