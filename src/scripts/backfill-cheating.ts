import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting backfill for cheated attempts...");
  
  const attempts = await prisma.testAttempt.findMany({
    where: { isCheated: true },
    include: { test: true }
  });

  let updatedCount = 0;

  for (const a of attempts) {
    if (!a.test) continue;

    const res = await prisma.enrollment.updateMany({
      where: {
        userId: a.userId,
        courseId: a.test.courseId,
        status: { not: "CHEATING" },
      },
      data: {
        status: "CHEATING",
      },
    });

    updatedCount += res.count;
  }

  console.log(`Updated ${updatedCount} enrollments to CHEATING status.`);
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
