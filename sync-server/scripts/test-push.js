const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: "file:./dev.db" } }
});

async function test() {
  try {
    const record = await prisma.resource.upsert({
      where: { id: "test-id" },
      update: {
        encPayload: "enc",
        type: "CONNECTION",
        name: "Test Name",
        collectionId: "test-col"
      },
      create: {
        id: "test-id",
        collectionId: "test-col",
        type: "CONNECTION",
        name: "Test Name",
        encPayload: "enc"
      }
    });
    console.log("Success", record);
  } catch (e) {
    console.error("Error", e);
  }
}
test();
