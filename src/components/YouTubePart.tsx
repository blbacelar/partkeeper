'use client'

import { useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface YouTubePartProps {
  videoId: string
  title: string
}

export function YouTubePart({ videoId, title }: YouTubePartProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  // Extract video ID from full YouTube URL or use as-is if it's already just an ID
  const extractVideoId = (url: string): string => {
    // If it's already just a video ID (11 characters, alphanumeric), return as-is
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url
    }
    
    // Extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    // If no pattern matches, return the original string
    return url
  }

  const actualVideoId = extractVideoId(videoId)
  const embedUrl = `https://www.youtube.com/embed/${actualVideoId}?autoplay=0&rel=0&modestbranding=1`

  return (
    <div className="space-y-4">
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
        {isPlaying ? (
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-primary-foreground ml-1" />
              </div>
              <div>
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm text-muted-foreground">Click to play</p>
              </div>
            </div>
            <Button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 w-full h-full bg-transparent hover:bg-black/10"
              variant="ghost"
            >
              <span className="sr-only">Play video</span>
            </Button>
          </div>
        )}
      </div>
      {isPlaying && (
        <Button
          onClick={() => setIsPlaying(false)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Pause className="w-4 h-4 mr-2" />
          Stop Video
        </Button>
      )}
    </div>
  )
}
