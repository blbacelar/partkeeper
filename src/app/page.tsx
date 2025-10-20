'use client'

import { useState, useEffect, useMemo } from 'react'
import { Header } from '@/components/Header'
import { SongCard } from '@/components/SongCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Settings, Music, Plus } from 'lucide-react'
import { Song, songsDataSchema } from '@/lib/schemas'
import Link from 'next/link'

export default function Dashboard() {
  const [songs, setSongs] = useState<Song[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSongs() {
      try {
        const response = await fetch('/api/songs')
        if (!response.ok) {
          throw new Error('Failed to load songs')
        }
        const data = await response.json()
        const validatedData = songsDataSchema.parse(data)
        setSongs(validatedData.songs)
      } catch (error) {
        console.error('Failed to load songs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSongs()
  }, [])

  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return songs

    const query = searchQuery.toLowerCase()
    return songs.filter(song =>
      song.title.toLowerCase().includes(query) ||
      song.artist?.toLowerCase().includes(query) ||
      song.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }, [songs, searchQuery])

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text">
              Your Song Library
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link href="/songs/manage">
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Manage Songs
                </Button>
              </Link>
            </div>
          </div>

          {/* Search Section */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search songs, artists, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-2 focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Songs Grid */}
          {filteredSongs.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredSongs.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-16">
              <div className="space-y-4">
                <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">No songs found</h3>
                  <p className="text-muted-foreground">
                    No songs match &ldquo;{searchQuery}&rdquo;. Try a different search term.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="mt-4"
                >
                  Clear search
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="space-y-4">
                <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto">
                  <Music className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">No songs yet</h3>
                  <p className="text-muted-foreground">
                    Get started by adding your first song to the library.
                  </p>
                </div>
                <Link href="/songs/manage">
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Song
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}