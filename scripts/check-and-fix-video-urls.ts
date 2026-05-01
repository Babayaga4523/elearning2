import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🎥 CHECKING VIDEO MODULES...\n");

  // 1. Find all video modules
  const videoModules = await prisma.module.findMany({
    where: {
      type: "VIDEO",
      isPublished: true,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          isPublished: true,
        }
      }
    }
  });

  console.log(`Found ${videoModules.length} published video modules\n`);

  for (const module of videoModules) {
    console.log(`📹 ${module.title}`);
    console.log(`   Course: ${module.course.title}`);
    console.log(`   Module ID: ${module.id}`);
    console.log(`   videoUrl: ${module.videoUrl || 'NULL'}`);
    console.log(`   url: ${module.url || 'NULL'}`);
    
    // Check if module has any video URL
    const hasVideoUrl = module.videoUrl || module.url;
    
    if (!hasVideoUrl) {
      console.log(`   ❌ NO VIDEO URL - Adding sample URL`);
      
      // Add a sample video URL for testing
      const sampleVideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
      
      await prisma.module.update({
        where: { id: module.id },
        data: {
          videoUrl: sampleVideoUrl,
        }
      });
      
      console.log(`   ✅ Added sample video URL: ${sampleVideoUrl}`);
    } else {
      console.log(`   ✅ Has video URL`);
    }
    
    console.log("");
  }

  // 2. Check if Budi is enrolled to courses with video modules
  const budi = await prisma.user.findUnique({
    where: { email: "budi.santoso@bnif.co.id" },
    include: {
      enrollments: {
        include: {
          course: {
            include: {
              modules: {
                where: {
                  type: "VIDEO",
                  isPublished: true,
                }
              }
            }
          }
        }
      }
    }
  });

  if (budi) {
    console.log(`👤 BUDI'S ENROLLMENTS WITH VIDEO MODULES:`);
    console.log(`   Active Role: ${(budi as any).activeRole || 'NULL'}`);
    console.log(`   Roles: [${(budi as any).roles?.join(', ') || 'NULL'}]`);
    
    const enrollmentsWithVideos = budi.enrollments.filter(e => 
      e.course.modules.length > 0
    );
    
    console.log(`   Enrolled courses with videos: ${enrollmentsWithVideos.length}`);
    
    enrollmentsWithVideos.forEach(enrollment => {
      console.log(`   📚 ${enrollment.course.title} (${enrollment.course.modules.length} video modules)`);
    });
  }

  console.log("\n✅ Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());