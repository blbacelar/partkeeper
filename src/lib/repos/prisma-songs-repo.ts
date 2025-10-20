import { prisma } from '@/lib/prisma'
import { SongsRepository, SongsRepoRecord } from './songs-repo'

export class PrismaSongsRepository<TSong extends { id: string }> implements SongsRepository<TSong> {
  async list(): Promise<SongsRepoRecord<TSong>> {
    const songs = await prisma.song.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    const meta = await prisma.meta.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    return {
      meta: {
        version: meta?.version || 1,
        updatedAt: meta?.updatedAt.toISOString() || new Date().toISOString()
      },
      songs: songs.map((song): TSong => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        tags: song.tags,
        defaultRole: song.defaultRole as string | null,
        parts: song.parts as Record<string, string>,
        lyrics: song.lyrics,
        source: song.source,
        notes: song.notes,
        updatedAt: song.updatedAt.toISOString()
      } as unknown as TSong))
    }
  }

  async create(data: Omit<TSong, "id">): Promise<TSong> {
    const songData = data as Record<string, unknown>
    const song = await prisma.song.create({
      data: {
        title: songData.title as string,
        artist: songData.artist as string | null,
        tags: (songData.tags as string[]) || [],
        defaultRole: songData.defaultRole as string | null,
        parts: (songData.parts as Record<string, string>) || {},
        lyrics: songData.lyrics as string | null,
        source: songData.source as string | null,
        notes: songData.notes as string | null
      }
    })

    // Update meta
    await this.updateMeta()

    return {
      id: song.id,
      title: song.title,
      artist: song.artist,
      tags: song.tags,
      defaultRole: song.defaultRole as string | null,
      parts: song.parts as Record<string, string>,
      lyrics: song.lyrics,
      source: song.source,
      notes: song.notes,
      updatedAt: song.updatedAt.toISOString()
    } as unknown as TSong
  }

  async update(id: string, data: Omit<TSong, "id">): Promise<TSong> {
    const songData = data as Record<string, unknown>
    const song = await prisma.song.update({
      where: { id },
      data: {
        title: songData.title as string,
        artist: songData.artist as string | null,
        tags: (songData.tags as string[]) || [],
        defaultRole: songData.defaultRole as string | null,
        parts: (songData.parts as Record<string, string>) || {},
        lyrics: songData.lyrics as string | null,
        source: songData.source as string | null,
        notes: songData.notes as string | null
      }
    })

    // Update meta
    await this.updateMeta()

    return {
      id: song.id,
      title: song.title,
      artist: song.artist,
      tags: song.tags,
      defaultRole: song.defaultRole as string | null,
      parts: song.parts as Record<string, string>,
      lyrics: song.lyrics,
      source: song.source,
      notes: song.notes,
      updatedAt: song.updatedAt.toISOString()
    } as unknown as TSong
  }

  async delete(id: string): Promise<void> {
    await prisma.song.delete({
      where: { id }
    })

    // Update meta
    await this.updateMeta()
  }

  private async updateMeta(): Promise<void> {
    await prisma.meta.upsert({
      where: { id: 'main' },
      update: {
        updatedAt: new Date()
      },
      create: {
        id: 'main',
        version: 1,
        updatedAt: new Date()
      }
    })
  }
}
