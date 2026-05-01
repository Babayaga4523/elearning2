import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 FIXING VIDEO URLs FOR HTML5 PLAYER...\n");

  // Sample video URLs that work with HTML5 video player
  const sampleVideos = [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  ];

  // Find video modules with YouTube URLs (won't work with HTML5 player)
  const videoModules = await prisma.module.findMany({
    where: {
      type: "VIDEO",
      isPublished: true,
      OR: [
        { videoUrl: { contains: "youtube.com" } },
        { videoUrl: { contains: "youtu.be" } },
        { url: { contains: "youtube.com" } },
        { url: { contains: "youtu.be" } },
      ]
    },
    include: {
      course: {
        select: {
          title: true,
        }
      }
    }
  });

  console.log(`Found ${videoModules.length} modules with YouTube URLs\n`);

  for (let i = 0; i < videoModules.length; i++) {
    const module = videoModules[i];
    const newVideoUrl = sampleVideos[i % sampleVideos.length];
    
    console.log(`📹 Updating: ${module.title}`);
    console.log(`   Course: ${module.course.title}`);
    console.log(`   Old URL: ${module.videoUrl || module.url}`);
    console.log(`   New URL: ${newVideoUrl}`);
    
    await prisma.module.update({
      where: { id: module.id },
      data: {
        videoUrl: newVideoUrl,
        url: newVideoUrl, // Update both fields
      }
    });
    
    console.log(`   ✅ Updated!\n`);
  }

  // Also ensure Budi has the correct role
  const budi = await prisma.user.findUnique({
    where: { email: "budi.santoso@bnif.co.id" }
  });

  if (budi && !budi.activeRole) {
    console.log("🔧 Setting Budi's active role to KARYAWAN...");
    
    await prisma.user.update({
      where: { id: budi.id },
      data: {
        activeRole: "KARYAWAN"
      }
    });
    
    console.log("✅ Budi's active role set to KARYAWAN");
  }

  console.log("\n✅ All video URLs updated for HTML5 player compatibility!");
  console.log("\n🧪 TEST INSTRUCTIONS:");
  console.log("1. Login as budi.santoso@bnif.co.id");
  console.log("2. Go to Dashboard → Courses");
  console.log("3. Click on any enrolled course");
  console.log("4. Click on video module");
  console.log("5. Video should now play properly!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());