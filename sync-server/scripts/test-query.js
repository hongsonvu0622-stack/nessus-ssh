const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const tenant = await prisma.tenant.findFirst({
      include: {
        users: {
          include: {
            user: {
              select: { id: true, email: true, isSuperAdmin: true }
            }
          }
        },
        collections: {
          include: {
            resources: {
              select: {
                id: true,
                type: true,
                createdAt: true,
                updatedAt: true
              }
            },
            users: {
              include: {
                user: {
                  select: { id: true, email: true }
                }
              }
            }
          }
        }
      }
    });
    console.log("Success", !!tenant);
  } catch (e) {
    console.error("Prisma error:", e);
  }
}
test();
