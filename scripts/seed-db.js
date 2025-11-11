import fs from 'fs'
import path from 'path'

// Dynamic import to avoid build-time errors when Prisma client isn't generated
async function getPrismaClient() {
  try {
    const { PrismaClient } = await import('@prisma/client')
    return new PrismaClient()
  } catch (error) {
    console.error('Prisma client not found. Run "npm run db:generate" first.')
    throw error
  }
}

async function seedDatabase() {
  const prisma = await getPrismaClient()
  
  try {
    console.log('🌱 Seeding database...')

    // Read the existing songs.json file
    const songsPath = path.join(process.cwd(), 'public', 'data', 'songs.json')
    const songsData = JSON.parse(fs.readFileSync(songsPath, 'utf-8'))

    // Clear existing data
    await prisma.song.deleteMany()
    await prisma.meta.deleteMany()

    // Create meta record
    await prisma.meta.create({
      data: {
        id: 'main',
        version: songsData.meta.version,
        updatedAt: new Date(songsData.meta.updatedAt)
      }
    })

    // Create songs
    for (const song of songsData.songs) {
      await prisma.song.create({
        data: {
          id: song.id,
          title: song.title,
          artist: song.artist,
          tags: song.tags || [],
          defaultRole: song.defaultRole,
          parts: song.parts,
          lyrics: song.lyrics,
          source: song.source,
          soundTrackUrl: song.soundTrackUrl,
          notes: song.notes,
          updatedAt: new Date(song.updatedAt),
          createdAt: new Date(song.updatedAt) // Use updatedAt as createdAt for existing songs
        }
      })
    }

    console.log(`✅ Successfully seeded ${songsData.songs.length} songs`)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedDatabase()
