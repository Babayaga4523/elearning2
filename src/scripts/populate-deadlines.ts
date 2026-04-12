import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting deadline population...");
  
  const enrollments = await (prisma.enrollment as any).findMany({
    where: {
      deadline: null,
    },
    include: {
      course: {
        select: {
          deadlineDuration: true,
        },
      },
    },
  });

  console.log(`Found ${enrollments.length} enrollments without deadlines.`);

  let updatedCount = 0;

  for (const enrollment of enrollments) {
    // Access with safe casting since types might be stale in some environments
    const course = (enrollment as any).course;
    
    if (course && course.deadlineDuration) {
      const createdAt = new Date(enrollment.createdAt);
      const deadline = new Date(createdAt);
      deadline.setDate(deadline.getDate() + course.deadlineDuration);

      await (prisma.enrollment as any).update({
        where: { id: enrollment.id },
        data: { deadline },
      });
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} enrollments with new deadlines.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
