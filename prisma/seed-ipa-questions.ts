/**
 * Seed IPA Questions — Pre-Test (10) + Post-Test (15)
 * Run: npx tsx prisma/seed-ipa-questions.ts
 */

import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

/* ── Pre-Test Questions (10 ──────────────────────────────────────── */
const PRE_TEST_QUESTIONS: Array<{
  text: string;
  correct: string;
  distractors: string[];
}> = [
  {
    text: "Satuan Internasional (SI) untuk gaya adalah ...",
    correct: "Newton (N)",
    distractors: ["Joule (J)", "Watt (W)", "Pascal (Pa)"],
  },
  {
    text: "Perubahan wujud benda dari padat menjadi cair disebut ...",
    correct: "Mencair (melting)",
    distractors: ["Membeku (freezing)", "Menguap (evaporation)", "Menyublim (sublimation)"],
  },
  {
    text: "Zat tunggal yang tidak dapat diuraikan lagi disebut ...",
    correct: "Unsur (element)",
    distractors: ["Senyawa (compound)", "Campuran (mixture)", "Koloid (colloid)"],
  },
  {
    text: "Proses penguapan air dari permukaan bumi disebut ...",
    correct: "Evaporasi (evaporation)",
    distractors: ["Transpirasi (transpiration)", "Presipitasi (precipitation)", "Kondensasi (condensation)"],
  },
  {
    text: "Gaya gravitasi bumi yang terbesar terdapat di ...",
    correct: "Kutub utara dan selatan bumi",
    distractors: ["Khatulistiwa", "Daerah tropis", "Daerah gurun"],
  },
  {
    text: "Energi yang tersimpan dalam benda karena posisinya disebut ...",
    correct: "Energi potensial",
    distractors: ["Energi kinetik (kinetic energy)", "Energi kimia (chemical energy)", "Energi nuklir (nuclear energy)"],
  },
  {
    text: "Unsur Na, K, Ca — ketiganya termasuk golongan ...",
    correct: "Logam alkali tanah (alkaline earth metals)",
    distractors: ["Logam alkali (alkali metals)", "Logam transisi (transition metals)", "Nonlogam (nonmetals)"],
  },
  {
    text: "Sel yang berfungsi sebagai tempat penyimpanan cadangan makanan pada tumbuhan adalah ...",
    correct: "Vakuola (vacuole)",
    distractors: ["Mitokondria (mitochondria)", "Kloroplas (chloroplast)", "Dinding sel (cell wall)"],
  },
  {
    text: "Dalam ekosistem, organisme yang mengurai bahan organik disebut ...",
    correct: "Dekomposer (decomposer)",
    distractors: ["Produsen (producer)", "Konsumen (consumer)", "Parasit (parasite)"],
  },
  {
    text: "Jaringan dengan ciri: berbentuk kubus, berdinding selulosa, ada ruang antarsel — jaringan tersebut adalah ...",
    correct: "Jaringan parenkim",
    distractors: ["Jaringan epidermis", "Jaringan kolenkim", "Jaringan sklerenkim"],
  },
];

/* ── Post-Test Questions (15) ─────────────────────────────── */
const POST_TEST_QUESTIONS: Array<{
  text: string;
  correct: string;
  distractors: string[];
}> = [
  {
    text: "Hukum Kepler I menjelaskan bahwa setiap planet bergerak mengelilingi matahari dalam orbit ...",
    correct: "Ellips (ellipse)",
    distractors: ["Lingkaran sempurna", "Parabola", "Hiperbola"],
  },
  {
    text: "Reaksi antara asam klorida (HCl) dan natrium hidroksida (NaOH) menghasilkan ...",
    correct: "Garam + air (salt + water)",
    distractors: ["Gas hidrogen (hydrogen)", "Energi panas", "Asam lemah + basa lemah"],
  },
  {
    text: "Populasi yang terisolasi secara geografis selama ribuan tahun menghasilkan ...",
    correct: "Spesiasi alopatrik (allopatric speciation)",
    distractors: ["Mutasi acak (random mutation)", "Adaptasi somatik (somatic adaptation)", "Hibridisasi (hybridization)"],
  },
  {
    text: "Energi ionisasi pertama unsur Na dibanding K adalah ...",
    correct: "Lebih besar (karena ukuran atom Na lebih kecil dari K)",
    distractors: ["Lebih kecil", "Sama besar", "Bergantung pada tekanan udara"],
  },
  {
    text: "Tumbuhan yang kekurangan air mengalami ...",
    correct: "Plasmolisis (plasmolysis)",
    distractors: ["Turgiditas berlebih (excessive turgidity)", "Lisis sel (cell lysis)", "Fagositosis (phagocytosis)"],
  },
  {
    text: "Panas jenis air = 4.200 J/kg°C. Kalor yang diperlukan untuk menaikkan 2 kg air sebesar 10°C adalah ...",
    correct: "84.000 Joule (Q = m × c × ΔT = 2 × 4.200 × 10)",
    distractors: ["8.400 J", "42.000 J", "420.000 J"],
  },
  {
    text: "Gangguan pada sendi yang ditandai tulang patah — istilah medisnya ...",
    correct: "Artritis (arthritis)",
    distractors: ["Osteoporosis (osteoporosis)", "Artralgia (arthralgia)", "Dislokasi (dislocation)"],
  },
  {
    text: "Larutan dengan pH = 3 dikategorikan sebagai ...",
    correct: "Asam kuat (strong acid)",
    distractors: ["Basa lemah (weak base)", "Netral (neutral)", "Buffer (buffer solution)"],
  },
  {
    text: "Genotip heterozigot dominan dengan fenotip dominan disebut ...",
    correct: "Carrier (carrier)",
    distractors: ["Homozigot dominan (homozygous dominant)", "Resesif (recessive)", "Kodominan (codominance)"],
  },
  {
    text: "Energi kinetik rata-rata partikel gas ideal sebanding dengan ...",
    correct: "Suhu mutlak / absolute temperature",
    distractors: ["Tekanan (pressure)", "Volume (volume)", "Massa (mass)"],
  },
  {
    text: "Urutan sistem reproduksi perempuan: ovarium → tuba fallopi → uterus — berikutnya ...",
    correct: "Ovulasi → Fertilisasi → Implantasi",
    distractors: ["Sekresi → Ovulasi → Menstruasi", "Meiosis → Mitosis → Diferensiasi", "Gametogenesi → Fertilisasi → Embrionisasi"],
  },
  {
    text: "Suhu kritis peningkatan suhu tubuh (demam) pada manusia dewasa disebut ...",
    correct: "Febris (febris / pyrexia)",
    distractors: ["Hipersensitivitas (hypersensitivity)", "Inflamasi (inflammation)", "Demam ber间歇 (intermittent fever)"],
  },
  {
    text: "Katalis biologis yang mempercepat reaksi pada jalur glikolisis ...",
    correct: "Enzim (enzyme)",
    distractors: ["Hormon (hormone)", "Ion logam (metal ion)", "Koenzim (coenzyme)"],
  },
  {
    text: "Dalam persamaan termokimia: ΔH > 0 — proses tersebut bersifat ...",
    correct: "Endoterm (endothermic)",
    distractors: ["Eksoterm (exothermic)", "Isotermal (isothermal)", "Adiabatik (adiabatic)"],
  },
  {
    text: "Komponen membran sel tersusun dari ...",
    correct: "Fosfolipid bilayer dengan protein integral",
    distractors: ["Selulosa (cellulose)", "Kitin (chitin)", "Peptidoglikan (peptidoglycan)"],
  },
];

async function main() {
  console.log("🔬  Seed IPA Pre-Test (10) + Post-Test (15) questions...\n");

  /* Cari kursus IPA */
  const course = await prisma.course.findFirst({
    where: {
      category: { name: { contains: "Ilmu Pengetahuan Alam", mode: "insensitive" } },
    },
    include: {
      tests: {
        include: { questions: { include: { options: true } } },
      },
    },
  });

  if (!course) {
    console.error("❌ Kursus IPA tidak ditemukan. Jalankan seed kursus IPA terlebih dahulu.");
    process.exit(1);
  }

  const preTest = course.tests.find((t) => t.type === "PRE");
  const postTest = course.tests.find((t) => t.type === "POST");

  if (!preTest || !postTest) {
    console.error("❌ Pre-test atau Post-test tidak ditemukan di kursus IPA ini.");
    process.exit(1);
  }

  const existingPre = preTest.questions.length;
  const existingPost = postTest.questions.length;

  console.log(`📋 Kursus   : ${course.title}`);
  console.log(`   Pre-test  : ${existingPre} pertanyaan`);
  console.log(`   Post-test : ${existingPost} pertanyaan`);

  /* Pre-Test: skip jika sudah cukup */
  if (existingPre >= 10) {
    console.log("\n⚠️  Pre-test sudah memiliki ≥10 pertanyaan — skip seeding.");
  } else {
    console.log(`\n🌱 Menambahkan ${PRE_TEST_QUESTIONS.length} pertanyaan Pre-Test...`);
    for (const q of PRE_TEST_QUESTIONS) {
      const created = await prisma.question.create({
        data: {
          testId: preTest.id,
          text: q.text,
          options: {
            create: [
              { text: q.correct, isCorrect: true },
              ...q.distractors.map((d) => ({ text: d, isCorrect: false })),
            ],
          },
        },
      });
      console.log(`  ✅ ${created.text.slice(0, 70)}`);
    }
  }

  /* Post-Test: skip jika sudah cukup */
  if (existingPost >= 15) {
    console.log("\n⚠️  Post-test sudah memiliki ≥15 pertanyaan — skip seeding.");
  } else {
    console.log(`\n🌱 Menambahkan ${POST_TEST_QUESTIONS.length} pertanyaan Post-Test...`);
    for (const q of POST_TEST_QUESTIONS) {
      const created = await prisma.question.create({
        data: {
          testId: postTest.id,
          text: q.text,
          options: {
            create: [
              { text: q.correct, isCorrect: true },
              ...q.distractors.map((d) => ({ text: d, isCorrect: false })),
            ],
          },
        },
      });
      console.log(`  ✅ ${created.text.slice(0, 70)}`);
    }
  }

  console.log("\n✅ Seed selesai! Jalankan `npx prisma studio` untuk verifikasi.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
