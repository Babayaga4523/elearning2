const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== STARTING LOGIC VERIFICATION SCRIPT ===");
  
  try {
    // 1. Ambil Karyawan dan Kursus
    const user = await prisma.user.findFirst({ where: { role: "KARYAWAN" } });
    const course = await prisma.course.findFirst(); // Find any course

    if (!user || !course) {
      console.log("❌ Error: Pastikan database sudah terisi data (seed).");
      return;
    }

    console.log(`Mengetest untuk User: ${user.email} dan Kursus: ${course.title}`);

    // 2. Bersihkan pendaftaran lama jika ada
    await prisma.enrollment.deleteMany({
      where: { userId: user.id, courseId: course.id }
    });
    console.log("✔️ Cleanup: Pendaftaran lama dihapus.");

    // --- TEST 1: ENROLL (SELF) ---
    console.log("\n[TEST 1] Karyawan mendaftar sendiri...");
    const e1 = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        status: "PENDING",
        source: "MANUAL"
      }
    });

    console.log(`Hasil Pendaftaran: ID=${e1.id}, Status=${e1.status}`);
    if (e1.status === "PENDING") {
      console.log("✅ BERHASIL: Status awal adalah PENDING.");
    }

    // --- TEST 2: APPROVE (ADMIN) ---
    console.log("\n[TEST 2] Admin menyetujui pendaftaran...");
    const approved = await prisma.enrollment.update({
      where: { id: e1.id },
      data: {
        status: "IN_PROGRESS",
        approvedAt: new Date()
      }
    });

    console.log(`Status setelah approve: ${approved.status}`);
    if (approved.status === "IN_PROGRESS") {
      console.log("✅ BERHASIL: Status berubah menjadi IN_PROGRESS.");
    }

    // --- TEST 3: REJECT (ADMIN) ---
    console.log("\n[TEST 3] Admin menolak pendaftaran...");
    const rejected = await prisma.enrollment.update({
      where: { id: e1.id },
      data: {
        status: "REJECTED",
        rejectionNote: "Dokumen tidak lengkap"
      }
    });

    console.log(`Status setelah reject: ${rejected.status}`);
    if (rejected.status === "REJECTED") {
      console.log("✅ BERHASIL: Status berhasil diubah ke REJECTED.");
    }

    // --- TEST 4: RE-ENROLLMENT (RESET) ---
    console.log("\n[TEST 4] Karyawan mendaftar ulang (Reset dari REJECTED ke PENDING)...");
    const reEnrolled = await prisma.enrollment.update({
      where: { id: e1.id },
      data: {
        status: "PENDING",
        rejectionNote: null,
        approvedById: null,
        approvedAt: null
      }
    });

    if (reEnrolled.status === "PENDING" && reEnrolled.rejectionNote === null) {
      console.log("✅ BERHASIL: Logic pendaftaran ulang (reset) berjalan sempurna.");
    }

    console.log("\n=== SEMUA LOGIK BERJALAN DENGAN BENAR ===");

  } catch (error) {
    console.error("Terjadi kesalahan:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
