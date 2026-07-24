const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const collections = await prisma.collection.findMany({
    include: { users: true, resources: true }
  });
  console.log(JSON.stringify(collections, null, 2));
}
check();
