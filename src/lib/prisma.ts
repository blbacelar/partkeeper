// Dynamic import to avoid build-time errors when Prisma client isn't generated
let PrismaClient: any = null
let prisma: any = null

try {
  const { PrismaClient: PC } = require('@prisma/client')
  PrismaClient = PC
} catch (error) {
  // Prisma client not available - this is expected during build
  console.warn('Prisma client not available during build')
}

const globalForPrisma = globalThis as unknown as {
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
