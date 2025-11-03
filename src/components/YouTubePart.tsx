'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, Minus, Plus, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type YTPlayer = {
  playVideo?: () => void
  stopVideo?: () => void
  destroy?: () => void
  setPlaybackRate?: (rate: number) => void
  getPlaybackRate?: () => number
  getAvailablePlaybackRates?: () => number[]
  getCurrentTime?: () => number
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
  const [fineTuneCents, setFineTuneCents] = useState(0)
  const [speedPercent, setSpeedPercent] = useState(100)
  const [appliedPlaybackRate, setAppliedPlaybackRate] = useState(1)
  const playerContainerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const loadPromiseRef = useRef<Promise<YouTubeApi | undefined> | null>(null)
  const loopCheckRef = useRef<number | null>(null)
  const [loopStart, setLoopStart] = useState<number | null>(null)
  const [loopEnd, setLoopEnd] = useState<number | null>(null)
  const [loopEnabled, setLoopEnabled] = useState(false)

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
      try {
        const parsed = JSON.parse(storedValue) as {
          transpose?: number
          fine?: number
          speed?: number
        }
        if (typeof parsed.transpose === 'number') {
          setPitchSemitones(parsed.transpose)
        }
        if (typeof parsed.fine === 'number') {
          setFineTuneCents(parsed.fine)
        }
        if (typeof parsed.speed === 'number') {
          setSpeedPercent(parsed.speed)
        }
      } catch {
        const legacy = Number.parseFloat(storedValue)
        if (!Number.isNaN(legacy)) {
          setPitchSemitones(legacy)
        }
      }
    }
  }, [storageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const payload = JSON.stringify({
      transpose: pitchSemitones,
      fine: fineTuneCents,
      speed: speedPercent,
    })
    window.localStorage.setItem(storageKey, payload)
  }, [fineTuneCents, pitchSemitones, speedPercent, storageKey])

  const applyPlayback = useCallback(() => {
    const player = playerRef.current
    if (!player || !player.setPlaybackRate) return

    const transposeMultiplier = Math.pow(2, pitchSemitones / 12)
    const fineMultiplier = Math.pow(2, fineTuneCents / 1200)
    const desiredRate = (speedPercent / 100) * transposeMultiplier * fineMultiplier

    const availableRates = player.getAvailablePlaybackRates?.()
    let targetRate = desiredRate

    if (availableRates && availableRates.length > 0) {
      const closest = availableRates.reduce((prev, candidate) => {
        const prevDiff = Math.abs(prev - desiredRate)
        const candidateDiff = Math.abs(candidate - desiredRate)
        return candidateDiff < prevDiff ? candidate : prev
      }, availableRates[0])

      if (Math.abs(closest - desiredRate) <= 0.01) {
        targetRate = closest
      }
    }

    const clampedRate = Math.min(Math.max(targetRate, 0.0625), 4)
    player.setPlaybackRate(clampedRate)
    setAppliedPlaybackRate(clampedRate)
  }, [fineTuneCents, pitchSemitones, speedPercent])

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
            applyPlayback()
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
  }, [actualVideoId, applyPlayback, isPlaying, loadYouTubeApi])

  useEffect(() => {
    if (isPlaying) return

    if (playerRef.current) {
      playerRef.current.stopVideo?.()
      playerRef.current.destroy?.()
      playerRef.current = null
    }

    setIsPlayerReady(false)
    setAppliedPlaybackRate(1)
    setLoopEnabled(false)
    setLoopStart(null)
    setLoopEnd(null)
    if (loopCheckRef.current !== null) {
      window.clearInterval(loopCheckRef.current)
      loopCheckRef.current = null
    }
  }, [isPlaying])

  useEffect(() => {
    if (!loopEnabled || !playerRef.current || loopStart === null || loopEnd === null) {
      if (loopCheckRef.current !== null) {
        window.clearInterval(loopCheckRef.current)
        loopCheckRef.current = null
      }
      return
    }

    loopCheckRef.current = window.setInterval(() => {
      const player = playerRef.current
      const current = player?.getCurrentTime?.() ?? 0
      if (current >= loopEnd) {
        player?.seekTo?.(loopStart, true)
        player?.playVideo?.()
      }
    }, 250)

    return () => {
      if (loopCheckRef.current !== null) {
        window.clearInterval(loopCheckRef.current)
        loopCheckRef.current = null
      }
    }
  }, [loopEnabled, loopEnd, loopStart])

  useEffect(() => {
    if (loopStart !== null && loopEnd !== null && loopEnd <= loopStart) {
      setLoopEnabled(false)
    }
  }, [loopEnd, loopStart])

  const computeDisplayFrequency = () => {
    const baseFrequency = 440
    const semitoneDelta = pitchSemitones + fineTuneCents / 100
    const multiplier = Math.pow(2, semitoneDelta / 12)
    return baseFrequency * multiplier
  }

  const changeTranspose = (delta: number) => {
    setPitchSemitones((prev) => {
      const next = Math.min(12, Math.max(-12, prev + delta))
      return next
    })
  }

  const changeFine = (delta: number) => {
    setFineTuneCents((prev) => {
      const next = Math.min(100, Math.max(-100, prev + delta))
      return next
    })
  }

  const changeSpeed = (delta: number) => {
    setSpeedPercent((prev) => {
      const next = Math.min(400, Math.max(25, prev + delta))
      return next
    })
  }

  useEffect(() => {
    if (!isPlayerReady) return
    applyPlayback()
  }, [applyPlayback, fineTuneCents, pitchSemitones, speedPercent, isPlayerReady])

  const currentTempoDisplay = () => {
    const tempoMultiplier = appliedPlaybackRate / (speedPercent / 100 || 1)
    return tempoMultiplier
  }

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
        <div className="space-y-3">
          <div className="space-y-2 rounded-2xl border border-border bg-zinc-900/70 p-4 text-white shadow-inner">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
              <span>Transpose</span>
              <span className="font-semibold text-base text-white">
                {pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => changeTranspose(-1)}
                className="h-8 w-8 rounded-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <input
                aria-label="Transpose"
                type="range"
                min={-12}
                max={12}
                step={1}
                value={pitchSemitones}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10)
                  setPitchSemitones(value)
                }}
                className="h-2 flex-1 appearance-none rounded-full bg-zinc-700 accent-amber-400"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => changeTranspose(1)}
                className="h-8 w-8 rounded-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPitchSemitones(0)}
                disabled={pitchSemitones === 0}
                className="h-8 w-8 rounded-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-border bg-zinc-900/70 p-4 text-white shadow-inner">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
              <span>Pitch&nbsp;{computeDisplayFrequency().toFixed(1)} Hz</span>
              <span className="font-semibold text-base text-white">
                {fineTuneCents >= 0 ? '+' : ''}
                {(fineTuneCents / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => changeFine(-5)}
                className="h-8 w-8 rounded-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <input
                aria-label="Fine tune"
                type="range"
                min={-100}
                max={100}
                step={1}
                value={fineTuneCents}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10)
                  setFineTuneCents(value)
                }}
                className="h-2 flex-1 appearance-none rounded-full bg-zinc-700 accent-amber-400"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => changeFine(5)}
                className="h-8 w-8 rounded-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setFineTuneCents(0)}
                disabled={fineTuneCents === 0}
                className="h-8 w-8 rounded-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-border bg-zinc-900/70 p-4 text-white shadow-inner">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
              <span>Speed {speedPercent}% Tempo</span>
              <span className="font-semibold text-base text-white">{(currentTempoDisplay() * 100).toFixed(0)} bpm</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => changeSpeed(-5)}
                className="h-8 w-8 rounded-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <input
                aria-label="Speed"
                type="range"
                min={25}
                max={400}
                step={1}
                value={speedPercent}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10)
                  setSpeedPercent(value)
                }}
                className="h-2 flex-1 appearance-none rounded-full bg-zinc-700 accent-amber-400"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => changeSpeed(5)}
                className="h-8 w-8 rounded-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSpeedPercent(100)}
                disabled={speedPercent === 100}
                className="h-8 w-8 rounded-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-zinc-400">Playback rate applied: {appliedPlaybackRate.toFixed(2)}x</p>
          </div>

          <div className="space-y-2 rounded-2xl border border-dashed border-amber-500/50 bg-amber-500/5 p-4 text-sm text-amber-200">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-amber-300/80">
              <span>Loop Section</span>
              <span>{loopEnabled && loopStart !== null && loopEnd !== null ? `${loopStart.toFixed(1)}s → ${loopEnd.toFixed(1)}s` : 'Disabled'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="bg-amber-500/20 text-amber-100 hover:bg-amber-500/30"
                disabled={!isPlayerReady}
                onClick={() => {
                  const current = playerRef.current?.getCurrentTime?.()
                  if (typeof current === 'number') {
                    setLoopStart(current)
                    if (loopEnd !== null && current >= loopEnd) {
                      setLoopEnd(current + 1)
                    }
                  }
                }}
              >
                Set Start
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="bg-amber-500/20 text-amber-100 hover:bg-amber-500/30"
                disabled={!isPlayerReady}
                onClick={() => {
                  const current = playerRef.current?.getCurrentTime?.()
                  if (typeof current === 'number') {
                    setLoopEnd(current)
                    if (loopStart !== null && current <= loopStart) {
                      setLoopStart(Math.max(0, current - 1))
                    }
                  }
                }}
              >
                Set End
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="bg-amber-500/20 text-amber-100 hover:bg-amber-500/30"
                disabled={!isPlayerReady || loopStart === null || loopEnd === null || loopEnd <= loopStart}
                onClick={() => setLoopEnabled((prev) => !prev)}
              >
                {loopEnabled ? 'Disable Loop' : 'Enable Loop'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="bg-transparent text-amber-200 hover:bg-amber-500/10"
                onClick={() => {
                  setLoopStart(null)
                  setLoopEnd(null)
                  setLoopEnabled(false)
                }}
              >
                Clear Markers
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
