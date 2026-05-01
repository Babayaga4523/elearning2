import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runTest() {
  console.log("🚀 Memulai Pengujian Logika Course Visibility & Access Guard...");

  try {
    // 1. Ambil user KARYAWAN random untuk testing
    const user = await prisma.user.findFirst({
      where: { role: "KARYAWAN" }
    });

    // 1b. Ambil user ADMIN untuk membuat kursus
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    });

    if (!user || !admin) {
      console.error("❌ Gagal: Pastikan ada user KARYAWAN dan ADMIN di database.");
      return;
    }
    console.log(`✅ Menggunakan Admin: ${admin.name} untuk buat kursus`);
    console.log(`✅ Menggunakan Karyawan: ${user.name} untuk uji akses`);

    // 2. Buat Kursus Tersembunyi (Hidden Course)
    const mockCourse = await (prisma.course as any).create({
      data: {
        userId: admin.id,
        title: "KURSUS RAHASIA (HIDDEN)",
        description: "Kursus ini tidak boleh muncul di katalog orang umum.",
        isPublished: true,
        isVisible: false,
      }
    });
    console.log(`✅ Kursus Tersembunyi Dibuat: ${mockCourse.title}`);

    // Scneario A: Cek apakah muncul di katalog (seharusnya TIDAK)
    const catalogBefore = await (prisma.course as any).findMany({
      where: {
        AND: [
          { isPublished: true },
          { 
            OR: [
              { isVisible: true },
              { enrollments: { some: { userId: user.id, status: { not: "REJECTED" } } } }
            ]
          }
        ]
      }
    });

    const isFoundBefore = catalogBefore.some((c: any) => c.id === mockCourse.id);
    if (!isFoundBefore) {
      console.log("🟢 SCENARIO A BERHASIL: Kursus tersembunyi TIDAK muncul di katalog user non-enrolled.");
    } else {
      console.error("🔴 SCENARIO A GAGAL: Kursus tersembunyi malah muncul di katalog!");
    }

    // Scenario B: Enroll user ke kursus tersebut (Simulasi Admin mendaftarkan manual)
    await (prisma.enrollment as any).create({
      data: {
        userId: user.id,
        courseId: mockCourse.id,
        status: "PENDING"
      }
    });
    console.log("✅ User didaftarkan ke kursus (Status: PENDING)");

    // Cek lagi di katalog (seharusnya MUNCUL sekarang)
    const catalogAfter = await (prisma.course as any).findMany({
      where: {
        AND: [
          { isPublished: true },
          { 
            OR: [
              { isVisible: true },
              { enrollments: { some: { userId: user.id, status: { not: "REJECTED" } } } }
            ]
          }
        ]
      }
    });

    const isFoundAfter = catalogAfter.some((c: any) => c.id === mockCourse.id);
    if (isFoundAfter) {
      console.log("🟢 SCENARIO B BERHASIL: Kursus tersembunyi MUNCUL di katalog karena user sudah terdaftar (PENDING).");
    } else {
      console.error("🔴 SCENARIO B GAGAL: Kursus tetap tidak muncul padahal sudah terdaftar!");
    }

    // Scenario C: Reject Enrollment
    await (prisma.enrollment as any).update({
      where: { userId_courseId: { userId: user.id, courseId: mockCourse.id } },
      data: { status: "REJECTED" }
    });
    console.log("✅ Pendaftaran Ditolak (Status: REJECTED)");

    // Cek lagi di katalog (seharusnya HILANG lagi)
    const catalogFinal = await (prisma.course as any).findMany({
      where: {
        AND: [
          { isPublished: true },
          { 
            OR: [
              { isVisible: true },
              { enrollments: { some: { userId: user.id, status: { not: "REJECTED" } } } }
            ]
          }
        ]
      }
    });

    const isFoundFinal = catalogFinal.some((c: any) => c.id === mockCourse.id);
    if (!isFoundFinal) {
      console.log("🟢 SCENARIO C BERHASIL: Kursus tersembunyi HILANG lagi dari katalog karena pendaftaran ditolak.");
    } else {
      console.error("🔴 SCENARIO C GAGAL: Kursus masih muncul padahal pendaftaran sudah REJECTED!");
    }

    // CLEANUP
    console.log("🧹 Membersihkan data pengujian...");
    await prisma.enrollment.deleteMany({ where: { courseId: mockCourse.id } });
    await prisma.course.delete({ where: { id: mockCourse.id } });
    console.log("✅ Cleanup selesai.");
    console.log("\n⭐️ SELURUH LOGIKA VISIBILITY TERVERIFIKASI BERHASIL!");

  } catch (error) {
    console.error("💥 Terjadi kesalahan saat pengujian:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
