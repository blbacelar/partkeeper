'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'

type YTPlayer = {
  playVideo?: () => void
  stopVideo?: () => void
  destroy?: () => void
}

type YouTubeApi = {
  Player: new (
    element: HTMLElement | string,
    options: {
      videoId: string
      height?: string | number
      width?: string | number
      playerVars?: Record<string, string | number | boolean>
      events?: {
        onReady?: (event: { target: YTPlayer }) => void
        onStateChange?: (event: { data: number; target: YTPlayer }) => void
      }
    },
  ) => YTPlayer
  PlayerState?: {
    ENDED?: number
    PLAYING?: number
  }
}

declare global {
  interface Window {
    YT?: YouTubeApi
    onYouTubeIframeAPIReady?: () => void
  }
}

interface YouTubePartProps {
  videoId: string
  title: string
}

export function YouTubePart({ videoId, title }: YouTubePartProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPlayerReady, setIsPlayerReady] = useState(false)

  const playerContainerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const loadPromiseRef = useRef<Promise<YouTubeApi | undefined> | null>(null)

  const extractVideoId = (url: string): string => {
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url
    }

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

    return url
  }

  const actualVideoId = useMemo(() => extractVideoId(videoId), [videoId])

  const loadYouTubeApi = useCallback(() => {
    if (loadPromiseRef.current) {
      return loadPromiseRef.current
    }

    if (typeof window === 'undefined') {
      loadPromiseRef.current = Promise.resolve(undefined)
      return loadPromiseRef.current
    }

    if (window.YT && window.YT.Player) {
      loadPromiseRef.current = Promise.resolve(window.YT)
      return loadPromiseRef.current
    }

    loadPromiseRef.current = new Promise((resolve) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-yt-api]')
      if (!existingScript) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        script.dataset.ytApi = 'true'
        document.body.appendChild(script)
      }

      const previousCallback = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.()
        resolve(window.YT)
      }
    })

    return loadPromiseRef.current
  }, [])

  useEffect(() => {
    if (!isPlaying) return
    let isCancelled = false

    const setupPlayer = async () => {
      const api = await loadYouTubeApi()
      if (isCancelled || !api || !playerContainerRef.current) {
        return
      }

      playerRef.current = new api.Player(playerContainerRef.current, {
        videoId: actualVideoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            setIsPlayerReady(true)
            event.target.playVideo?.()
          },
          onStateChange: (event) => {
            const endedState = api.PlayerState?.ENDED
            if (endedState !== undefined && event.data === endedState) {
              setIsPlaying(false)
            }
          },
        },
      })
    }

    setupPlayer()

    return () => {
      isCancelled = true
    }
  }, [actualVideoId, isPlaying, loadYouTubeApi])

  useEffect(() => {
    if (isPlaying) return

    if (playerRef.current) {
      playerRef.current.stopVideo?.()
      playerRef.current.destroy?.()
      playerRef.current = null
    }

    setIsPlayerReady(false)
  }, [isPlaying])

  return (
    <div className="space-y-4">
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
        {isPlaying ? (
          <div className="w-full h-full" ref={playerContainerRef} />
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
          disabled={!isPlayerReady}
        >
          <Pause className="w-4 h-4 mr-2" />
          Stop Video
        </Button>
      )}
    </div>
  )
}
