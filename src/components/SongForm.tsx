'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Save, Edit, Loader2 } from 'lucide-react'
import { Song, Role } from '@/lib/schemas'

interface SongFormProps {
  song?: Song | null
  onSave: (song: Omit<Song, 'id'>) => void
  onCancel: () => void
  isEditing?: boolean
}

export function SongForm({ song, onSave, onCancel, isEditing = false }: SongFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    tags: [] as string[],
    defaultRole: '1st-tenor' as Role,
    parts: {
      '1st-tenor': '',
      '2nd-tenor': '',
      'baritone': '',
      'bass': ''
    },
    lyrics: '',
    source: '',
    notes: ''
  })

  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (song) {
      setFormData({
        title: song.title,
        artist: song.artist || '',
        tags: song.tags || [],
        defaultRole: song.defaultRole || '1st-tenor',
        parts: {
          '1st-tenor': song.parts['1st-tenor'] || '',
          '2nd-tenor': song.parts['2nd-tenor'] || '',
          'baritone': song.parts['baritone'] || '',
          'bass': song.parts['bass'] || ''
        },
        lyrics: song.lyrics || '',
        source: song.source || '',
        notes: song.notes || ''
      })
    }
  }, [song])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.parts['1st-tenor'] && !formData.parts['2nd-tenor'] && 
        !formData.parts['baritone'] && !formData.parts['bass']) {
      newErrors.parts = 'At least one voice part is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const songData = {
        ...formData,
        artist: formData.artist || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        defaultRole: formData.defaultRole || undefined,
        lyrics: formData.lyrics || undefined,
        source: formData.source || undefined,
        notes: formData.notes || undefined
      }

      await onSave(songData)
    } finally {
      setIsLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const updatePart = (role: Role, value: string) => {
    setFormData(prev => ({
      ...prev,
      parts: {
        ...prev.parts,
        [role]: value
      }
    }))
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEditing ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {isEditing ? 'Edit Song' : 'Add New Song'}
        </CardTitle>
        <CardDescription>
          {isEditing ? 'Update the song details below' : 'Fill in the song information to add it to your library'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Song title"
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="artist">Artist</Label>
              <Input
                id="artist"
                value={formData.artist}
                onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
                placeholder="Artist name"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Default Role */}
          <div className="space-y-2">
            <Label htmlFor="defaultRole">Default Role</Label>
            <select
              id="defaultRole"
              value={formData.defaultRole}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultRole: e.target.value as Role }))}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="1st-tenor">1st Tenor</option>
              <option value="2nd-tenor">2nd Tenor</option>
              <option value="baritone">Baritone</option>
              <option value="bass">Bass</option>
            </select>
          </div>

          {/* Voice Parts */}
          <div className="space-y-4">
            <Label>Voice Parts *</Label>
            {errors.parts && <p className="text-sm text-destructive">{errors.parts}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['1st-tenor', '2nd-tenor', 'baritone', 'bass'] as Role[]).map((role) => (
                <div key={role} className="space-y-2">
                  <Label htmlFor={`part-${role}`}>{role}</Label>
                  <Input
                    id={`part-${role}`}
                    value={formData.parts[role]}
                    onChange={(e) => updatePart(role, e.target.value)}
                    placeholder="YouTube URL or video ID"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Lyrics */}
          <div className="space-y-2">
            <Label htmlFor="lyrics">Lyrics</Label>
            <Textarea
              id="lyrics"
              value={formData.lyrics}
              onChange={(e) => setFormData(prev => ({ ...prev, lyrics: e.target.value }))}
              placeholder="Enter song lyrics..."
              rows={6}
            />
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
              placeholder="Original source or reference"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or instructions..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Update Song' : 'Add Song'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
