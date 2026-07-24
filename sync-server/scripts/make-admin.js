const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const url = process.env.DATABASE_URL || "file:./dev.db";
let adapter;

if (url.startsWith('postgres') || url.startsWith('postgresql')) {
  const pool = new Pool({ connectionString: url });
  adapter = new PrismaPg(pool);
} else {
  adapter = new PrismaBetterSqlite3({ url });
}

const prisma = new PrismaClient({ adapter });

async function makeAdmin(email) {
  if (!email) {
    console.error('Usage: node make-admin.js <email>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { isSuperAdmin: true }
    });
    console.log(`Success! User ${user.email} is now a Global Admin.`);
  } catch (error) {
    console.error('Error:', error.meta?.cause || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin(process.argv[2]);
