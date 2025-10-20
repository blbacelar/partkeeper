'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { SongForm } from '@/components/SongForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { Song, songsDataSchema } from '@/lib/schemas'
import { useRouter } from 'next/navigation'

export default function SongManagement() {
  const router = useRouter()
  const [songs, setSongs] = useState<Song[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)

  useEffect(() => {
    loadSongs()
  }, [])

  const loadSongs = async () => {
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

  const handleAddSong = () => {
    setEditingSong(null)
    setShowForm(true)
  }

  const handleEditSong = (song: Song) => {
    setEditingSong(song)
    setShowForm(true)
  }

  const handleSaveSong = async (songData: Omit<Song, 'id'>) => {
    let response: Response
    
    if (editingSong) {
      // Update existing song
      response = await fetch('/api/songs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...songData, id: editingSong.id }),
      })
    } else {
      // Add new song
      response = await fetch('/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(songData),
      })
    }
    
    if (!response.ok) {
      throw new Error('Failed to save song')
    }
    
    // Reload songs from API
    await loadSongs()
    
    setShowForm(false)
    setEditingSong(null)
  }

  const handleDeleteSong = async (songId: string) => {
    if (confirm('Are you sure you want to delete this song?')) {
      try {
        const response = await fetch(`/api/songs?id=${songId}`, {
          method: 'DELETE',
        })
        
        if (!response.ok) {
          throw new Error('Failed to delete song')
        }
        
        // Reload songs from API
        await loadSongs()
      } catch (error) {
        console.error('Failed to delete song:', error)
        alert('Failed to delete song. Please try again.')
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingSong(null)
  }

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

  if (showForm) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Songs
              </Button>
            </div>
            <SongForm
              song={editingSong}
              onSave={handleSaveSong}
              onCancel={handleCancel}
              isEditing={!!editingSong}
            />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* Mobile-friendly header */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Song Management</h2>
                <p className="text-muted-foreground">
                  Manage your song library
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button 
                  onClick={handleAddSong}
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Song
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {songs.map((song) => (
              <Card key={song.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg line-clamp-2">{song.title}</CardTitle>
                  {song.artist && (
                    <CardDescription className="line-clamp-1">{song.artist}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {song.tags && song.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {song.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {song.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{song.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    {Object.values(song.parts).filter(Boolean).length} voice parts
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSong(song)}
                      className="flex-1 text-xs"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSong(song.id)}
                      className="text-destructive hover:text-destructive px-3"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {songs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No songs in your library yet</p>
              <Button onClick={handleAddSong}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Song
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
