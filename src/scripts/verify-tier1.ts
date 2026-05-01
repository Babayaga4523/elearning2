import { db } from "../lib/db";
import { createEnrollment } from "../lib/enrollment";
import { runDeadlineMonitoring } from "../lib/scheduler";

async function verify() {
  console.log("--- START VERIFICATION TIER 1 ---");

  // 1. Fetch data
  const user = await (db as any).user.findFirst();
  const course = await (db as any).course.findFirst({
    where: { 
      deadlineDuration: { not: null },
      isPublished: true
    }
  });

  if (!user || !course) {
    console.error("Missing test data (User/Course).");
    return;
  }

  console.log(`Testing with User: ${user.email}, Course: ${course.title}`);

  // 2. Test Manual Enrollment Deadline
  console.log("\n1. Testing Manual Enrollment Deadline...");
  const enrollment = await createEnrollment({
    userId: user.id,
    courseId: course.id,
    source: "MANUAL"
  });

  console.log("Enrollment created:", {
    id: enrollment.id,
    deadline: enrollment.deadline,
    source: enrollment.source
  });

  if (enrollment.deadline && enrollment.source === "MANUAL") {
    console.log("✅ Success: Deadline populated and source is MANUAL.");
  } else {
    console.error("❌ Failed: Deadline is null or source is incorrect.");
  }

  // CLEANUP for next test
  await (db as any).enrollment.delete({ where: { id: enrollment.id } });

  // 3. Test Fault-Tolerant Reporting (Idempotency)
  console.log("\n2. Testing Fault-Tolerant Reporting...");
  
  // Create an expired enrollment artificially
  const expiredDate = new Date();
  expiredDate.setDate(expiredDate.getDate() - 5); // 5 days ago

  const expiredEnrollment = await (db.enrollment as any).create({
    data: {
      userId: user.id,
      courseId: course.id,
      deadline: expiredDate,
      status: "IN_PROGRESS",
      source: "BULK",
      reportedAt: null
    }
  }).catch(() => null); // Might fail if unique constraint hits

  if (expiredEnrollment) {
    console.log("Created expired enrollment for testing.");
    
    console.log("Running Deadline Monitoring (Attempt 1)...");
    const result1 = await runDeadlineMonitoring();
    console.log("Result 1:", result1);

    const updated = await (db.enrollment as any).findUnique({
      where: { id: expiredEnrollment.id }
    });
    
    if (updated.reportedAt) {
      console.log("✅ Success: reportedAt populated after cron.");
    } else {
      console.error("❌ Failed: reportedAt remains null.");
    }

    console.log("Running Deadline Monitoring (Attempt 2 - Idempotency)...");
    const result2 = await runDeadlineMonitoring();
    console.log("Result 2 (should be empty/success):", result2);
    
    if (result2.status === "SUCCESS" && (result2 as any).message?.includes("Tidak ada")) {
      console.log("✅ Success: Duplicate report avoided.");
    } else {
      console.error("❌ Failed: Re-reported already flagged enrollment.");
    }
  } else {
    console.log("Skipping expired test (Enrollment already exists).");
  }

  console.log("\n--- VERIFICATION COMPLETE ---");
}

verify().catch(console.error).finally(() => db.$disconnect());
