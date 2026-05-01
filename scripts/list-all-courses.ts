import { PrismaClient } from "@/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n📚 ALL COURSES IN DATABASE:\n");
  console.log("═".repeat(80));

  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      isPublished: true,
      isVisible: true,
      _count: {
        select: {
          modules: true,
          enrollments: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  if (courses.length === 0) {
    console.log("\n❌ NO COURSES FOUND!\n");
    return;
  }

  courses.forEach((course, index) => {
    console.log(`\n${index + 1}. ${course.title}`);
    console.log(`   ID: ${course.id}`);
    console.log(`   Published: ${course.isPublished ? "✅" : "❌"}`);
    console.log(`   Visible: ${course.isVisible ? "✅" : "❌"}`);
    console.log(`   Modules: ${course._count.modules}`);
    console.log(`   Enrollments: ${course._count.enrollments}`);
  });

  console.log("\n" + "═".repeat(80));
  console.log(`\n✅ Total courses: ${courses.length}\n`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
