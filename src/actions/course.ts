"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { log } from "@/lib/logger";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function createCourse(data: { title: string; categoryId?: string }) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  // Validasi categoryId wajib ada
  if (!data.categoryId) {
    throw new Error("Kategori kursus wajib dipilih");
  }

  // Setelah validasi, kita tahu categoryId pasti ada
  const categoryId: string = data.categoryId;

  // [Fix Duplication] Check for existing "fresh" draft with same title and user
  // A fresh draft is unpublished and has no modules yet.
  const existingDraft = await db.course.findFirst({
    where: {
      userId: session.user.id!,
      title: data.title,
      isPublished: false,
      modules: {
        none: {}
      }
    }
  });

  if (existingDraft) {
    // If found, update category if it was changed in the form
    if (existingDraft.categoryId !== categoryId) {
      await db.course.update({
        where: { id: existingDraft.id },
        data: { categoryId }
      });
    }
    return existingDraft;
  }

  const course = await db.course.create({
    data: {
      userId: session.user.id!,
      title: data.title,
      categoryId,
    },
  });

  revalidatePath("/admin/courses");
  return course;
}

export async function updateCourse(id: string, values: any) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  // Validate input - only allow specific fields to be updated
  const allowedFields = [
    'title', 'description', 'categoryId', 'deadlineDate',
    'deadlineDuration', 'lockAfterDeadline', 'gracePeriodDays',
    'isPublished', 'isVisible'
  ];
  const sanitizedValues: Record<string, unknown> = {};

  for (const key of allowedFields) {
    if (key in values) {
      sanitizedValues[key] = values[key];
    }
  }

  // Parse deadlineDate string to Date if provided
  if (sanitizedValues.deadlineDate && typeof sanitizedValues.deadlineDate === 'string') {
    sanitizedValues.deadlineDate = new Date(sanitizedValues.deadlineDate as string);
  }

  const course = await db.course.update({
    where: { id },
    data: sanitizedValues,
  });

  // Jika deadlineDate diubah secara global, perbarui semua enrollment yang IN_PROGRESS
  if (sanitizedValues.deadlineDate !== undefined) {
    await db.enrollment.updateMany({
      where: {
        courseId: id,
        status: "IN_PROGRESS"
      },
      data: {
        deadline: sanitizedValues.deadlineDate
      }
    });
  }

  // Refined Revalidation Paths (Final Review Requirement)
  revalidatePath("/admin/courses");              // List kursus Admin
  revalidatePath(`/admin/courses/${id}`);        // Detail kursus Admin
  revalidatePath("/courses", "layout");          // Katalog karyawan (layout)
  revalidatePath(`/courses/${id}`);              // Detail kursus karyawan
  revalidatePath("/dashboard");                  // Dashboard karyawan

  return course;
}

export async function deleteCourse(id: string) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const course = await db.course.delete({
    where: { id },
  });

  revalidatePath("/admin/courses");
  revalidatePath("/courses", "layout");
  revalidatePath("/dashboard");
  return course;
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
  revalidatePath("/courses", "layout");
  revalidatePath(`/courses/${id}`);
  revalidatePath("/dashboard"); // Also for employees

  return course;
}

export async function createModule(courseId: string, data: { title: string }) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const lastModule = await db.module.findFirst({
    where: { courseId },
    orderBy: { position: "desc" },
  });

  const newPosition = lastModule ? lastModule.position + 1 : 1;

  const m = await db.module.create({
    data: {
      title: data.title,
      courseId,
      position: newPosition,
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}`);  // User course detail
  return m;
}

export async function reorderModules(courseId: string, updateData: { id: string; position: number }[]) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  for (const item of updateData) {
    await db.module.update({
      where: { id: item.id },
      data: { position: item.position }
    });
  }

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}`);  // User course detail
}

export async function createTest(courseId: string, data: { title: string; type: "PRE" | "POST" }) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const test = await db.test.create({
    data: {
      title: data.title,
      type: data.type,
      courseId,
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  return test;
}

export async function enroll(courseId: string) {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id!;

  // Check existing enrollment
  const existing = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  if (!existing) {
    // Fetch course and user info for notification
    const [course, user] = await Promise.all([
      db.course.findUnique({
        where: { id: courseId },
        select: { title: true },
      }),
      db.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, department: true },
      }),
    ]);

    const enrollment = await db.enrollment.create({
      data: {
        courseId,
        userId,
        status: "PENDING",
      },
    });

    // ─── Notify All Admins ────────────────────────────────────────────
    try {
      const admins = await db.user.findMany({
        where: { roles: { hasSome: ["ADMIN", "SUPER_ADMIN"] } },
        select: { id: true },
      });

      if (admins.length > 0 && course && user) {
        await db.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: "ENROLLMENT",
            title: "Pendaftaran Kursus Baru",
            body: `${user.name || user.email} (${user.department || "Dept. tidak diketahui"}) mendaftar kursus "${course.title}". Menunggu persetujuan Anda.`,
            href: "/admin/enrollments",
          })),
        });
      }
    } catch (notifErr) {
      log.error("[ENROLL] Failed to notify admins", { context: "enrollment", error: notifErr });
      // Don't throw - enrollment already created
    }

    revalidatePath(`/courses/${courseId}`);
    revalidatePath("/dashboard");
    return enrollment;
  }

  // Handle existing enrollment based on status (Refined Guard Logic)
  switch (existing.status) {
    case "REJECTED":
    case "FAILED":
      // Fetch course and user info for notification
      const [course, user] = await Promise.all([
        db.course.findUnique({
          where: { id: courseId },
          select: { title: true },
        }),
        db.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true, department: true },
        }),
      ]);

      // Reset audit fields and set back to PENDING for re-enrollment
      const updated = await db.enrollment.update({
        where: { id: existing.id },
        data: {
          status: "PENDING",
          rejectionNote: null,
          approvedById: null,
          approvedAt: null,
        },
      });

      // ─── Notify All Admins (Re-enrollment) ────────────────────────────
      try {
        const admins = await db.user.findMany({
          where: { roles: { hasSome: ["ADMIN", "SUPER_ADMIN"] } },
          select: { id: true },
        });

        if (admins.length > 0 && course && user) {
          await db.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              type: "ENROLLMENT",
              title: "Pendaftaran Ulang Kursus",
              body: `${user.name || user.email} (${user.department || "Dept. tidak diketahui"}) mendaftar ulang kursus "${course.title}". Menunggu persetujuan Anda.`,
              href: "/admin/enrollments",
            })),
          });
        }
      } catch (notifErr) {
        log.error("[ENROLL] Failed to notify admins", { context: "enrollment", error: notifErr });
        // Don't throw - enrollment already updated
      }

      revalidatePath(`/courses/${courseId}`);
      revalidatePath("/dashboard");
      return updated;
    case "PENDING":
      throw new Error("Pendaftaran Anda sedang menunggu persetujuan Admin.");
    case "IN_PROGRESS":
      throw new Error("Anda sudah terdaftar dan sedang mengikuti kursus ini.");
    case "COMPLETED":
      throw new Error("Anda sudah menyelesaikan kursus ini.");
    default:
      throw new Error(`Terjadi kesalahan (Status: ${existing.status}). Silakan hubungi Admin.`);
  }
}
