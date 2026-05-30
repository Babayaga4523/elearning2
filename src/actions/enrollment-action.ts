"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function enroll(courseId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (!existing) {
    const [course, user] = await Promise.all([
      db.course.findUnique({ where: { id: courseId }, select: { title: true } }),
      db.user.findUnique({ where: { id: userId }, select: { name: true, email: true, department: true } }),
    ]);

    const enrollment = await db.enrollment.create({
      data: { userId, courseId, status: "PENDING" },
    });

    // Notify all admins
    const admins = await db.user.findMany({
      where: { roles: { hasSome: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });

    if (admins.length > 0 && user) {
      try {
        const deptName = user.department || "Dept. tidak diketahui";
        const body = `${user.name || user.email} (${deptName}) mendaftar kursus. Menunggu persetujuan Anda.`;
        await db.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: "ENROLLMENT",
            title: "Pendaftaran Kursus Baru",
            body,
            href: "/admin/enrollments",
          })),
        });
      } catch {
        // Non-fatal — enrollment already created
      }
    }

    revalidatePath("/courses");
    revalidatePath("/dashboard");
    return enrollment;
  }

  // Existing enrollment — handle by status
  switch (existing.status) {
    case "REJECTED":
    case "FAILED": {
      const [course, user] = await Promise.all([
        db.course.findUnique({ where: { id: courseId }, select: { title: true } }),
        db.user.findUnique({ where: { id: userId }, select: { name: true, email: true, department: true } }),
      ]);

      const updated = await db.enrollment.update({
        where: { id: existing.id },
        data: { status: "PENDING", rejectionNote: null },
      });

      // Notify admins
      const admins = await db.user.findMany({
        where: { roles: { hasSome: ["ADMIN", "SUPER_ADMIN"] } },
        select: { id: true },
      });

      if (admins.length > 0 && user) {
        try {
          const deptName = user.department || "Dept. tidak diketahui";
          const body = `${user.name || user.email} (${deptName}) mendaftar ulang kursus. Menunggu persetujuan.`;
          await db.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              type: "ENROLLMENT",
              title: "Pendaftaran Kursus Baru",
              body,
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
    case "PENDING":
      throw new Error("Pendaftaran sedang menunggu persetujuan.");
    case "IN_PROGRESS":
      throw new Error("Anda sudah terdaftar dan sedang mengikuti kursus ini.");
    case "COMPLETED":
      throw new Error("Anda sudah menyelesaikan kursus ini.");
    default:
      throw new Error(`Status tidak dikenali. Hubungi admin.`);
  }
}
