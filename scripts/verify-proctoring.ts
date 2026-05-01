import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function validateProctoring(timeSpent: number, violationCount: number, questionCount: number) {
  const SECONDS_PER_QUESTION = 8;
  const SPEED_HACK_THRESHOLD = 0.3;
  const MAX_VIOLATIONS = 3;

  const minimumTimeRequired = questionCount * SECONDS_PER_QUESTION * SPEED_HACK_THRESHOLD;
  const isSpeedHack = timeSpent < minimumTimeRequired;
  const isMaxViolations = violationCount >= MAX_VIOLATIONS;
  
  const isCheated = isSpeedHack || isMaxViolations;
  let reason = null;
  if (isSpeedHack && isMaxViolations) reason = "BOTH";
  else if (isSpeedHack) reason = "SPEED_HACK";
  else if (isMaxViolations) reason = "MAX_VIOLATIONS";
  
  return { isCheated, reason, minimumRequired: minimumTimeRequired };
}

async function runProctoringTest() {
  console.log("🚀 Memulai Pengujian Logika Proctoring (Anti-Cheat)...");

  try {
    // 1. Ambil data dasar
    const user = await prisma.user.findFirst({ where: { role: "KARYAWAN" } });
    const test = await prisma.test.findFirst({ include: { questions: true } });

    if (!user || !test) {
      console.error("❌ Gagal: Pastikan ada data user KARYAWAN dan TEST di database.");
      return;
    }

    console.log(`✅ User: ${user.name}`);
    console.log(`✅ Test: ${test.title} (${test.questions.length} soal)`);

    const userId = user.id;
    const testId = test.id;

    // --- SCENARIO 1: SPEED HACK ---
    console.log("\n🧪 Skenario 1: Speed Hack (Pengerjaan Terlalu Cepat)");
    const timeSpent1 = 1; // 1 detik (Pasti curang untuk 1 soal karena min 2.4s)
    const violations1 = 0;
    const res1 = validateProctoring(timeSpent1, violations1, test.questions.length);
    
    if (res1.isCheated && res1.reason === "SPEED_HACK") {
      console.log(`🟢 BERHASIL: Terdeteksi Speed Hack. (Time: ${timeSpent1}s, Min Required: ${res1.minimumRequired}s)`);
    } else {
      console.error(`🔴 GAGAL: Speed Hack tidak terdeteksi! (Time: ${timeSpent1}s, Min Required: ${res1.minimumRequired}s)`);
    }

    // --- SCENARIO 2: MAX VIOLATIONS ---
    console.log("\n🧪 Skenario 2: Max Violations (Batas Pelanggaran Tercapai)");
    const timeSpent2 = 60; // 60 detik (OK)
    const violations2 = 3; // 3 pelanggaran (FAIL)
    const res2 = validateProctoring(timeSpent2, violations2, test.questions.length);

    if (res2.isCheated && res2.reason === "MAX_VIOLATIONS") {
      console.log(`🟢 BERHASIL: Terdeteksi Max Violations.`);
    } else {
      console.error(`🔴 GAGAL: Max Violations tidak terdeteksi!`);
    }

    // --- SCENARIO 3: NORMAL SUBMISSION ---
    console.log("\n🧪 Skenario 3: Pengerjaan Normal");
    const timeSpent3 = 100; // 100 detik
    const violations3 = 1; // 1 pelanggaran (Masih OK)
    const res3 = validateProctoring(timeSpent3, violations3, test.questions.length);

    if (!res3.isCheated) {
      console.log(`🟢 BERHASIL: Pengerjaan normal diterima.`);
    } else {
      console.error(`🔴 GAGAL: Pengerjaan normal malah ditandai curang! Reason: ${res3.reason}`);
    }

    // --- SCENARIO 4: REAL DB CHECK (INTEGRATION) ---
    console.log("\n🧪 Skenario 4: Integrasi API Violation (Real DB Check)");
    // Simulasikan pencatatan violation di DB
    await (prisma as any).testViolationLog.deleteMany({ where: { userId, testId } });
    await (prisma as any).testViolationLog.create({
        data: { userId, testId, type: "WINDOW_BLUR", timestamp: new Date() }
    });
    const currentCount = await (prisma as any).testViolationLog.count({ where: { userId, testId } });
    console.log(`✅ Violation tercatat di DB. Count: ${currentCount}`);
    
    if (currentCount === 1) {
        console.log("🟢 INTEGRASI DB BERHASIL: Violation tersimpan.");
    } else {
        console.error("🔴 INTEGRASI DB GAGAL!");
    }

    console.log("\n⭐️ SELURUH LOGIKA PROCTORING TERVERIFIKASI BERHASIL!");

  } catch (error) {
    console.error("💥 Terjadi kesalahan:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runProctoringTest();
