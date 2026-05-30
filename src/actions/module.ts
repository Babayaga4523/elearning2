"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function completeModule(moduleId: string, isCompleted: boolean) {
  const session = await auth();

  if (!session || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const isAdmin = session.user.activeRole === "ADMIN" || session.user.activeRole === "SUPER_ADMIN";

  const m = await db.module.findUnique({
    where: { id: moduleId },
    include: {
      course: {
        select: { deadlineDate: true }
      }
    }
  });

  if (!m) {
    throw new Error("Module not found");
  }

  // Admin can mark modules complete in preview mode without enrollment
  let enrollment: { id: string; status: string } | null = null;

  if (!isAdmin) {
    enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: m.courseId } },
    });

    if (!enrollment) {
      throw new Error("Not enrolled");
    }
    if (!["IN_PROGRESS", "FAILED", "COMPLETED"].includes(enrollment.status)) {
      throw new Error("ENROLLMENT_NOT_ACTIVE");
    }

    if (m.course.deadlineDate && m.course.deadlineDate.getTime() < Date.now()) {
      throw new Error("DEADLINE_PASSED");
    }
  }

  const progress = await db.userProgress.upsert({
    where: {
      userId_moduleId: {
        userId,
        moduleId,
      },
    },
    update: {
      isCompleted,
    },
    create: {
      userId,
      moduleId,
      isCompleted,
    },
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Business Rule: Enrollment COMPLETED requires:
  //   1. ALL published modules in the course are completed (isCompleted = true)
  //   2. Post-Test exists AND user has passed it (score >= passingScore)
  //
  // Note: Pre-Test does NOT affect enrollment completion status.
  // Note: If a course has NO Post-Test, enrollment COMPLETED after all modules done.
  // ──────────────────────────────────────────────────────────────────────────────
  if (isCompleted && enrollment) {
    const courseModules = await db.module.findMany({
      where: { courseId: m.courseId, isPublished: true },
      select: { id: true }
    });

    const completedModules = await db.userProgress.findMany({
      where: {
        userId,
        isCompleted: true,
        moduleId: { in: courseModules.map(cm => cm.id) }
      },
      select: { moduleId: true }
    });

    // Check if all modules are completed
    const allModulesCompleted = completedModules.length >= courseModules.length;

    if (allModulesCompleted && enrollment.status !== "COMPLETED") {
      // IMPORTANT: Check if Post-Test exists and if user has passed it
      const postTest = await db.test.findFirst({
        where: {
          courseId: m.courseId,
          type: "POST"
        },
        select: { id: true }
      });

      let canComplete = true;

      // If Post-Test exists, check if user has passed it
      if (postTest) {
        const passedPostTest = await db.testAttempt.findFirst({
          where: {
            userId,
            testId: postTest.id,
            passed: true
          }
        });

        // User must pass Post-Test to complete the course
        canComplete = !!passedPostTest;
      }

      // Only mark as COMPLETED if all modules done AND Post-Test passed (if exists)
      if (canComplete) {
        // Use transaction to prevent race condition
        await db.$transaction(async (tx) => {
          // Re-check enrollment status inside transaction
          const currentEnrollment = await tx.enrollment.findUnique({
            where: { id: enrollment.id },
            select: { status: true }
          });

          // Only update if still not COMPLETED (prevents duplicate notifications)
          if (currentEnrollment && currentEnrollment.status !== "COMPLETED") {
            await tx.enrollment.update({
              where: { id: enrollment.id },
              data: {
                status: "COMPLETED"
              }
            });

            // Get course title for notification
            const course = await tx.course.findUnique({
              where: { id: m.courseId },
              select: { title: true }
            });

            // Create notification
            await tx.notification.create({
              data: {
                userId,
                type: "SYSTEM",
                title: "Selamat! Kursus Selesai",
                body: `Anda telah menyelesaikan kursus "${course?.title || "Kursus"}".`,
                href: `/courses/${m.courseId}`,
              },
            });
          }
        });
      }
    }
  }

  revalidatePath(`/courses/${m.courseId}/modules/${moduleId}`);
  revalidatePath(`/courses/${m.courseId}`);
  revalidatePath("/dashboard");

  return progress;
}

export async function createModule(courseId: string, data: { title: string; position: number }) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const m = await db.module.create({
    data: {
      courseId,
      title: data.title,
      position: data.position,
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  return m;
}

export async function updateModule(id: string, values: Record<string, unknown>) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  // Whitelist: only allow specific fields to be updated via this action
  const allowedFields = [
    "title", "description", "position", "isPublished", "isFree",
    "duration", "type", "url", "pdfUrl", "sharepointUrl", "videoUrl",
    "fileSize", "originalFilename",
  ];
  const sanitized: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in values) {
      sanitized[key] = values[key];
    }
  }

  const m = await db.module.update({
    where: { id },
    data: sanitized,
  });

  revalidatePath(`/admin/courses/${m.courseId}`);
  revalidatePath(`/courses/${m.courseId}`);
  revalidatePath("/dashboard");
  return m;
}

export async function deleteModule(id: string) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const existingModule = await db.module.findUnique({
    where: { id },
  });

  if (!existingModule) throw new Error("Module not found");

  const m = await db.module.delete({
    where: { id },
  });

  revalidatePath(`/admin/courses/${m.courseId}`);
  revalidatePath(`/courses/${m.courseId}`);
  revalidatePath("/dashboard");
  return m;
}
