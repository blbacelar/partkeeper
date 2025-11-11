import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Song } from '@/lib/schemas'
import { Music, Users, Calendar, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface SongCardProps {
  song: Song
}

export function SongCard({ song }: SongCardProps) {
  const availableParts = Object.keys(song.parts).length
  const hasSource = !!song.source
  const hasLyrics = !!song.lyrics
  const hasSoundTrack = !!song.soundTrackUrl

  return (
    <Link href={`/songs/${song.id}`} className="block group">
      <Card className="hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer border-2 hover:border-primary/20 bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                {song.title}
              </CardTitle>
              {song.artist && (
                <CardDescription className="text-base mt-1 flex items-center gap-1">
                  <Music className="h-3 w-3" />
                  {song.artist}
                </CardDescription>
              )}
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {(song.tags && song.tags.length > 0) || hasSoundTrack ? (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {song.tags?.slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {tag}
                </Badge>
              ))}
              {song.tags && song.tags.length > 4 && (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  +{song.tags.length - 4} more
                </Badge>
              )}
              {hasSoundTrack && (
                <Badge className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 transition-colors">
                  Sound Track
                </Badge>
              )}
            </div>
          ) : null}

          {/* Features */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{availableParts} voice parts available</span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              {hasSource && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Reference video</span>
                </div>
              )}
              {hasLyrics && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Lyrics included</span>
                </div>
              )}
              {hasSoundTrack && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Sound track available</span>
                </div>
              )}
            </div>

            {/* Updated date */}
            {song.updatedAt && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Updated {new Date(song.updatedAt).toLocaleDateString()}</span>
              </div>
            )}

            {hasSoundTrack && (
              <div className="mt-3">
                <audio
                  controls
                  preload="none"
                  className="w-full"
                  src={song.soundTrackUrl ?? undefined}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
