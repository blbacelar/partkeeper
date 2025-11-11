export type SongsRepoMeta = { version: number; updatedAt: string }

export type SongsRepoRecord<T> = { meta: SongsRepoMeta; songs: T[] }

export interface SongsRepository<TSong> {
  list(): Promise<SongsRepoRecord<TSong>>
  create(data: Omit<TSong, "id">): Promise<TSong>
  update(id: string, data: Omit<TSong, "id">): Promise<TSong>
  delete(id: string): Promise<void>
}

// Factory - currently only Prisma implementation is used
export function createSongsRepository<TSong extends { id: string }>(): SongsRepository<TSong> {
  // Dynamic import to avoid loading Prisma client when not needed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaSongsRepository } = require('./prisma-songs-repo')
  return new (PrismaSongsRepository as new () => SongsRepository<TSong>)()
}
