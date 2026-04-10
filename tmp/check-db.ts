import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.findUnique({
    where: { id: "cmnqzjk3p0000ftlat11vxeph" },
  });
  console.log("Course Record:", JSON.stringify(course, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
