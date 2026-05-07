import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking courses without category...\n");

  const coursesWithoutCategory = await prisma.course.findMany({
    where: {
      categoryId: null,
    },
    select: {
      id: true,
      title: true,
      isPublished: true,
    },
  });

  console.log(`Found ${coursesWithoutCategory.length} courses without category:\n`);
  
  if (coursesWithoutCategory.length > 0) {
    coursesWithoutCategory.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title} (${course.isPublished ? "Published" : "Draft"})`);
    });
  } else {
    console.log("✅ All courses have categories!");
  }

  console.log("\n📊 Category summary:");
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { courses: true },
      },
    },
  });

  categories.forEach((cat) => {
    console.log(`  - ${cat.name}: ${cat._count.courses} courses`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
