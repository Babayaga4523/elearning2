"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";

export async function createCourse(data: { title: string; categoryId?: string }) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  if (!data.categoryId) throw new Error("Kategori kursus wajib dipilih");

  const existingDraft = await db.course.findFirst({
    where: {
      userId: session.user.id,
      title: data.title,
      isPublished: false,
      modules: { none: {} },
    },
  });

  if (existingDraft) {
    if (existingDraft.categoryId !== data.categoryId) {
      await db.course.update({
        where: { id: existingDraft.id },
        data: { categoryId: data.categoryId },
      });
    }
    return existingDraft;
  }

  const course = await db.course.create({
    data: {
      userId: session.user.id,
      title: data.title,
      categoryId: data.categoryId!,
    },
  });

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  return course;
}

export async function updateCourse(id: string, values: Record<string, unknown>) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const ALLOWED = new Set([
    "title", "description", "categoryId", "deadlineDate",
    "deadlineDuration", "lockAfterDeadline", "gracePeriodDays",
    "isPublished", "isVisible",
  ]);

  const sanitized: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in values) sanitized[key] = values[key];
  }

  if (typeof sanitized.deadlineDate === "string") {
    sanitized.deadlineDate = new Date(sanitized.deadlineDate as string);
  }

  const course = await db.course.update({
    where: { id },
    data: sanitized,
  });

  if (sanitized.deadlineDate !== undefined) {
    await db.enrollment.updateMany({
      where: { courseId: id, status: "IN_PROGRESS" },
      data: { deadline: sanitized.deadlineDate as Date },
    });
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${id}`);
  revalidatePath("/courses");
  revalidatePath(`/courses/${id}`);
  revalidatePath("/dashboard");
  return course;
}

export async function deleteCourse(id: string) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  await db.course.delete({ where: { id } });

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidatePath("/dashboard");
}

export async function publishCourse(id: string, isPublished: boolean) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const course = await db.course.update({
    where: { id },
    data: { isPublished },
  });

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${id}`);
  revalidatePath("/courses");
  revalidatePath(`/courses/${id}`);
  revalidatePath("/dashboard");
  return course;
}

// ─── MODULE MANAGEMENT ───────────────────────────────────────

export async function createModule(
  courseId: string,
  data: { title: string; position?: number }
) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const last = await db.module.findFirst({
    where: { courseId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const position = data.position ?? (last?.position ?? 0) + 1;

  const m = await db.module.create({
    data: { courseId, title: data.title, position },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}`);
  return m;
}

export async function updateModule(id: string, values: Record<string, unknown>) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const ALLOWED = new Set([
    "title", "description", "position", "isPublished", "isFree",
    "duration", "type", "url", "pdfUrl", "sharepointUrl", "videoUrl",
    "fileSize", "originalFilename",
  ]);
  const sanitized: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in values) sanitized[key] = values[key];
  }

  const m = await db.module.update({ where: { id }, data: sanitized });

  revalidatePath(`/admin/courses/${m.courseId}`);
  revalidatePath(`/courses/${m.courseId}`);
  revalidatePath("/dashboard");
  return m;
}

export async function deleteModule(id: string) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const existing = await db.module.findUnique({ where: { id } });
  if (!existing) throw new Error("Module not found");

  const m = await db.module.delete({ where: { id } });

  revalidatePath(`/admin/courses/${m.courseId}`);
  revalidatePath(`/courses/${m.courseId}`);
  revalidatePath("/dashboard");
  return m;
}

// ─── TEST MANAGEMENT ──────────────────────────────────────

export async function createTest(
  courseId: string,
  data: { title: string; type: "PRE" | "POST" }
) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const test = await db.test.create({ data: { courseId, title: data.title, type: data.type } });

  revalidatePath(`/admin/courses/${courseId}`);
  return test;
}

// ─── USER ENROLLMENT ──────────────────────────────────────

export async function enroll(courseId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (!existing) {
    // New enrollment
    const enrollment = await db.enrollment.create({
      data: { userId, courseId, status: "PENDING" },
    });

    // Notify admins
    const admins = await db.user.findMany({
      where: { roles: { hasSome: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });
    if (admins.length > 0) {
      try {
        await db.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            type: "ENROLLMENT",
            title: "Pendaftaran Baru",
            body: "Ada pendaftaran kursus baru yang menunggu persetujuan Anda.",
            href: "/admin/enrollments",
          })),
        });
      } catch {
        // Non-fatal
      }
    }

    revalidatePath("/courses");
    revalidatePath("/dashboard");
    return enrollment;
  }

  // Existing enrollment
  if (existing.status === "PENDING") {
    throw new Error("Pendaftaran sedang menunggu persetujuan.");
  }
  if (existing.status === "IN_PROGRESS") {
    throw new Error("Anda sudah terdaftar dan sedang mengikuti kursus ini.");
  }
  if (existing.status === "COMPLETED") {
    throw new Error("Anda sudah menyelesaikan kursus ini.");
  }
  if (existing.status === "REJECTED" || existing.status === "FAILED") {
    const updated = await db.enrollment.update({
      where: { id: existing.id },
      data: { status: "PENDING", rejectionNote: null },
    });

    // Notify admins
    const admins = await db.user.findMany({
      where: { roles: { hasSome: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });
    if (admins.length > 0) {
      try {
        await db.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            type: "ENROLLMENT",
            title: "Pendaftaran Baru",
            body: "Ada pendaftaran kursus baru yang menunggu persetujuan Anda.",
            href: "/admin/enrollments",
          })),
        });
      } catch {
        // Non-fatal
      }
    }

    revalidatePath("/courses");
    revalidatePath("/dashboard");
    return updated;
  }

  throw new Error("Status enrollment tidak dikenali. Hubungi admin.");
}
