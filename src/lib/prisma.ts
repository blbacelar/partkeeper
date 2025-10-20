// Dynamic import to avoid build-time errors when Prisma client isn't generated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PrismaClient: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prisma: any = null

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient: PC } = require('@prisma/client')
  PrismaClient = PC
} catch {
  // Prisma client not available - this is expected during build
  console.warn('Prisma client not available during build')
}

const globalForPrisma = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any
}

if (PrismaClient) {
  prisma = globalForPrisma.prisma ?? new PrismaClient()
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
} else {
  // Fallback for when Prisma client is not available
  prisma = null
}

export { prisma }
