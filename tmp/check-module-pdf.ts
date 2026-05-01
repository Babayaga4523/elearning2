import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const module = await prisma.module.findUnique({
    where: { id: "cmnr33m8k00013gnkr6tabeym" },
  });
  if (module) {
    console.log("Module Title:", module.title);
    console.log("Module Type:", module.type);
    console.log("PDF URL:", module.pdfUrl);
    console.log("General URL:", module.url);
  } else {
    console.log("Module not found");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
