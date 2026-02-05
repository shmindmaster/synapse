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

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Prisma Client with pg adapter (Prisma 7 pattern)
export const prisma = new PrismaClient({ adapter });

// Export pool for legacy compatibility (if needed)
export { pool };
