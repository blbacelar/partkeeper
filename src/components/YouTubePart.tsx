'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type YTPlayer = {
  playVideo?: () => void
  stopVideo?: () => void
  destroy?: () => void
  setPlaybackRate?: (rate: number) => void
  getPlaybackRate?: () => number
  getAvailablePlaybackRates?: () => number[]
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
  const [pitchSemitones, setPitchSemitones] = useState(0)
  const [appliedPlaybackRate, setAppliedPlaybackRate] = useState(1)
  const playerContainerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const loadPromiseRef = useRef<Promise<YouTubeApi | undefined> | null>(null)

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
  const storageKey = useMemo(() => `partkeeper:yt:pitch:${actualVideoId}`, [actualVideoId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedValue = window.localStorage.getItem(storageKey)
    if (storedValue) {
      const parsed = Number.parseFloat(storedValue)
      if (!Number.isNaN(parsed)) {
        setPitchSemitones(parsed)
      }
    }
  }, [storageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, pitchSemitones.toString())
  }, [pitchSemitones, storageKey])

  const applyPitch = useCallback((value: number) => {
    const player = playerRef.current
    if (!player || !player.setPlaybackRate) return

    const desiredRate = Math.pow(2, value / 12)
    const availableRates = player.getAvailablePlaybackRates?.()

    if (!availableRates || availableRates.length === 0) {
      player.setPlaybackRate(desiredRate)
      setAppliedPlaybackRate(desiredRate)
      return
    }

    const closestRate = availableRates.reduce((closest, candidate) => {
      const currentDiff = Math.abs(candidate - desiredRate)
      const bestDiff = Math.abs(closest - desiredRate)
      return currentDiff < bestDiff ? candidate : closest
    }, availableRates[0])

    player.setPlaybackRate(closestRate)
    setAppliedPlaybackRate(closestRate)
  }, [])

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
            setAppliedPlaybackRate(event.target.getPlaybackRate?.() ?? 1)
            applyPitch(pitchSemitones)
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
  }, [actualVideoId, applyPitch, isPlaying, loadYouTubeApi, pitchSemitones])

  useEffect(() => {
    if (isPlaying) return

    if (playerRef.current) {
      playerRef.current.stopVideo?.()
      playerRef.current.destroy?.()
      playerRef.current = null
    }

    setIsPlayerReady(false)
    setAppliedPlaybackRate(1)
  }, [isPlaying])

  useEffect(() => {
    if (!isPlayerReady) return
    applyPitch(pitchSemitones)
  }, [applyPitch, isPlayerReady, pitchSemitones])

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
        >
          <Pause className="w-4 h-4 mr-2" />
          Stop Video
        </Button>
      )}
      {isPlaying && (
        <div className="space-y-2 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <Label htmlFor={`pitch-${actualVideoId}`}>Pitch shift (semitones)</Label>
            <span className="text-sm text-muted-foreground">{pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones}</span>
          </div>
          <input
            id={`pitch-${actualVideoId}`}
            type="range"
            min={-12}
            max={12}
            step={1}
            value={pitchSemitones}
            onChange={(event) => {
              const value = Number.parseInt(event.target.value, 10)
              setPitchSemitones(value)
            }}
            className="w-full"
            disabled={!isPlayerReady}
          />
          <p className="text-xs text-muted-foreground">
            Playback rate applied: {appliedPlaybackRate.toFixed(2)}x
          </p>
        </div>
      )}
    </div>
  )
}
