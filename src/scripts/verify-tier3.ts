import { db } from "../lib/db";
import { runProactiveReminders } from "../lib/scheduler";

async function verifyTier3() {
  console.log("--- START VERIFICATION TIER 3 ---");

  // 1. Data Setup
  const user = await (db as any).user.findFirst();
  const course = await (db as any).course.findFirst({
    where: { isPublished: true }
  });

  if (!user || !course) {
    console.error("Missing test data.");
    return;
  }

  // Helper to create test enrollment
  const createTestEnrollment = async (daysAhead: number) => {
    const deadline = new Date();
    deadline.setHours(12, 0, 0, 0); // Mid-day
    deadline.setDate(deadline.getDate() + daysAhead);

    // Delete existing to avoid unique constraint if we use same user/course
    await (db as any).enrollment.deleteMany({
      where: { userId: user.id, courseId: course.id }
    });

    return await (db as any).enrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        deadline,
        status: "IN_PROGRESS",
        source: "TEST"
      }
    });
  };

  console.log("\nTesting H-7 Reminder...");
  const e7 = await createTestEnrollment(7);
  const res7 = await runProactiveReminders();
  console.log("Result H-7 (Sent means processed):", res7);

  const updated7 = await (db as any).enrollment.findUnique({ where: { id: e7.id } });
  if (updated7.remindedAt7d) {
    console.log("✅ H-7 Flagged in DB (Process worked despite possible email error).");
  } else {
    console.error("❌ H-7 Failed to flag.");
  }

  // Verify Notification created
  const notif = await (db as any).notification.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });
  if (notif && notif.title.includes("Peringatan Deadline")) {
    console.log("✅ System Notification (Bell) created successfully.");
  } else {
    console.error("❌ System Notification missing.");
  }

  console.log("\n--- VERIFICATION COMPLETE ---");
}

verifyTier3().catch(console.error).finally(() => db.$disconnect());
