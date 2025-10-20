'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { YouTubePart } from '@/components/YouTubePart'
import { LyricBlock } from '@/components/LyricBlock'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Music, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Song, songsDataSchema, Role } from '@/lib/schemas'
import { getStoredTab, setStoredTab } from '@/lib/storage'
import { motion } from 'framer-motion'

export default function SongDetails() {
  const params = useParams()
  const router = useRouter()
  const [song, setSong] = useState<Song | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('reference')

  const roles: Role[] = useMemo(() => ['1st-tenor', '2nd-tenor', 'baritone', 'bass'], [])

  useEffect(() => {
    async function loadSong() {
      try {
        const response = await fetch('/data/songs.json')
        const data = await response.json()
        const validatedData = songsDataSchema.parse(data)
        const foundSong = validatedData.songs.find(s => s.id === params.id)
        
        if (foundSong) {
          setSong(foundSong)
          // Check for stored tab preference
          const storedTab = getStoredTab(foundSong.id)
          if (storedTab && foundSong.parts[storedTab]) {
            setActiveTab(storedTab)
          } else if (foundSong.defaultRole && foundSong.parts[foundSong.defaultRole]) {
            setActiveTab(foundSong.defaultRole)
          }
        }
      } catch (error) {
        console.error('Failed to load song:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSong()
  }, [params.id])

  useEffect(() => {
    // Handle deep linking via hash
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash === 'reference' && song?.source) {
        setActiveTab('reference')
      } else if (hash && roles.includes(hash as Role) && song?.parts[hash as Role]) {
        setActiveTab(hash)
        setStoredTab(song.id, hash as Role)
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [song, roles])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (song && value !== 'reference') {
      const role = value as Role
      setStoredTab(song.id, role)
      // Update URL hash
      window.location.hash = role
    } else if (value === 'reference') {
      // Update URL hash for reference
      window.location.hash = 'reference'
    }
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

  if (!song) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Song not found</h2>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const availableRoles = roles.filter(role => song.parts[role])

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{song.title}</CardTitle>
              {song.artist && (
                <CardDescription className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {song.artist}
                </CardDescription>
              )}
              {song.tags && song.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {song.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </CardHeader>
            {song.notes && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{song.notes}</p>
              </CardContent>
            )}
          </Card>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger
                value="reference"
                disabled={!song.source}
                className="text-xs sm:text-sm"
              >
                Reference
              </TabsTrigger>
              {roles.map((role) => (
                <TabsTrigger
                  key={role}
                  value={role}
                  disabled={!song.parts[role]}
                  className="text-xs sm:text-sm"
                >
                  {role}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Reference Video Tab */}
            {song.source && (
              <TabsContent value="reference" className="mt-6">
                <motion.div
                  key="reference"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        Reference Video
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <YouTubePart
                        videoId={song.source}
                        title={`${song.title} - Reference`}
                      />
                    </CardContent>
                  </Card>

                  {song.lyrics && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Lyrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <LyricBlock lyrics={song.lyrics} />
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              </TabsContent>
            )}

            {/* Voice Part Tabs */}
            {availableRoles.map((role) => (
              <TabsContent key={role} value={role} className="mt-6">
                <motion.div
                  key={role}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        {role} Part
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <YouTubePart
                        videoId={song.parts[role]}
                        title={`${song.title} - ${role}`}
                      />
                    </CardContent>
                  </Card>

                  {song.lyrics && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Lyrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <LyricBlock lyrics={song.lyrics} />
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  )
}
