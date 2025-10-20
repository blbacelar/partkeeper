import { NextRequest, NextResponse } from 'next/server'
import { createSongsRepository } from '@/lib/repos/songs-repo'
import { Song } from '@/lib/schemas'

const repo = createSongsRepository<Song>()

export async function GET() {
  try {
    const data = await repo.list()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error reading songs:', error)
    return NextResponse.json({ error: 'Failed to read songs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const newSong: Omit<Song, 'id'> = await request.json()
    const created = await repo.create(newSong)
    return NextResponse.json(created)
  } catch (error) {
    console.error('Error adding song:', error)
    return NextResponse.json({ error: 'Failed to add song' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updatedSong }: Song = await request.json()
    const updated = await repo.update(id, updatedSong)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating song:', error)
    return NextResponse.json({ error: 'Failed to update song' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 })
    }
    await repo.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting song:', error)
    return NextResponse.json({ error: 'Failed to delete song' }, { status: 500 })
  }
}
