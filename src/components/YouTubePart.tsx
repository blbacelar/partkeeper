'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Minus, Plus, Repeat, Settings2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

type YTPlayer = {
  playVideo?: () => void
  pauseVideo?: () => void
  stopVideo?: () => void
  destroy?: () => void
  setPlaybackRate?: (rate: number) => void
  getPlaybackRate?: () => number
  getAvailablePlaybackRates?: () => number[]
  getCurrentTime?: () => number
  getDuration?: () => number
  seekTo?: (seconds: number, allowSeekAhead?: boolean) => void
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
    PAUSED?: number
    BUFFERING?: number
    CUED?: number
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
  const [showControls, setShowControls] = useState(false)

  // Controls state
  const [speed, setSpeed] = useState(100) // 25 to 400 percent
  const [isLooping, setIsLooping] = useState(false)
  const [loopStart, setLoopStart] = useState<number | null>(null)
  const [loopEnd, setLoopEnd] = useState<number | null>(null)

  const playerContainerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const loadPromiseRef = useRef<Promise<YouTubeApi | undefined> | null>(null)
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const applyPlaybackRateRef = useRef<() => void>(() => {})
  const loopSettingsRef = useRef({
    isLooping: false,
    loopStart: null as number | null,
    loopEnd: null as number | null,
  })

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

  // Storage keys for persisting settings per video
  const storageKeys = useMemo(() => ({
    speed: `partkeeper:yt:speed:${actualVideoId}`,
    loopStart: `partkeeper:yt:loopStart:${actualVideoId}`,
    loopEnd: `partkeeper:yt:loopEnd:${actualVideoId}`,
  }), [actualVideoId])

  // Load persisted settings
  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedSpeed = window.localStorage.getItem(storageKeys.speed)
    const storedLoopStart = window.localStorage.getItem(storageKeys.loopStart)
    const storedLoopEnd = window.localStorage.getItem(storageKeys.loopEnd)

    if (storedSpeed) {
      const parsed = Number.parseInt(storedSpeed, 10)
      if (!Number.isNaN(parsed)) setSpeed(parsed)
    }
    if (storedLoopStart) {
      const parsed = Number.parseFloat(storedLoopStart)
      if (!Number.isNaN(parsed)) setLoopStart(parsed)
    }
    if (storedLoopEnd) {
      const parsed = Number.parseFloat(storedLoopEnd)
      if (!Number.isNaN(parsed)) setLoopEnd(parsed)
    }
  }, [storageKeys])

  // Persist settings
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(storageKeys.speed, speed.toString())
  }, [speed, storageKeys.speed])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (loopStart !== null) {
      window.localStorage.setItem(storageKeys.loopStart, loopStart.toString())
    }
  }, [loopStart, storageKeys.loopStart])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (loopEnd !== null) {
      window.localStorage.setItem(storageKeys.loopEnd, loopEnd.toString())
    }
  }, [loopEnd, storageKeys.loopEnd])

  useEffect(() => {
    loopSettingsRef.current = {
      isLooping,
      loopStart,
      loopEnd,
    }
  }, [isLooping, loopStart, loopEnd])

  // Calculate playback rate based on the selected speed
  // YouTube's player only exposes playbackRate, which affects both pitch and tempo
  const calculatePlaybackRate = useCallback((speedValue: number) => {
    // Speed: percentage to rate - this should change tempo (and unfortunately pitch too)
    const speedRate = speedValue / 100

    const combinedRate = speedRate

    console.log('Rate calculation:', {
      speed: speedValue,
      speedRate,
      combinedRate
    })

    return combinedRate
  }, [])

  // Apply playback rate to YouTube player
  const applyPlaybackRate = useCallback(() => {
    const player = playerRef.current
    if (!player || !isPlayerReady) {
      console.log('Cannot apply playback rate - player not ready', {
        player: !!player,
        isPlayerReady
      })
      return
    }

    if (!player.setPlaybackRate) {
      console.error('setPlaybackRate not available on player')
      return
    }

    const desiredRate = calculatePlaybackRate(speed)

    // YouTube API limits playback rate between 0.25 and 2.0
    const clampedRate = Math.max(0.25, Math.min(2.0, desiredRate))

    console.log('Applying playback rate:', {
      speed,
      desiredRate,
      clampedRate,
      currentRate: player.getPlaybackRate?.()
    })

    // Set the playback rate
    try {
      player.setPlaybackRate(clampedRate)

      // Verify it was set (with a small delay)
      setTimeout(() => {
        const actualRate = player.getPlaybackRate?.()
        if (actualRate !== undefined && Math.abs(actualRate - clampedRate) > 0.01) {
          console.warn('Playback rate mismatch:', {
            expected: clampedRate,
            actual: actualRate,
            tryingAgain: true
          })
          // Try again
          player.setPlaybackRate?.(clampedRate)
        } else {
          console.log('Playback rate set successfully:', actualRate)
        }
      }, 100)
    } catch (error) {
      console.error('Error setting playback rate:', error)
    }
  }, [speed, calculatePlaybackRate, isPlayerReady])

  // Keep ref updated with latest function
  useEffect(() => {
    applyPlaybackRateRef.current = applyPlaybackRate
  }, [applyPlaybackRate])

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
            // Apply playback rate after player is ready
            // Note: YouTube requires video to be playing before rate can be changed
            event.target.playVideo?.()

            // Apply rate after video starts playing (handled in onStateChange)
          },
          onStateChange: (event) => {
            const endedState = api.PlayerState?.ENDED
            const playingState = api.PlayerState?.PLAYING
            
            // Apply playback rate when video starts playing
            if (playingState !== undefined && event.data === playingState) {
              // Delay slightly to ensure player is fully ready
              setTimeout(() => {
                applyPlaybackRateRef.current()
              }, 200)
            }
            
            // Handle video end
            if (endedState !== undefined && event.data === endedState) {
              const { isLooping, loopStart, loopEnd } = loopSettingsRef.current
              if (isLooping && loopStart !== null && loopEnd !== null) {
                // Loop back to start
                event.target.seekTo?.(loopStart, true)
                event.target.playVideo?.()
              } else {
                setIsPlaying(false)
              }
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
    // Clear intervals
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current)
      timeUpdateIntervalRef.current = null
    }
  }, [isPlaying])

  // Time tracking and periodic rate reapplication
  useEffect(() => {
    if (!isPlaying || !isPlayerReady) return

    timeUpdateIntervalRef.current = setInterval(() => {
      const time = playerRef.current?.getCurrentTime?.() ?? 0
      // Re-apply playback rate periodically (YouTube sometimes resets it)
      applyPlaybackRateRef.current()
      
      // Check loop boundaries
      const { isLooping: looping, loopStart: start, loopEnd: end } = loopSettingsRef.current
      if (looping && start !== null && end !== null && time >= end) {
        playerRef.current?.seekTo?.(start, true)
      }
    }, 500) // Check every 500ms

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current)
        timeUpdateIntervalRef.current = null
      }
    }
  }, [isPlaying, isPlayerReady])

  // Apply playback rate when controls change
  useEffect(() => {
    if (!isPlayerReady || !isPlaying) return
    applyPlaybackRate()
  }, [speed, isPlayerReady, isPlaying, applyPlaybackRate])

  // Helper functions
  const resetSpeed = () => setSpeed(100)

  const adjustSpeed = (delta: number) => {
    setSpeed(prev => Math.max(25, Math.min(400, prev + delta)))
  }

  const setLoopMarker = (marker: 'start' | 'end') => {
    const time = playerRef.current?.getCurrentTime?.() ?? 0
    if (marker === 'start') {
      setLoopStart(time)
      if (loopEnd !== null && time >= loopEnd) {
        setLoopEnd(null)
      }
    } else {
      setLoopEnd(time)
      if (loopStart !== null && time <= loopStart) {
        setLoopStart(null)
      }
    }
  }

  const toggleLoop = () => {
    if (loopStart !== null && loopEnd !== null) {
      setIsLooping(!isLooping)
    }
  }

  // Calculate tempo in BPM (approximate, based on speed)
  const calculateBPM = useCallback(() => {
    // This is a rough estimate - actual tempo depends on the video content
    // For demonstration, we'll use speed as a multiplier
    return Math.round(120 * (speed / 100))
  }, [speed])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isPlaying) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return // Ignore modifier combinations

      switch (e.key.toLowerCase()) {
        case ',':
          e.preventDefault()
          adjustSpeed(-5)
          break
        case '.':
          e.preventDefault()
          adjustSpeed(5)
          break
        case 'l':
          e.preventDefault()
          if (loopStart !== null && loopEnd !== null) {
            setIsLooping(prev => !prev)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, loopStart, loopEnd])

  // Control Panel Component
  const ControlPanel = ({
    title,
    subtitle,
    value,
    valueDisplay,
    min,
    max,
    step,
    onChange,
    onReset,
    onDecrease,
    onIncrease,
    disabled,
  }: {
    title: string
    subtitle?: string
    value: number
    valueDisplay: string
    min: number
    max: number
    step: number
    onChange: (value: number) => void
    onReset: () => void
    onDecrease: () => void
    onIncrease: () => void
    disabled?: boolean
  }) => (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="text-xs font-medium">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <button
          onClick={onReset}
          disabled={disabled}
          className="rounded-full p-1 text-primary hover:bg-muted disabled:opacity-50 transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      <div className="mb-2 flex items-center justify-center">
        <span className="text-xl font-semibold">{valueDisplay}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onDecrease}
          disabled={disabled || value <= min}
          className="rounded-full w-6 h-6 flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>

        <div className="flex-1 relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number.parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((value - min) / (max - min)) * 100}%, hsl(var(--muted)) ${((value - min) / (max - min)) * 100}%, hsl(var(--muted)) 100%)`,
            }}
          />
        </div>

        <button
          onClick={onIncrease}
          disabled={disabled || value >= max}
          className="rounded-full w-6 h-6 flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-base">{title}</h3>
            {isPlaying && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowControls(!showControls)}
                className="h-6 px-2 text-xs"
              >
                <Settings2 className="w-3 h-3 mr-1" />
                Controls
                {showControls ? (
                  <ChevronUp className="w-3 h-3 ml-1" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-1" />
                )}
              </Button>
            )}
          </div>
        </div>

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

      {isPlaying && showControls && (
        <div className="space-y-2">
          {/* Speed Control */}
          <ControlPanel
            title="Speed"
            subtitle={`Tempo ${calculateBPM()} bpm`}
            value={speed}
            valueDisplay={`${speed}%`}
            min={25}
            max={400}
            step={1}
            onChange={setSpeed}
            onReset={resetSpeed}
            onDecrease={() => adjustSpeed(-5)}
            onIncrease={() => adjustSpeed(5)}
            disabled={!isPlayerReady}
          />

          {/* Loop Controls */}
          <div className="rounded-lg border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-medium">Loop</h3>
              <button
                onClick={toggleLoop}
                disabled={!isPlayerReady || loopStart === null || loopEnd === null}
                className={`rounded-full p-1.5 transition-colors ${isLooping
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                  } disabled:opacity-50`}
                title="Toggle loop"
              >
                <Repeat className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={() => setLoopMarker('start')}
                  disabled={!isPlayerReady}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-7"
                >
                  Set Start {loopStart !== null && `(${Math.floor(loopStart)}s)`}
                </Button>
                <Button
                  onClick={() => setLoopMarker('end')}
                  disabled={!isPlayerReady}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-7"
                >
                  Set End {loopEnd !== null && `(${Math.floor(loopEnd)}s)`}
                </Button>
              </div>

              {loopStart !== null && loopEnd !== null && (
                <p className="text-xs text-muted-foreground text-center">
                  Loop: {Math.floor(loopStart)}s - {Math.floor(loopEnd)}s
                  {isLooping && ' (Active)'}
                </p>
              )}

              {(loopStart !== null || loopEnd !== null) && (
                <Button
                  onClick={() => {
                    setLoopStart(null)
                    setLoopEnd(null)
                    setIsLooping(false)
                  }}
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs h-7"
                >
                  Clear Markers
                </Button>
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="rounded-lg border bg-muted/50 p-2 text-xs text-muted-foreground">
            <p className="font-medium mb-1 text-foreground">Keyboard Shortcuts:</p>
            <ul className="space-y-0.5">
              <li><kbd className="px-1 py-0.5 bg-background border rounded text-xs">,</kbd> / <kbd className="px-1 py-0.5 bg-background border rounded text-xs">.</kbd> Adjust Speed</li>
              <li><kbd className="px-1 py-0.5 bg-background border rounded text-xs">L</kbd> Toggle Loop</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
