import { db } from "@/lib/db";

/**
 * Membuat notifikasi pendaftaran kursus HANYA JIKA belum ada notifikasi
 * ENROLLMENT yang sama untuk user tersebut di kursus ini.
 * 
 * Logika De-duplikasi:
 * - Cek apakah sudah ada notifikasi bertipe "ENROLLMENT" dengan href yang sama
 *   untuk setiap userId.
 * - Jika sudah ada → skip (tidak dibuat ulang).
 * - Jika belum → buat notifikasi baru.
 * 
 * Ini mencegah spam notifikasi "Anda terdaftar pada kursus X" yang muncul
 * berulang-ulang setiap kali admin me-re-enroll atau proses batch berjalan.
 */
export async function notifyCourseEnrollment(params: {
  userIds: string[];
  courseId: string;
  courseTitle: string;
}) {
  if (params.userIds.length === 0) return;

  const href = `/courses/${params.courseId}`;

  // Cari userId-userId yang SUDAH punya notifikasi enrollment untuk kursus ini
  const existing = await db.notification.findMany({
    where: {
      type: "ENROLLMENT",
      href,
      userId: { in: params.userIds },
    },
    select: { userId: true },
  });

  const alreadyNotifiedIds = new Set(existing.map((n) => n.userId));

  // Hanya buat notifikasi untuk yang BELUM pernah mendapatkan
  const newUserIds = params.userIds.filter((id) => !alreadyNotifiedIds.has(id));

  if (newUserIds.length === 0) return;

  await db.notification.createMany({
    data: newUserIds.map((userId) => ({
      userId,
      type: "ENROLLMENT" as const,
      title: "Pendaftaran Kursus Berhasil",
      body: `Anda telah didaftarkan ke kursus "${params.courseTitle}". Segera mulai belajar!`,
      href,
    })),
    skipDuplicates: true,
  });
}
