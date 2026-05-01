import { PrismaClient } from "@/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🎥 CHECKING VIDEO MODULES STATUS\n");
  console.log("═".repeat(80));

  // 1. Check published courses with video modules
  const coursesWithVideos = await prisma.course.findMany({
    where: {
      isPublished: true,
      modules: {
        some: {
          type: "VIDEO",
          isPublished: true,
        }
      }
    },
    include: {
      modules: {
        where: {
          type: "VIDEO",
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          videoUrl: true,
          url: true,
          isPublished: true,
        }
      },
      enrollments: {
        where: {
          user: {
            email: "budi.santoso@bnif.co.id"
          }
        },
        select: {
          status: true,
          user: {
            select: { email: true, name: true }
          }
        }
      }
    }
  });

  if (coursesWithVideos.length === 0) {
    console.log("❌ NO PUBLISHED COURSES WITH VIDEO MODULES FOUND!");
    console.log("\n💡 To test video player:");
    console.log("   1. Create a course");
    console.log("   2. Add a video module with valid videoUrl");
    console.log("   3. Publish the course");
    console.log("   4. Enroll Budi to the course");
    return;
  }

  console.log(`\n📚 FOUND ${coursesWithVideos.length} PUBLISHED COURSE(S) WITH VIDEO MODULES:\n`);

  coursesWithVideos.forEach((course, index) => {
    console.log(`${index + 1}. 📖 ${course.title}`);
    console.log(`   Course ID: ${course.id}`);
    console.log(`   Published: ✅`);
    console.log(`   Video Modules: ${course.modules.length}`);
    
    // Check Budi's enrollment
    if (course.enrollments.length > 0) {
      const enrollment = course.enrollments[0];
      console.log(`   Budi Enrolled: ✅ (Status: ${enrollment.status})`);
    } else {
      console.log(`   Budi Enrolled: ❌ NOT ENROLLED`);
    }

    // Check video modules
    course.modules.forEach((module, idx) => {
      console.log(`\n   📹 Video Module ${idx + 1}: ${module.title}`);
      console.log(`      Module ID: ${module.id}`);
      console.log(`      Published: ${module.isPublished ? "✅" : "❌"}`);
      
      const videoUrl = module.videoUrl || module.url;
      if (videoUrl) {
        console.log(`      Video URL: ✅ ${videoUrl}`);
        
        // Basic URL validation
        try {
          new URL(videoUrl);
          console.log(`      URL Valid: ✅`);
        } catch {
          console.log(`      URL Valid: ❌ INVALID URL FORMAT`);
        }
      } else {
        console.log(`      Video URL: ❌ MISSING`);
      }
    });

    console.log("\n" + "─".repeat(60));
  });

  // 2. Check Budi's current role
  const budi = await prisma.user.findUnique({
    where: { email: "budi.santoso@bnif.co.id" },
    select: {
      name: true,
      roles: true,
      activeRole: true,
    }
  });

  if (budi) {
    console.log("\n👤 BUDI SANTOSO STATUS:");
    console.log(`   Roles: [${budi.roles.join(", ")}]`);
    console.log(`   Active Role: ${budi.activeRole || "null (must select on login)"}`);
    
    if (budi.activeRole === "KARYAWAN") {
      console.log(`   ✅ Can access video modules as KARYAWAN`);
    } else if (budi.activeRole === "ADMIN") {
      console.log(`   ✅ Can access video modules as ADMIN (all courses)`);
    } else {
      console.log(`   ⚠️  Must select role on login to access courses`);
    }
  }

  console.log("\n" + "═".repeat(80));
  
  // 3. Provide testing instructions
  console.log("\n🧪 TESTING INSTRUCTIONS:");
  console.log("1. Login as budi.santoso@bnif.co.id");
  console.log("2. Select 'Karyawan' role");
  console.log("3. Go to Dashboard → Courses");
  console.log("4. Click on enrolled course");
  console.log("5. Click on video module");
  console.log("6. Video player should appear");
  
  if (coursesWithVideos.some(c => c.enrollments.length === 0)) {
    console.log("\n⚠️  ISSUE: Budi not enrolled to some courses");
    console.log("   Solution: Admin should enroll Budi to courses with video modules");
  }

  if (coursesWithVideos.some(c => c.modules.some(m => !m.videoUrl && !m.url))) {
    console.log("\n⚠️  ISSUE: Some video modules have no URL");
    console.log("   Solution: Admin should add valid video URLs to modules");
  }

  console.log("\n");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });