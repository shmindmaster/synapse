// Database connection setup using Prisma 7.0.1 with pg adapter
// Reference: Prisma 7 requires adapter pattern (no url in schema)
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pkg from 'pg';
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

// Enhanced connection pool configuration
const pool = new Pool({
  connectionString,
  max: 20, // Maximum 20 connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout connection attempts after 2s
  maxUses: 7500, // Recycle connections after 7500 uses
});

// Handle pool errors
pool.on('error', err => {
  console.error('Unexpected database pool error', err);
});

const adapter = new PrismaPg(pool);

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Prisma Client with pg adapter and optimized logging
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Cache client in development to avoid recreating on hot reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Export pool for direct query access if needed
export { pool };
