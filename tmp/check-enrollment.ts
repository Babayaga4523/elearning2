import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const enrollment = await prisma.enrollment.findFirst({
    where: { 
      courseId: "cmnqzjk3p0000ftlat11vxeph",
      userId: "cmnmy9v200000zqv18sg54noo" // Using the course creator's ID just to check, or I should find the recent one
    },
    orderBy: { createdAt: "desc" }
  });
  console.log("Enrollment Record:", JSON.stringify(enrollment, null, 2));

  const allEnrollments = await prisma.enrollment.findMany({
    where: { courseId: "cmnqzjk3p0000ftlat11vxeph" },
    include: { user: true }
  });
  console.log("All Enrollments:", JSON.stringify(allEnrollments, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
