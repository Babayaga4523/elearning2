import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding IPS Course...");

  // 1. Get or create IPS category
  let category = await prisma.category.findFirst({
    where: { name: "Ilmu Pengetahuan Sosial" }
  });

  if (!category) {
    category = await prisma.category.create({
      data: { name: "Ilmu Pengetahuan Sosial" }
    });
    console.log("✅ Created category: Ilmu Pengetahuan Sosial");
  }

  // 2. Get admin user (first user with ADMIN role)
  const adminUser = await prisma.user.findFirst({
    where: {
      roles: {
        has: "ADMIN"
      }
    }
  });

  if (!adminUser) {
    throw new Error("No admin user found. Please create an admin user first.");
  }

  // 3. Create IPS Course
  const course = await prisma.course.create({
    data: {
      userId: adminUser.id,
      title: "Pengantar Ilmu Pengetahuan Sosial",
      description: "Kursus ini membahas konsep dasar Ilmu Pengetahuan Sosial (IPS) yang mencakup geografi, sejarah, ekonomi, dan sosiologi. Peserta akan mempelajari bagaimana manusia berinteraksi dengan lingkungan sosial dan alam sekitarnya.",
      categoryId: category.id,
      isPublished: true,
      isVisible: true,
      deadlineDuration: 30, // 30 hari
    }
  });
  console.log(`✅ Created course: ${course.title} (ID: ${course.id})`);

  // 4. Create modules
  const modules = [
    {
      title: "Pengenalan Geografi Indonesia",
      description: "Mempelajari letak geografis, iklim, dan kekayaan alam Indonesia",
      type: "VIDEO" as const,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      duration: 15,
      position: 1,
    },
    {
      title: "Sejarah Kemerdekaan Indonesia",
      description: "Memahami perjuangan bangsa Indonesia meraih kemerdekaan",
      type: "VIDEO" as const,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      duration: 20,
      position: 2,
    },
    {
      title: "Sistem Ekonomi Indonesia",
      description: "Mengenal sistem ekonomi Pancasila dan perkembangan ekonomi Indonesia",
      type: "VIDEO" as const,
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      duration: 18,
      position: 3,
    },
  ];

  for (const moduleData of modules) {
    await prisma.module.create({
      data: {
        ...moduleData,
        courseId: course.id,
        isPublished: true,
        isFree: false,
      }
    });
    console.log(`✅ Created module: ${moduleData.title}`);
  }

  // 5. Create PRE-TEST
  const preTest = await prisma.test.create({
    data: {
      title: "Pre-Test: Pengantar IPS",
      type: "PRE",
      courseId: course.id,
      duration: 15, // 15 menit
      passingScore: 60,
      maxAttempts: 2,
      randomizeQuestions: true,
      randomizeOptions: true,
    }
  });
  console.log(`✅ Created PRE-TEST (ID: ${preTest.id})`);

  // 6. Create PRE-TEST Questions
  const preTestQuestions = [
    {
      text: "Indonesia terletak di antara dua benua dan dua samudra. Benua apa saja yang mengapit Indonesia?",
      options: [
        { text: "Asia dan Australia", isCorrect: true },
        { text: "Asia dan Afrika", isCorrect: false },
        { text: "Eropa dan Australia", isCorrect: false },
        { text: "Amerika dan Asia", isCorrect: false },
      ]
    },
    {
      text: "Siapakah proklamator kemerdekaan Indonesia?",
      options: [
        { text: "Soekarno dan Mohammad Hatta", isCorrect: true },
        { text: "Soeharto dan BJ Habibie", isCorrect: false },
        { text: "Tan Malaka dan Sutan Sjahrir", isCorrect: false },
        { text: "Ki Hajar Dewantara dan RA Kartini", isCorrect: false },
      ]
    },
    {
      text: "Apa yang dimaksud dengan sistem ekonomi Pancasila?",
      options: [
        { text: "Sistem ekonomi yang berdasarkan nilai-nilai Pancasila dengan keseimbangan antara kepentingan individu dan masyarakat", isCorrect: true },
        { text: "Sistem ekonomi yang sepenuhnya dikuasai oleh negara", isCorrect: false },
        { text: "Sistem ekonomi pasar bebas tanpa campur tangan pemerintah", isCorrect: false },
        { text: "Sistem ekonomi yang hanya mengutamakan keuntungan perusahaan", isCorrect: false },
      ]
    },
    {
      text: "Apa nama organisasi pergerakan nasional pertama di Indonesia yang didirikan pada tahun 1908?",
      options: [
        { text: "Budi Utomo", isCorrect: true },
        { text: "Sarekat Islam", isCorrect: false },
        { text: "Indische Partij", isCorrect: false },
        { text: "Perhimpunan Indonesia", isCorrect: false },
      ]
    },
    {
      text: "Iklim tropis di Indonesia menyebabkan Indonesia memiliki karakteristik apa?",
      options: [
        { text: "Curah hujan tinggi dan suhu udara relatif tinggi sepanjang tahun", isCorrect: true },
        { text: "Empat musim yang jelas seperti di Eropa", isCorrect: false },
        { text: "Suhu udara sangat dingin sepanjang tahun", isCorrect: false },
        { text: "Tidak ada hujan sama sekali", isCorrect: false },
      ]
    },
  ];

  for (const [index, questionData] of preTestQuestions.entries()) {
    const question = await prisma.question.create({
      data: {
        text: questionData.text,
        testId: preTest.id,
      }
    });

    for (const optionData of questionData.options) {
      await prisma.option.create({
        data: {
          text: optionData.text,
          isCorrect: optionData.isCorrect,
          questionId: question.id,
        }
      });
    }
    console.log(`✅ Created PRE-TEST question ${index + 1}`);
  }

  // 7. Create POST-TEST
  const postTest = await prisma.test.create({
    data: {
      title: "Post-Test: Pengantar IPS",
      type: "POST",
      courseId: course.id,
      duration: 20, // 20 menit
      passingScore: 70,
      maxAttempts: 3,
      randomizeQuestions: true,
      randomizeOptions: true,
    }
  });
  console.log(`✅ Created POST-TEST (ID: ${postTest.id})`);

  // 8. Create POST-TEST Questions
  const postTestQuestions = [
    {
      text: "Jelaskan mengapa letak geografis Indonesia sangat strategis bagi perdagangan internasional?",
      options: [
        { text: "Karena Indonesia terletak di jalur perdagangan dunia antara Asia dan Australia, serta antara Samudra Hindia dan Pasifik", isCorrect: true },
        { text: "Karena Indonesia memiliki banyak gunung berapi", isCorrect: false },
        { text: "Karena Indonesia adalah negara kepulauan terbesar", isCorrect: false },
        { text: "Karena Indonesia memiliki banyak sungai", isCorrect: false },
      ]
    },
    {
      text: "Apa makna dari Sumpah Pemuda yang dikumandangkan pada 28 Oktober 1928?",
      options: [
        { text: "Persatuan pemuda Indonesia untuk mengakui satu tanah air, satu bangsa, dan satu bahasa yaitu Indonesia", isCorrect: true },
        { text: "Deklarasi kemerdekaan Indonesia", isCorrect: false },
        { text: "Pembentukan pemerintahan pertama Indonesia", isCorrect: false },
        { text: "Pendirian organisasi kepemudaan", isCorrect: false },
      ]
    },
    {
      text: "Bagaimana sistem ekonomi Pancasila berbeda dengan sistem ekonomi kapitalis murni?",
      options: [
        { text: "Sistem ekonomi Pancasila mengutamakan keseimbangan antara kepentingan individu dan masyarakat, serta peran negara dalam mengatur ekonomi untuk kesejahteraan bersama", isCorrect: true },
        { text: "Sistem ekonomi Pancasila tidak mengizinkan kepemilikan pribadi", isCorrect: false },
        { text: "Sistem ekonomi Pancasila hanya fokus pada keuntungan perusahaan", isCorrect: false },
        { text: "Sistem ekonomi Pancasila sama persis dengan sistem kapitalis", isCorrect: false },
      ]
    },
    {
      text: "Apa dampak positif dari keberagaman budaya di Indonesia?",
      options: [
        { text: "Memperkaya khazanah budaya nasional, meningkatkan toleransi, dan menjadi daya tarik wisata", isCorrect: true },
        { text: "Menyebabkan perpecahan bangsa", isCorrect: false },
        { text: "Menghambat pembangunan ekonomi", isCorrect: false },
        { text: "Tidak ada dampak positif", isCorrect: false },
      ]
    },
    {
      text: "Mengapa Indonesia disebut sebagai negara agraris?",
      options: [
        { text: "Karena sebagian besar penduduk Indonesia bekerja di sektor pertanian dan Indonesia memiliki lahan pertanian yang luas serta subur", isCorrect: true },
        { text: "Karena Indonesia memiliki banyak pabrik", isCorrect: false },
        { text: "Karena Indonesia adalah negara industri", isCorrect: false },
        { text: "Karena Indonesia memiliki banyak tambang", isCorrect: false },
      ]
    },
  ];

  for (const [index, questionData] of postTestQuestions.entries()) {
    const question = await prisma.question.create({
      data: {
        text: questionData.text,
        testId: postTest.id,
      }
    });

    for (const optionData of questionData.options) {
      await prisma.option.create({
        data: {
          text: optionData.text,
          isCorrect: optionData.isCorrect,
          questionId: question.id,
        }
      });
    }
    console.log(`✅ Created POST-TEST question ${index + 1}`);
  }

  console.log("\n🎉 IPS Course seeding completed successfully!");
  console.log(`📚 Course ID: ${course.id}`);
  console.log(`📝 PRE-TEST ID: ${preTest.id} (5 questions)`);
  console.log(`📝 POST-TEST ID: ${postTest.id} (5 questions)`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding IPS course:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
