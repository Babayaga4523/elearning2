import { db } from "@/lib/db";

export type EnrollmentSource = "MANUAL" | "AUTO" | "BULK";

/**
 * ─── DEADLINE RESOLUTION LOGIC ─────────────────────────────────────────────
 * Prioritizes fixed deadlineDate over relative duration.
 */
export function resolveDeadline(
  course: { deadlineDate: Date | null; deadlineDuration: number | null },
  enrollmentDate: Date = new Date()
): Date | null {
  // 1. Fixed date always wins
  if (course.deadlineDate) return course.deadlineDate;

  // 2. Relative duration fallback
  if (course.deadlineDuration) {
    const deadline = new Date(enrollmentDate);
    deadline.setDate(deadline.getDate() + course.deadlineDuration);
    return deadline;
  }

  return null;
}

/**
 * ─── CREATE SINGLE ENROLLMENT ──────────────────────────────────────────────
 */
export async function createEnrollment({
  userId,
  courseId,
  source = "MANUAL",
}: {
  userId: string;
  courseId: string;
  source?: EnrollmentSource;
}) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { deadlineDate: true, deadlineDuration: true, isPublished: true },
  });

  if (!course) throw new Error("Course not found");
  if (!course.isPublished) throw new Error("Course is not published");

  const deadline = resolveDeadline(course);

  return (db.enrollment as any).create({
    data: {
      userId,
      courseId,
      deadline,
      source,
      status: "IN_PROGRESS",
    },
  });
}

/**
 * ─── BATCH CREATE ENROLLMENTS ──────────────────────────────────────────────
 * Optimized to prevent N+1 queries.
 */
export async function batchCreateEnrollments({
  userIds,
  courseId,
  source = "BULK",
}: {
  userIds: string[];
  courseId: string;
  source?: EnrollmentSource;
}) {
  if (userIds.length === 0) return { count: 0 };

  // 1. Fetch course ONCE outside the loop
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { deadlineDate: true, deadlineDuration: true, isPublished: true },
  });

  if (!course) throw new Error("Course not found");
  if (!course.isPublished) throw new Error("Course is not published");

  const deadline = resolveDeadline(course);

  // 2. Chunking for safety (Standard Prisma pattern)
  const chunkSize = 500;
  let totalCreated = 0;

  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);

    // Filter already enrolled in this chunk if needed (Action-dependent, but safer here)
    const existing = await (db.enrollment as any).findMany({
      where: { courseId, userId: { in: chunk } },
      select: { userId: true },
    });
    const enrolledIds = new Set(existing.map((e: any) => e.userId));
    const toEnroll = chunk.filter((id) => !enrolledIds.has(id));

    if (toEnroll.length === 0) continue;

    const result = await (db.enrollment as any).createMany({
      data: toEnroll.map((userId) => ({
        userId,
        courseId,
        deadline,
        source,
        status: "IN_PROGRESS",
      })),
      skipDuplicates: true,
    });

    totalCreated += result.count;
  }

  return { count: totalCreated };
}
