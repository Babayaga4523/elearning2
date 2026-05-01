import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 RESTORING YOUTUBE URLs FOR TESTING...\n");

  // Update modules with YouTube URLs for testing
  const updates = [
    {
      id: "cmogqjp68000g3t5r5cungj8g",
      title: "Pengenalan Visi & Misi",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    {
      id: "cmogu0iob0002790yr7izvrxa",
      title: "IPA Video",
      url: "https://youtu.be/HBxt_v0WF6Y?si=p6FwOy4W_5UhNDjo",
    },
    {
      id: "cmol59wcw0001s9692u5imy7w",
      title: "materi 2",
      url: "https://youtu.be/n9Xgj8RRgmE?si=h8-9zespfv6Ptp7c",
    },
  ];

  for (const update of updates) {
    try {
      await prisma.module.update({
        where: { id: update.id },
        data: {
          url: update.url,
          videoUrl: update.url,
        },
      });
      console.log(`✅ Updated: ${update.title}`);
      console.log(`   URL: ${update.url}\n`);
    } catch (error) {
      console.log(`⚠️  Module ${update.id} not found, skipping...\n`);
    }
  }

  console.log("✅ YouTube URLs restored for testing!");
  console.log("\n🧪 TEST INSTRUCTIONS:");
  console.log("1. Refresh browser (Ctrl+Shift+R)");
  console.log("2. Login as budi.santoso@bnif.co.id");
  console.log("3. Go to any course with video modules");
  console.log("4. YouTube videos should now display with iframe!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
