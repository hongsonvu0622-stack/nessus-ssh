import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import Database from 'better-sqlite3';
import { Pool } from 'pg';

const globalForPrisma = global;
function createPrismaClient() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  
  const url = process.env.DATABASE_URL || "file:./dev.db";
  let adapter;
  
  if (url.startsWith('postgres') || url.startsWith('postgresql')) {
    const pool = new Pool({ connectionString: url });
    adapter = new PrismaPg(pool);
  } else {
    adapter = new PrismaBetterSqlite3({ url });
  }

  return new PrismaClient({ adapter });
}

export const prisma = createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
