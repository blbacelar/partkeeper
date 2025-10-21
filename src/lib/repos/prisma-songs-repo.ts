import { prisma } from '@/lib/prisma'
import { SongsRepository, SongsRepoRecord } from './songs-repo'

export class PrismaSongsRepository<TSong extends { id: string }> implements SongsRepository<TSong> {
  private checkPrisma() {
    if (!prisma) {
      throw new Error('Prisma client not available. Make sure to run "npm run db:generate" first.')
    }
  }

  async list(): Promise<SongsRepoRecord<TSong>> {
    this.checkPrisma()
    
    console.log('PrismaSongsRepository: Starting to fetch songs...')
    console.log('PrismaSongsRepository: DATABASE_URL exists:', !!process.env.DATABASE_URL)
    
    const songs = await prisma.song.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('PrismaSongsRepository: Found songs:', songs.length)
    
    const meta = await prisma.meta.findFirst({
      orderBy: { updatedAt: 'desc' }
    })
    
    console.log('PrismaSongsRepository: Meta found:', !!meta)

    return {
      meta: {
        version: meta?.version || 1,
        updatedAt: meta?.updatedAt.toISOString() || new Date().toISOString()
      },
      songs: songs.map((song: unknown): TSong => {
        const s = song as Record<string, unknown>
        return {
          id: s.id as string,
          title: s.title as string,
          artist: s.artist as string | null,
          tags: s.tags as string[],
          defaultRole: s.defaultRole as string | null,
          parts: s.parts as Record<string, string>,
          lyrics: s.lyrics as string | null,
          source: s.source as string | null,
          notes: s.notes as string | null,
          updatedAt: (s.updatedAt as Date).toISOString()
        } as unknown as TSong
      })
    }
  }

  async create(data: Omit<TSong, "id">): Promise<TSong> {
    this.checkPrisma()
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
    this.checkPrisma()
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
    this.checkPrisma()
    await prisma.song.delete({
      where: { id }
    })

    // Update meta
    await this.updateMeta()
  }

  private async updateMeta(): Promise<void> {
    this.checkPrisma()
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
