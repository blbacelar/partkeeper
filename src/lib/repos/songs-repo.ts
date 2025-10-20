export type SongsRepoMeta = { version: number; updatedAt: string }

export type SongsRepoRecord<T> = { meta: SongsRepoMeta; songs: T[] }

export interface SongsRepository<TSong> {
  list(): Promise<SongsRepoRecord<TSong>>
  create(data: Omit<TSong, "id">): Promise<TSong>
  update(id: string, data: Omit<TSong, "id">): Promise<TSong>
  delete(id: string): Promise<void>
}

// File-based implementation for development
import { readFile, writeFile } from "fs/promises"
import { join } from "path"
import { songsDataSchema } from "@/lib/schemas"

class FileSongsRepository<TSong extends { id: string }> implements SongsRepository<TSong> {
  constructor(private filePath: string) {}

  private async read(): Promise<SongsRepoRecord<TSong>> {
    const content = await readFile(this.filePath, "utf-8")
    const json = JSON.parse(content)
    const parsed = songsDataSchema.parse(json)
    return parsed as unknown as SongsRepoRecord<TSong>
  }

  private async write(data: SongsRepoRecord<TSong>): Promise<void> {
    await writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8")
  }

  async list(): Promise<SongsRepoRecord<TSong>> {
    return await this.read()
  }

  async create(data: Omit<TSong, "id">): Promise<TSong> {
    const current = await this.read()
    const id = `song-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const song = ({ ...(data as Record<string, unknown>), id, updatedAt: new Date().toISOString() } as unknown) as TSong
    const next: SongsRepoRecord<TSong> = {
      meta: { version: current.meta.version, updatedAt: new Date().toISOString() },
      songs: [...current.songs, song],
    }
    await this.write(next)
    return song
  }

  async update(id: string, data: Omit<TSong, "id">): Promise<TSong> {
    const current = await this.read()
    const exists = current.songs.find((s) => s.id === id)
    if (!exists) throw new Error("Song not found")
    const updated = ({ ...(data as Record<string, unknown>), id, updatedAt: new Date().toISOString() } as unknown) as TSong
    const next: SongsRepoRecord<TSong> = {
      meta: { version: current.meta.version, updatedAt: new Date().toISOString() },
      songs: current.songs.map((s) => (s.id === id ? updated : s)),
    }
    await this.write(next)
    return updated
  }

  async delete(id: string): Promise<void> {
    const current = await this.read()
    const filtered = current.songs.filter((s) => s.id !== id)
    if (filtered.length === current.songs.length) throw new Error("Song not found")
    const next: SongsRepoRecord<TSong> = {
      meta: { version: current.meta.version, updatedAt: new Date().toISOString() },
      songs: filtered,
    }
    await this.write(next)
  }
}

// In-memory implementation for production (Vercel serverless)
class MemorySongsRepository<TSong extends { id: string }> implements SongsRepository<TSong> {
  private data: SongsRepoRecord<TSong> | null = null

  private async loadData(): Promise<SongsRepoRecord<TSong>> {
    if (this.data) return this.data
    
    try {
      // Try to read from the public file (read-only in production)
      const response = await fetch('/data/songs.json')
      if (!response.ok) throw new Error('Failed to load songs')
      const json = await response.json()
      const parsed = songsDataSchema.parse(json)
      this.data = parsed as unknown as SongsRepoRecord<TSong>
      return this.data
    } catch (error) {
      console.error('Error loading songs:', error)
      // Return empty data if file can't be read
      this.data = {
        meta: { version: 1, updatedAt: new Date().toISOString() },
        songs: []
      }
      return this.data
    }
  }

  async list(): Promise<SongsRepoRecord<TSong>> {
    return await this.loadData()
  }

  async create(data: Omit<TSong, "id">): Promise<TSong> {
    const current = await this.loadData()
    const id = `song-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const song = ({ ...(data as Record<string, unknown>), id, updatedAt: new Date().toISOString() } as unknown) as TSong
    const next: SongsRepoRecord<TSong> = {
      meta: { version: current.meta.version, updatedAt: new Date().toISOString() },
      songs: [...current.songs, song],
    }
    this.data = next
    return song
  }

  async update(id: string, data: Omit<TSong, "id">): Promise<TSong> {
    const current = await this.loadData()
    const exists = current.songs.find((s) => s.id === id)
    if (!exists) throw new Error("Song not found")
    const updated = ({ ...(data as Record<string, unknown>), id, updatedAt: new Date().toISOString() } as unknown) as TSong
    const next: SongsRepoRecord<TSong> = {
      meta: { version: current.meta.version, updatedAt: new Date().toISOString() },
      songs: current.songs.map((s) => (s.id === id ? updated : s)),
    }
    this.data = next
    return updated
  }

  async delete(id: string): Promise<void> {
    const current = await this.loadData()
    const filtered = current.songs.filter((s) => s.id !== id)
    if (filtered.length === current.songs.length) throw new Error("Song not found")
    const next: SongsRepoRecord<TSong> = {
      meta: { version: current.meta.version, updatedAt: new Date().toISOString() },
      songs: filtered,
    }
    this.data = next
  }
}

// Factory
export function createSongsRepository<TSong extends { id: string }>(): SongsRepository<TSong> {
  const backend = process.env.NEXT_PUBLIC_SONGS_BACKEND || "file"
  const isProduction = process.env.NODE_ENV === "production"
  
  if (backend === "file") {
    // Use memory repository in production (Vercel serverless)
    if (isProduction) {
      return new MemorySongsRepository<TSong>()
    }
    // Use file repository in development
    const path = process.env.SONGS_FILE_PATH || join(process.cwd(), "public", "data", "songs.json")
    return new FileSongsRepository<TSong>(path)
  }
  
  if (backend === "prisma") {
    // Dynamic import to avoid loading Prisma client when not needed
    const { PrismaSongsRepository } = require('./prisma-songs-repo')
    return new (PrismaSongsRepository as any)()
  }
  
  throw new Error(`Unsupported backend: ${backend}`)
}
