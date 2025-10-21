// Dynamic import to avoid build-time errors when Prisma client isn't generated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PrismaClient: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prisma: any = null

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient: PC } = require('@prisma/client')
  PrismaClient = PC
  console.log('Prisma client loaded successfully')
} catch (error) {
  // Prisma client not available - this is expected during build
  console.warn('Prisma client not available:', error instanceof Error ? error.message : 'Unknown error')
}

const globalForPrisma = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any
}

if (PrismaClient) {
  try {
    prisma = globalForPrisma.prisma ?? new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    })
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
    console.log('Prisma client initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Prisma client:', error)
    prisma = null
  }
} else {
  // Fallback for when Prisma client is not available
  console.error('Prisma client not available - make sure to run "npm run db:generate"')
  prisma = null
}

export { prisma }
