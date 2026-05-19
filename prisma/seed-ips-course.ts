import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding IPS Course...");

  // 1. Get admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" } as any,
  });

  if (!adminUser) {
    throw new Error("No admin user found. Please create an admin user first.");
  }

  // 2. Create or get IPS category
  const category = await prisma.category.upsert({
    where: { name: "Ilmu Pengetahuan Sosial" },
    update: {},
    create: { name: "Ilmu Pengetahuan Sosial" },
  });
  console.log(`✅ Category: ${category.name}`);

  // 3. Create IPS Course with modules and tests (nested create)
  const course = await prisma.course.create({
    data: {
      userId: adminUser.id,
      title: "Pengantar Ilmu Pengetahuan Sosial (IPS)",
      description:
        "Kursus ini membahas konsep dasar Ilmu Pengetahuan Sosial (IPS) yang mencakup geografi, sejarah, ekonomi, dan sosiologi. Peserta akan mempelajari bagaimana manusia berinteraksi dengan lingkungan sosial dan alam sekitarnya, serta memahami dinamika kehidupan bermasyarakat dan berbangsa.",
      categoryId: category.id,
      deadlineDuration: 30,
      isPublished: true,
      isVisible: true,

      // ── MODULES ────────────────────────────────────────────────────────────
      modules: {
        create: [
          {
            title: "Geografi Indonesia: Letak, Iklim, dan Kekayaan Alam",
            description:
              "Mempelajari posisi astronomis dan geografis Indonesia, karakteristik iklim tropis, serta kekayaan sumber daya alam yang dimiliki.",
            position: 0,
            isPublished: true,
            type: "VIDEO",
            url: "https://www.youtube.com/watch?v=7u8UvSMnMVA",
            duration: 20,
          },
          {
            title: "Sejarah Perjuangan Kemerdekaan Indonesia",
            description:
              "Memahami kronologi perjuangan bangsa Indonesia dari masa kolonialisme hingga Proklamasi Kemerdekaan 17 Agustus 1945.",
            position: 1,
            isPublished: true,
            type: "VIDEO",
            url: "https://www.youtube.com/watch?v=r9AzuaHJZeI",
            duration: 25,
          },
          {
            title: "Ekonomi dan Kehidupan Sosial Masyarakat Indonesia",
            description:
              "Mengenal sistem ekonomi Pancasila, konsep inflasi, urbanisasi, dan keberagaman sosial budaya masyarakat Indonesia.",
            position: 2,
            isPublished: true,
            type: "VIDEO",
            url: "https://www.youtube.com/watch?v=PHe0bXAIuk0",
            duration: 22,
          },
        ],
      },

      // ── TESTS ──────────────────────────────────────────────────────────────
      tests: {
        create: [
          // ── PRE-TEST ────────────────────────────────────────────────────────
          {
            type: "PRE",
            title: "Pre-Test: Pengantar IPS",
            duration: 15,
            passingScore: 60,
            maxAttempts: 2,
            randomizeQuestions: true,
            randomizeOptions: true,
            questions: {
              create: [
                {
                  text: "Indonesia terletak di antara dua benua. Benua apa saja yang mengapit Indonesia?",
                  options: {
                    create: [
                      { text: "Asia dan Australia", isCorrect: true },
                      { text: "Asia dan Afrika", isCorrect: false },
                      { text: "Eropa dan Australia", isCorrect: false },
                      { text: "Amerika dan Asia", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Siapakah yang membacakan teks Proklamasi Kemerdekaan Indonesia?",
                  options: {
                    create: [
                      { text: "Soekarno dan Mohammad Hatta", isCorrect: true },
                      { text: "Soeharto dan BJ Habibie", isCorrect: false },
                      { text: "Tan Malaka dan Sutan Sjahrir", isCorrect: false },
                      { text: "Ki Hajar Dewantara dan RA Kartini", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Apa yang dimaksud dengan sistem ekonomi Pancasila?",
                  options: {
                    create: [
                      {
                        text: "Sistem ekonomi yang berdasarkan nilai-nilai Pancasila dengan keseimbangan antara kepentingan individu dan masyarakat",
                        isCorrect: true,
                      },
                      { text: "Sistem ekonomi yang sepenuhnya dikuasai negara", isCorrect: false },
                      { text: "Sistem ekonomi pasar bebas tanpa campur tangan pemerintah", isCorrect: false },
                      { text: "Sistem ekonomi yang hanya mengutamakan keuntungan perusahaan", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Organisasi pergerakan nasional pertama di Indonesia yang didirikan pada tahun 1908 adalah?",
                  options: {
                    create: [
                      { text: "Budi Utomo", isCorrect: true },
                      { text: "Sarekat Islam", isCorrect: false },
                      { text: "Indische Partij", isCorrect: false },
                      { text: "Perhimpunan Indonesia", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Iklim tropis di Indonesia menyebabkan Indonesia memiliki karakteristik apa?",
                  options: {
                    create: [
                      { text: "Curah hujan tinggi dan suhu udara relatif tinggi sepanjang tahun", isCorrect: true },
                      { text: "Empat musim yang jelas seperti di Eropa", isCorrect: false },
                      { text: "Suhu udara sangat dingin sepanjang tahun", isCorrect: false },
                      { text: "Tidak ada hujan sama sekali", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Letak astronomis Indonesia adalah...",
                  options: {
                    create: [
                      { text: "6°LU – 11°LS dan 95°BT – 141°BT", isCorrect: true },
                      { text: "6°LS – 11°LU dan 95°BB – 141°BB", isCorrect: false },
                      { text: "6°LU – 11°LU dan 95°BT – 141°BT", isCorrect: false },
                      { text: "11°LU – 6°LS dan 141°BT – 95°BT", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Apa yang dimaksud dengan inflasi?",
                  options: {
                    create: [
                      { text: "Kenaikan harga barang secara umum dan terus-menerus", isCorrect: true },
                      { text: "Penurunan nilai mata uang asing", isCorrect: false },
                      { text: "Kenaikan jumlah produksi barang", isCorrect: false },
                      { text: "Penurunan tingkat pengangguran", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Apa yang dimaksud dengan urbanisasi?",
                  options: {
                    create: [
                      { text: "Perpindahan penduduk dari desa ke kota", isCorrect: true },
                      { text: "Perpindahan penduduk dari kota ke desa", isCorrect: false },
                      { text: "Pertumbuhan penduduk di pedesaan", isCorrect: false },
                      { text: "Penurunan jumlah penduduk kota", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "PBB (Perserikatan Bangsa-Bangsa) didirikan pada tahun?",
                  options: {
                    create: [
                      { text: "1945", isCorrect: true },
                      { text: "1941", isCorrect: false },
                      { text: "1949", isCorrect: false },
                      { text: "1955", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Sungai terpanjang di dunia adalah?",
                  options: {
                    create: [
                      { text: "Sungai Nil", isCorrect: true },
                      { text: "Sungai Amazon", isCorrect: false },
                      { text: "Sungai Yangtze", isCorrect: false },
                      { text: "Sungai Mississippi", isCorrect: false },
                    ],
                  },
                },
              ],
            },
          },

          // ── POST-TEST ────────────────────────────────────────────────────────
          {
            type: "POST",
            title: "Post-Test: Pengantar IPS",
            duration: 20,
            passingScore: 70,
            maxAttempts: 3,
            randomizeQuestions: true,
            randomizeOptions: true,
            questions: {
              create: [
                {
                  text: "Mengapa letak geografis Indonesia sangat strategis bagi perdagangan internasional?",
                  options: {
                    create: [
                      {
                        text: "Karena Indonesia terletak di jalur perdagangan dunia antara Asia dan Australia, serta antara Samudra Hindia dan Pasifik",
                        isCorrect: true,
                      },
                      { text: "Karena Indonesia memiliki banyak gunung berapi", isCorrect: false },
                      { text: "Karena Indonesia adalah negara kepulauan terbesar", isCorrect: false },
                      { text: "Karena Indonesia memiliki banyak sungai", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Apa makna Sumpah Pemuda yang dikumandangkan pada 28 Oktober 1928?",
                  options: {
                    create: [
                      {
                        text: "Persatuan pemuda Indonesia untuk mengakui satu tanah air, satu bangsa, dan satu bahasa yaitu Indonesia",
                        isCorrect: true,
                      },
                      { text: "Deklarasi kemerdekaan Indonesia", isCorrect: false },
                      { text: "Pembentukan pemerintahan pertama Indonesia", isCorrect: false },
                      { text: "Pendirian organisasi kepemudaan pertama", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Bagaimana sistem ekonomi Pancasila berbeda dengan sistem ekonomi kapitalis murni?",
                  options: {
                    create: [
                      {
                        text: "Sistem ekonomi Pancasila mengutamakan keseimbangan kepentingan individu dan masyarakat, serta peran negara untuk kesejahteraan bersama",
                        isCorrect: true,
                      },
                      { text: "Sistem ekonomi Pancasila tidak mengizinkan kepemilikan pribadi", isCorrect: false },
                      { text: "Sistem ekonomi Pancasila hanya fokus pada keuntungan perusahaan", isCorrect: false },
                      { text: "Sistem ekonomi Pancasila sama persis dengan sistem kapitalis", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Apa dampak positif dari keberagaman budaya di Indonesia?",
                  options: {
                    create: [
                      {
                        text: "Memperkaya khazanah budaya nasional, meningkatkan toleransi, dan menjadi daya tarik wisata",
                        isCorrect: true,
                      },
                      { text: "Menyebabkan perpecahan bangsa", isCorrect: false },
                      { text: "Menghambat pembangunan ekonomi", isCorrect: false },
                      { text: "Tidak ada dampak positif", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Mengapa Indonesia disebut sebagai negara agraris?",
                  options: {
                    create: [
                      {
                        text: "Karena sebagian besar penduduk bekerja di sektor pertanian dan Indonesia memiliki lahan pertanian yang luas serta subur",
                        isCorrect: true,
                      },
                      { text: "Karena Indonesia memiliki banyak pabrik industri", isCorrect: false },
                      { text: "Karena Indonesia adalah negara industri terbesar", isCorrect: false },
                      { text: "Karena Indonesia memiliki banyak tambang mineral", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Apa yang dimaksud dengan demokrasi Pancasila?",
                  options: {
                    create: [
                      {
                        text: "Sistem demokrasi yang berlandaskan nilai-nilai Pancasila, mengutamakan musyawarah mufakat dan gotong royong",
                        isCorrect: true,
                      },
                      { text: "Sistem pemerintahan oleh satu orang penguasa", isCorrect: false },
                      { text: "Sistem pemerintahan oleh kelompok militer", isCorrect: false },
                      { text: "Sistem demokrasi liberal tanpa nilai lokal", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Faktor geografis apa yang menyebabkan Indonesia rawan bencana gempa bumi?",
                  options: {
                    create: [
                      {
                        text: "Indonesia terletak di Cincin Api Pasifik (Ring of Fire) yang merupakan pertemuan lempeng tektonik",
                        isCorrect: true,
                      },
                      { text: "Karena Indonesia memiliki banyak sungai besar", isCorrect: false },
                      { text: "Karena Indonesia beriklim tropis", isCorrect: false },
                      { text: "Karena Indonesia adalah kepulauan", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Apa peran koperasi dalam sistem ekonomi Indonesia?",
                  options: {
                    create: [
                      {
                        text: "Sebagai soko guru perekonomian nasional yang bertujuan meningkatkan kesejahteraan anggota dan masyarakat",
                        isCorrect: true,
                      },
                      { text: "Sebagai perusahaan swasta yang berorientasi profit semata", isCorrect: false },
                      { text: "Sebagai badan usaha milik asing", isCorrect: false },
                      { text: "Sebagai lembaga peminjaman uang saja", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Konferensi Asia-Afrika yang menghasilkan Dasasila Bandung diselenggarakan pada tahun?",
                  options: {
                    create: [
                      { text: "1955", isCorrect: true },
                      { text: "1945", isCorrect: false },
                      { text: "1961", isCorrect: false },
                      { text: "1949", isCorrect: false },
                    ],
                  },
                },
                {
                  text: "Apa yang dimaksud dengan mobilitas sosial?",
                  options: {
                    create: [
                      {
                        text: "Perpindahan posisi atau status sosial seseorang atau kelompok dalam struktur sosial masyarakat",
                        isCorrect: true,
                      },
                      { text: "Perpindahan tempat tinggal dari satu daerah ke daerah lain", isCorrect: false },
                      { text: "Perubahan budaya akibat globalisasi", isCorrect: false },
                      { text: "Pertambahan jumlah penduduk secara alamiah", isCorrect: false },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    } as any,
  });

  console.log(`\n🎉 IPS Course seeding completed successfully!`);
  console.log(`📚 Course   : ${course.title}`);
  console.log(`🆔 Course ID: ${course.id}`);
  console.log(`📦 Modules  : 3 modul dibuat`);
  console.log(`📝 Pre-Test : 10 soal (passing score 60, max 2 percobaan)`);
  console.log(`📝 Post-Test: 10 soal (passing score 70, max 3 percobaan)`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding IPS course:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
