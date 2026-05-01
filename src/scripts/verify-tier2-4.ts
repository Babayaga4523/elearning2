import { db } from "../lib/db";
import { createEnrollment } from "../lib/enrollment";
import { updateCourse } from "../actions/course";

async function verify() {
  console.log("--- START VERIFICATION TIER 2 & 4 ---");

  // 1. Fetch test data
  const user = await (db as any).user.findFirst();
  const course = await (db as any).course.findFirst({
    where: { isPublished: true }
  });

  if (!user || !course) {
    console.error("Missing test data.");
    return;
  }

  console.log(`Testing with Course: ${course.title}`);

  // 2. Test Tier 2: Bulk Deadline Sync
  console.log("\n1. Testing Bulk Deadline Sync (Tier 2)...");
  
  // Create a fresh enrollment
  const enrollment = await createEnrollment({
    userId: user.id,
    courseId: course.id,
    source: "MANUAL"
  }).catch(() => null);

  if (!enrollment) {
    console.log("Enrollment already exists, using existing one.");
  }

  const activeEnrollment = await (db.enrollment as any).findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } }
  });

  console.log("Current Enrollment Deadline:", activeEnrollment.deadline);

  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1); // 1 year from now
  
  console.log(`Updating Course Deadline to: ${futureDate.toISOString()}`);
  await updateCourse(course.id, { deadlineDate: futureDate });

  const updatedEnrollment = await (db.enrollment as any).findUnique({
    where: { id: activeEnrollment.id }
  });

  console.log("Updated Enrollment Deadline:", updatedEnrollment.deadline);

  if (updatedEnrollment.deadline?.getTime() === futureDate.getTime()) {
    console.log("✅ Success: Bulk Sync propagated the new deadline to the enrollment.");
  } else {
    console.error("❌ Failed: Enrollment deadline was not updated.");
  }

  // 3. Test Tier 4: Enrollment Source Tracking
  console.log("\n2. Testing Source Tracking (Tier 4)...");
  
  const sources: ("MANUAL" | "AUTO" | "BULK")[] = ["AUTO", "BULK"];
  for (const src of sources) {
    // We'll use a unique temp user for this to avoid constraint issues
    const tempUser = await (db.user as any).create({
      data: {
        email: `tester_${src.toLowerCase()}@test.com`,
        name: `Tester ${src}`,
        role: "KARYAWAN"
      }
    });

    const enr = await createEnrollment({
      userId: tempUser.id,
      courseId: course.id,
      source: src
    });

    console.log(`Created ${src} Enrollment. Source in DB:`, enr.source);

    if (enr.source === src) {
      console.log(`✅ Success: Source correctly saved as ${src}.`);
    } else {
      console.error(`❌ Failed: Expected ${src}, got ${enr.source}.`);
    }

    // Cleanup
    await (db.enrollment as any).delete({ where: { id: enr.id } });
    await (db.user as any).delete({ where: { id: tempUser.id } });
  }

  console.log("\n--- VERIFICATION COMPLETE ---");
}

verify().catch(console.error).finally(() => db.$disconnect());
