const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const preTests = await prisma.test.updateMany({
    where: { type: "PRE" },
    data: { type: "PRE_TEST" }
  });
  const postTests = await prisma.test.updateMany({
    where: { type: "POST" },
    data: { type: "POST_TEST" }
  });
  console.log(`Updated ${preTests.count} pre-tests and ${postTests.count} post-tests.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
