/**
 * Seed Fisika Course -- Pre-Test (20) + Post-Test (20)
 * Run: npx tsx prisma/seed-fisika-course.ts
 *
 * Topics covered:
 *   1. Kinematika & Gerak Lurus
 *   2. Hukum Newton & Gaya
 *   3. Usaha & Energi
 *   4. Momentum & Tumbukan
 *   5. Gelombang & Bunyi
 *   6. Cahaya & Optika
 *   7. Listrik & Kemagnetan
 *   8. Suhu & Kalor
 */

import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

// ── Helper: shuffle array (Fisher-Yates) ──────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ════════════════════════════════════════════════════════════════════
// PRE-TEST -- 20 Questions (Materi Fisika Dasar)
// ════════════════════════════════════════════════════════════════════
const PRE_QUESTIONS = [
  // -- Kinematika ---------------------------------------------------
  {
    text: "Sebuah mobil menempuh jarak 120 km dalam waktu 2 jam. Berapakah kecepatan rata-rata mobil tersebut?",
    correct: "60 km/jam",
    distractors: ["30 km/jam", "80 km/jam", "240 km/jam"],
  },
  {
    text: "GLBB (Gerak Lurus Berubah Beraturan) memiliki ciri utama, yaitu ...",
    correct: "Perubahan kecepatan setiap detik sama besar (percepatan tetap)",
    distractors: ["Kecepatan selalu tetap", "Percepatan berubah setiap detik", "Lintasan berupa lingkaran"],
  },
  {
    text: "Satuan Internasional (SI) untuk percepatan adalah ...",
    correct: "m/s2",
    distractors: ["m/s", "kg/m3", "N/m2"],
  },
  {
    text: "Grafik hubungan jarak terhadap waktu pada GLB (Gerak Lurus Beraturan) berbentuk ...",
    correct: "Garis lurus miring",
    distractors: ["Parabola", "Lingkaran", "Garis horizontal"],
  },
  // -- Hukum Newton -------------------------------------------------
  {
    text: "Hukum Newton I (Inersia) menyatakan bahwa benda yang diam akan tetap diam dan benda bergerak akan tetap bergerak lurus beraturan kecuali ada gaya luar yang bekerja. Pernyataan ini dikenal sebagai ...",
    correct: "Hukum Kelembaman (Inersia)",
    distractors: ["Hukum Aksi-Reaksi", "Hukum Newton II", "Hukum Archimedes"],
  },
  {
    text: "Sebuah benda bermassa 10 kg dikenai gaya sebesar 50 N. Berapakah percepatan benda tersebut?",
    correct: "5 m/s2",
    distractors: ["0,5 m/s2", "500 m/s2", "5000 m/s2"],
  },
  {
    text: "Gaya gesek statis maksimum terjadi saat benda ...",
    correct: "Akan bergerak tetapi belum bergerak",
    distractors: ["Bergerak dengan kecepatan tetap", "Diam dan tidak ada gaya yang bekerja", "Bergerak dipercepat"],
  },
  {
    text: "Satuan gaya dalam SI adalah ...",
    correct: "Newton (N)",
    distractors: ["Joule (J)", "Watt (W)", "Pascal (Pa)"],
  },
  // -- Usaha & Energi -----------------------------------------------
  {
    text: "Usaha (W) dihitung dari hasil kali gaya (F) dan perpindahan (s) yang searah. Usaha bernilai maksimum ketika sudut theta = 0, yaitu ketika gaya searah dengan perpindahan.",
    correct: "0 derajat (gaya searah perpindahan)",
    distractors: ["45 derajat", "90 derajat", "180 derajat"],
  },
  {
    text: "Energi kinetik sebuah benda yang bergerak dengan kecepatan v adalah ...",
    correct: "1/2 mv2",
    distractors: ["mgh", "mv", "1/2 mv"],
  },
  {
    text: "Energi potensial gravitasi sebuah benda bermassa m pada ketinggian h di atas tanah adalah ...",
    correct: "mgh",
    distractors: ["1/2 mv2", "mgh2", "2mgh"],
  },
  {
    text: "Hukum kekekalan energi menyatakan bahwa dalam sistem tertutup, energi tidak dapat ...",
    correct: "Diciptakan atau dimusnahkan, hanya berubah bentuk",
    distractors: ["Berubah bentuk", "Bertambah", "Berkurang"],
  },
  // -- Momentum ------------------------------------------------------
  {
    text: "Momentum didefinisikan sebagai hasil kali massa dan kecepatan benda. Secara matematis p = mv. Satuan momentum dalam SI adalah ...",
    correct: "kg.m/s",
    distractors: ["kg.m/s2", "N.s", "J.s"],
  },
  {
    text: "Hukum kekekalan momentum berlaku jika ...",
    correct: "Tidak ada gaya luar yang bekerja pada sistem",
    distractors: ["Tidak ada tumbukan sama sekali", "Hanya terjadi tumbukan tidak lenting", "Massa sistem berubah"],
  },
  {
    text: "Pada tumbukan lenting sempurna, yang kekal adalah ...",
    correct: "Momentum dan energi kinetik",
    distractors: ["Hanya momentum", "Hanya energi kinetik", "Massa dan momentum"],
  },
  // -- Gelombang & Bunyi ---------------------------------------------
  {
    text: "Gelombang yang arah getarannya tegak lurus arah rambatnya disebut gelombang ...",
    correct: "Transversal",
    distractors: ["Longitudinal", "Elektromagnetik", "Mekanik"],
  },
  {
    text: "Cepat rambat gelombang dirumuskan v = lambda x f, di mana lambda adalah ...",
    correct: "Panjang gelombang (jarak satu puncak ke puncak berikutnya)",
    distractors: ["Frekuensi getaran", "Amplitudo getaran", "Periode getaran"],
  },
  {
    text: "Bunyi audiosonik yang dapat didengar manusia memiliki frekuensi antara ...",
    correct: "20 Hz - 20.000 Hz",
    distractors: ["1 Hz - 100 Hz", "1 MHz - 10 MHz", "10 Hz - 10 Hz"],
  },
  // -- Listrik -------------------------------------------------------
  {
    text: "Hukum Ohm menyatakan bahwa tegangan (V) sama dengan hasil kali arus (I) dan hambatan (R). Jika arus dinaikkan 2 kali dan hambatan tetap, maka tegangan akan ...",
    correct: "Bertambah 2 kali lipat",
    distractors: ["Berkurang 2 kali lipat", "Tetap sama", "Bertambah 4 kali lipat"],
  },
  {
    text: "Daya listrik didefinisikan sebagai laju perpindahan energi listrik. Rumus daya listrik adalah P = V x I. Satuan SI untuk daya listrik adalah ...",
    correct: "Watt (W)",
    distractors: ["Volt (V)", "Ampere (A)", "Ohm (Ohm)"],
  },
];

// ════════════════════════════════════════════════════════════════════
// POST-TEST -- 20 Questions (Fisika Lanjutan / Aplikasi)
// ════════════════════════════════════════════════════════════════════
const POST_QUESTIONS = [
  // -- Kinematika & Gerak Parabola ----------------------------------
  {
    text: "Sebuah bola dilempar ke atas dengan kecepatan awal 20 m/s. Dengan g = 10 m/s2, tinggi maksimum yang dicapai bola adalah ...",
    correct: "20 m",
    distractors: ["40 m", "10 m", "200 m"],
  },
  {
    text: "Pada gerak parabola, komponen kecepatan awal pada sumbu x (vx) adalah ...",
    correct: "Tetap selama gerak (karena tidak ada percepatan horizontal)",
    distractors: ["Bertambah secara linear", "Berkurang hingga nol", "Sama dengan komponen vy"],
  },
  {
    text: "Waktu yang dibutuhkan benda untuk kembali ke titik awal pada gerak parabola dari bidang datar adalah ...",
    correct: "2 x (voy / g)",
    distractors: ["voy / g", "voy x g", "1 / (voy x g)"],
  },
  // -- Hukum Newton & Gravitasi --------------------------------------
  {
    text: "Benda bermassa 5 kg jatuh bebas dari ketinggian 20 m. Jika g = 10 m/s2, kecepatan benda saat menyentuh tanah adalah ...",
    correct: "20 m/s",
    distractors: ["10 m/s", "2 m/s", "200 m/s"],
  },
  {
    text: "Hukum Gravitasi Universal Newton menyatakan bahwa gaya gravitasi antara dua benda sebanding dengan ...",
    correct: "Hasil kali kedua massa dan berbanding terbalik dengan kuadrat jarak",
    distractors: ["Jumlah kedua massa", "Selisih kedua massa", "Jarak kedua benda saja"],
  },
  {
    text: "Berat benda di bulan lebih kecil daripada di bumi karena ...",
    correct: "Percepatan gravitasi di bulan lebih kecil dari di bumi",
    distractors: ["Massa benda di bulan lebih kecil", "Benda mengalami ketidakseimbangan gaya", "Tekanan udara di bulan lebih rendah"],
  },
  // -- Usaha & Energi ------------------------------------------------
  {
    text: "Sebuah benda bermassa 2 kg diangkat setinggi 5 m. Usaha yang dilakukan terhadap benda tersebut adalah ... (g = 10 m/s2)",
    correct: "100 J",
    distractors: ["50 J", "10 J", "500 J"],
  },
  {
    text: "Sebuah mobil bermassa 1000 kg bergerak dengan kecepatan 20 m/s. Energi kinetik mobil tersebut adalah ...",
    correct: "200.000 J",
    distractors: ["10.000 J", "400.000 J", "20.000 J"],
  },
  {
    text: "Mesin lift menarik beban 500 kg ke atas setinggi 10 m dalam waktu 5 detik. Daya mesin lift tersebut adalah ... (g = 10 m/s2)",
    correct: "10.000 W",
    distractors: ["1.000 W", "50.000 W", "5.000 W"],
  },
  // -- Momentum & Tumbukan -------------------------------------------
  {
    text: "Dua benda A dan B masing-masing bermassa 2 kg dan 3 kg bergerak berlawanan arah dengan kecepatan 4 m/s dan 2 m/s. Momentum total sistem adalah ...",
    correct: "2 kg.m/s (A ke kanan, B ke kiri)",
    distractors: ["8 kg.m/s", "14 kg.m/s", "0 kg.m/s"],
  },
  {
    text: "Pada tumbukan tidak lenting sama sekali, yang kekal adalah ...",
    correct: "Hanya momentum, energi kinetik tidak kekal",
    distractors: ["Hanya energi kinetik", "Momentum dan energi kinetik sama-sama kekal", "Massa sistem berubah"],
  },
  {
    text: "Koefisien restitusi (e) untuk tumbukan lenting sempurna adalah ...",
    correct: "e = 1",
    distractors: ["e = 0", "e = -1", "0 < e < 1"],
  },
  // -- Gelombang & Optika -------------------------------------------
  {
    text: "Cahaya putih yang mengenai prisma terurai menjadi spektrum warna. Fenomena ini terjadi karena cahaya memiliki ...",
    correct: "Panjang gelombang yang berbeda untuk setiap warna (dispersi)",
    distractors: ["Kecepatan yang sama untuk semua warna", "Frekuensi yang sama untuk semua warna", "Amplitudo yang sama untuk semua warna"],
  },
  {
    text: "Jarak antara dua garis terang berurutan pada interferensi celah ganda disebut ...",
    correct: "Pita terang (fringe)",
    distractors: ["Panjang gelombang", "Amplitudo", "Frekuensi"],
  },
  {
    text: "Cermin cembung selalu menghasilkan bayangan yang bersifat ...",
    correct: "Tegak, diperkecil, dan maya (di belakang cermin)",
    distractors: ["Terbalik, diperbesar, dan nyata", "Tegak, diperbesar, dan nyata", "Terbalik, sama besar, dan maya"],
  },
  // -- Listrik & Kemagnetan -----------------------------------------
  {
    text: "Tiga hambatan masing-masing 6 Ohm disusun secara paralel. Hambatan pengganti totalnya adalah ...",
    correct: "2 Ohm",
    distractors: ["18 Ohm", "3 Ohm", "12 Ohm"],
  },
  {
    text: "Energi listrik yang dikonsumsi alat dengan daya 100 W selama 10 jam adalah ...",
    correct: "1.000 Wh (1 kWh)",
    distractors: ["10 Wh", "100 Wh", "10.000 Wh"],
  },
  {
    text: "Gaya Lorentz pada kawat berarus listrik dalam medan magnet bergantung pada: arus (I), kuat medan magnet (B), dan ...",
    correct: "Panjang kawat (L)",
    distractors: ["Hambatan kawat", "Beda potensial kawat", "Kapasitas kapasitor"],
  },
  // -- Suhu & Kalor -------------------------------------------------
  {
    text: "Banyaknya kalor yang diperlukan untuk menaikkan suhu benda sebanding dengan massa, kalor jenis, dan perubahan suhu. Kalor jenis (c) memiliki satuan SI ...",
    correct: "J/(kg.K)",
    distractors: ["J/kg", "kg/J", "J/(kg.C)"],
  },
  {
    text: "Perubahan wujud dari padat menjadi cair disebut ...",
    correct: "Melebur (mencair) pada titik lebur benda tersebut",
    distractors: ["Menguap pada titik didih", "Menyublim pada titik sublim", "Mengembun pada titik embun"],
  },
];

// ════════════════════════════════════════════════════════════════════
// MAIN SEED
// ════════════════════════════════════════════════════════════════════
async function main() {
  console.log("--- Starting Fisika course seed ---\n");

  // -- 1. Category ----------------------------------------------------
  const category = await prisma.category.upsert({
    where: { name: "Fisika" },
    update: {},
    create: { name: "Fisika" },
  });
  console.log("OK Category:", category.name);

  // -- 2. Admin User -------------------------------------------------
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });
  if (!admin) throw new Error("Tidak ada user ADMIN. Jalankan seed.ts terlebih dahulu.");
  console.log("OK Admin found:", admin.name);

  // -- 3. Course -----------------------------------------------------
  const existingCourse = await prisma.course.findFirst({
    where: { title: { contains: "Fisika" } },
  });
  if (existingCourse) {
    await prisma.course.delete({ where: { id: existingCourse.id } });
    console.log("DEL Old course:", existingCourse.title);
  }

  const course = await prisma.course.create({
    data: {
      userId: admin.id,
      title: "Fisika -- Mekanika, Gelombang & Listrik",
      description:
        "Materi fisika dasar: kinematika, hukum Newton, usaha & energi, momentum, gelombang, optika, listrik, dan kalor. Dilengkapi pre-test dan post-test.",
      categoryId: category.id,
      deadlineDuration: 14,
      isPublished: true,
    },
  });
  console.log("OK Course:", course.title);
  console.log("   Course ID:", course.id);

  // -- 4. Modules ----------------------------------------------------
  const moduleData = [
    { title: "Kinematika & Gerak Lurus", description: "GLB dan GLBB", position: 1, type: "VIDEO" as const, url: "" },
    { title: "Hukum Newton & Gaya", description: "Tiga hukum Newton tentang gerak dan gaya", position: 2, type: "VIDEO" as const, url: "" },
    { title: "Usaha & Energi", description: "Usaha, energi kinetik, dan energi potensial", position: 3, type: "VIDEO" as const, url: "" },
    { title: "Momentum & Tumbukan", description: "Hukum kekekalan momentum dan jenis tumbukan", position: 4, type: "VIDEO" as const, url: "" },
    { title: "Gelombang & Bunyi", description: "Jenis gelombang, cepat rambat, dan bunyi", position: 5, type: "VIDEO" as const, url: "" },
    { title: "Cahaya & Optika", description: "Pemantulan, pembiasan, cermin, dan lensa", position: 6, type: "VIDEO" as const, url: "" },
    { title: "Listrik & Kemagnetan", description: "Hukum Ohm, rangkaian listrik, dan gaya Lorentz", position: 7, type: "VIDEO" as const, url: "" },
    { title: "Suhu & Kalor", description: "Pemuaian, kalor jenis, perubahan wujud, dan asas Black", position: 8, type: "VIDEO" as const, url: "" },
  ];

  const createdModules = await Promise.all(
    moduleData.map((m) =>
      prisma.module.create({
        data: { ...m, courseId: course.id, isPublished: true },
      })
    )
  );
  console.log("OK Modules:", createdModules.length, "created");

  // -- 5. Pre-Test ---------------------------------------------------
  const preTest = await prisma.test.create({
    data: {
      courseId: course.id,
      type: "PRE",
      title: "Pre-Test Fisika",
      duration: 20,
      passingScore: 70,
      maxAttempts: 3,
      randomizeQuestions: false,
      randomizeOptions: false,
    },
  });

  await prisma.$transaction(
    PRE_QUESTIONS.map((q, i) =>
      prisma.question.create({
        data: {
          text: q.text,
          testId: preTest.id,
          position: i,
          options: {
            create: shuffle([
              { text: q.correct, isCorrect: true, position: 0 },
              ...q.distractors.map((d, j) => ({ text: d, isCorrect: false, position: j + 1 })),
            ]),
          },
        },
      })
    )
  );
  console.log("OK Pre-test:", PRE_QUESTIONS.length, "soal (durasi", preTest.duration, "menit)");

  // -- 6. Post-Test --------------------------------------------------
  const postTest = await prisma.test.create({
    data: {
      courseId: course.id,
      type: "POST",
      title: "Post-Test Fisika",
      duration: 25,
      passingScore: 70,
      maxAttempts: 3,
      randomizeQuestions: false,
      randomizeOptions: false,
    },
  });

  await prisma.$transaction(
    POST_QUESTIONS.map((q, i) =>
      prisma.question.create({
        data: {
          text: q.text,
          testId: postTest.id,
          position: i,
          options: {
            create: shuffle([
              { text: q.correct, isCorrect: true, position: 0 },
              ...q.distractors.map((d, j) => ({ text: d, isCorrect: false, position: j + 1 })),
            ]),
          },
        },
      })
    )
  );
  console.log("OK Post-test:", POST_QUESTIONS.length, "soal (durasi", postTest.duration, "menit)");

  // -- 7. Enroll semua KARYAWAN --------------------------------------
  const karyawan = await prisma.user.findMany({
    where: { role: "KARYAWAN" },
  });
  await Promise.all(
    karyawan.map((u) =>
      prisma.enrollment.upsert({
        where: { userId_courseId: { userId: u.id, courseId: course.id } },
        update: {},
        create: {
          userId: u.id,
          courseId: course.id,
          status: "IN_PROGRESS",
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          source: "SEED",
        },
      })
    )
  );
  console.log("OK Karyawan di-enroll:", karyawan.length);

  // -- DONE ----------------------------------------------------------
  console.log("\n========================================");
  console.log("  Fisika Course Seed Complete!");
  console.log("========================================");
  console.log("  Course   :", course.title);
  console.log("  Course ID:", course.id);
  console.log("  Category :", category.name);
  console.log("  Modules  :", createdModules.length);
  console.log("  Pre-Test :", PRE_QUESTIONS.length, "soal");
  console.log("  Post-Test:", POST_QUESTIONS.length, "soal");
  console.log("  Peserta  :", karyawan.length, "karyawan");
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error("ERROR Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
