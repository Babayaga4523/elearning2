import { PrismaClient } from "@/generated/client";

const prisma = new PrismaClient();

async function main() {
  const courseId = "cmoqgjp680003t5rk9c3ns84";
  
  console.log(`\n🔍 Checking course: ${courseId}\n`);
  console.log("═".repeat(80));

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      enrollments: {
        where: {
          user: {
            email: "budi.santoso@bnif.co.id"
          }
        }
      },
      modules: {
        select: {
          id: true,
          title: true,
          isPublished: true,
        }
      }
    }
  });

  if (!course) {
    console.log("❌ Course NOT FOUND in database!");
    return;
  }

  console.log("\n📚 COURSE DETAILS:");
  console.log(`   Title: ${course.title}`);
  console.log(`   Published: ${course.isPublished ? "✅ YES" : "❌ NO"}`);
  console.log(`   Visible: ${course.isVisible ? "✅ YES" : "❌ NO"}`);
  console.log(`   Modules: ${course.modules.length}`);
  console.log(`   Published Modules: ${course.modules.filter(m => m.isPublished).length}`);

  console.log("\n👤 BUDI SANTOSO ENROLLMENT:");
  if (course.enrollments.length > 0) {
    const enrollment = course.enrollments[0];
    console.log(`   ✅ ENROLLED`);
    console.log(`   Status: ${enrollment.status}`);
    console.log(`   Enrolled at: ${enrollment.createdAt}`);
  } else {
    console.log(`   ❌ NOT ENROLLED`);
  }

  console.log("\n" + "═".repeat(80));
  
  // Check Budi's roles
  const budi = await prisma.user.findUnique({
    where: { email: "budi.santoso@bnif.co.id" },
    select: {
      name: true,
      roles: true,
      activeRole: true,
    }
  });

  if (budi) {
    console.log("\n👤 BUDI SANTOSO:");
    console.log(`   Roles: [${budi.roles.join(", ")}]`);
    console.log(`   Active Role: ${budi.activeRole || "null"}`);
  }

  console.log("\n💡 DIAGNOSIS:");
  if (!course.isPublished) {
    console.log("   ❌ Course is NOT PUBLISHED - Karyawan cannot access");
    console.log("   ✅ Solution: Publish the course or login as Admin");
  } else if (!course.isVisible && course.enrollments.length === 0) {
    console.log("   ❌ Course is NOT VISIBLE and user is NOT ENROLLED");
    console.log("   ✅ Solution: Make course visible OR enroll Budi");
  } else if (budi && budi.activeRole !== "KARYAWAN") {
    console.log(`   ⚠️  Budi's active role is: ${budi.activeRole}`);
    console.log("   ✅ Solution: Budi should select KARYAWAN role on login");
  } else {
    console.log("   ✅ Course should be accessible!");
    console.log("   ⚠️  Check server logs for other issues");
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
