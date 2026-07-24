const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./dev.db"
    }
  }
});

async function clean() {
  try {
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});
    console.log("Database reset!");
  } catch (e) {
    console.error("Clean error:", e);
  }
}
clean();
