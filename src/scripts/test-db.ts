import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function test() {
  console.log("--- DB STATE VERIFICATION ---");
  
  // 1. Check Courses
  const courses = await prisma.course.findMany({
    take: 3,
    select: {
      id: true,
      title: true,
      deadlineDuration: true,
      deadlineDate: true
    }
  });
  console.log("\nCourses Sample:", JSON.stringify(courses, null, 2));

  // 2. Check Enrollments
  const enrollments = await prisma.enrollment.findMany({
    take: 5,
    select: {
      id: true,
      source: true,
      deadline: true,
      reportedAt: true,
      status: true
    }
  });
  console.log("\nEnrollments Sample:", JSON.stringify(enrollments, null, 2));

  console.log("\n--- VERIFICATION COMPLETE ---");
}

test().catch(console.error).finally(() => prisma.$disconnect());
