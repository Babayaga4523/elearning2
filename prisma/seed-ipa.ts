import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function main() {
  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" }
  });

  if (!admin) {
    console.error("Admin user not found. Please run the main seed first.");
    return;
  }

  // Create or get Science category
  const categoryIPA = await prisma.category.upsert({
    where: { name: "Ilmu Pengetahuan Alam" },
    update: {},
    create: { name: "Ilmu Pengetahuan Alam" },
  });

  console.log("Creating IPA Course...");

  // Create IPA Course with modules and tests
  const courseIPA = await prisma.course.create({
    data: {
      userId: admin.id,
      title: "Dasar-Dasar Ilmu Pengetahuan Alam",
      description: "Kursus pengenalan konsep dasar IPA meliputi fisika, kimia, dan biologi untuk pemahaman fundamental sains.",
      categoryId: categoryIPA.id,
      deadlineDuration: 14, // 14 hari
      isPublished: true,
      isVisible: true,
      
      // Create Modules
      modules: {
        create: [
          {
            title: "Pengenalan Fisika Dasar",
            description: "Memahami konsep dasar fisika seperti gerak, gaya, dan energi",
            position: 0,
            isPublished: true,
            type: "VIDEO",
            url: "https://www.youtube.com/watch?v=example1",
            duration: 30,
          },
          {
            title: "Konsep Kimia Fundamental",
            description: "Mempelajari struktur atom, tabel periodik, dan ikatan kimia",
            position: 1,
            isPublished: true,
            type: "VIDEO",
            url: "https://www.youtube.com/watch?v=example2",
            duration: 35,
          },
          {
            title: "Biologi dan Kehidupan",
            description: "Mengenal sel, jaringan, dan sistem organ makhluk hidup",
            position: 2,
            isPublished: true,
            type: "VIDEO",
            url: "https://www.youtube.com/watch?v=example3",
            duration: 40,
          },
          {
            title: "Ekosistem dan Lingkungan",
            description: "Memahami hubungan makhluk hidup dengan lingkungannya",
            position: 3,
            isPublished: true,
            type: "VIDEO",
            url: "https://www.youtube.com/watch?v=example4",
            duration: 25,
          },
          {
            title: "Energi dan Perubahannya",
            description: "Mempelajari berbagai bentuk energi dan konversinya",
            position: 4,
            isPublished: true,
            type: "VIDEO",
            url: "https://www.youtube.com/watch?v=example5",
            duration: 30,
          },
        ]
      },
      
      // Create Tests
      tests: {
        create: [
          // PRE-TEST
          {
            type: "PRE",
            title: "Pre-Test IPA",
            duration: 15,
            passingScore: 60,
            maxAttempts: 2,
            randomizeQuestions: true,
            randomizeOptions: true,
            questions: {
              create: [
                {
                  text: "Apa yang dimaksud dengan gaya dalam fisika?",
                  options: {
                    create: [
                      { text: "Tarikan atau dorongan yang dapat mengubah keadaan gerak benda", isCorrect: true },
                      { text: "Kecepatan benda yang bergerak", isCorrect: false },
                      { text: "Massa benda dikali percepatannya", isCorrect: false },
                      { text: "Energi yang dimiliki benda", isCorrect: false },
                    ]
                  }
                },
                {
                  text: "Unsur kimia dengan simbol 'O' adalah?",
                  options: {
                    create: [
                      { text: "Oksigen", isCorrect: true },
                      { text: "Osmium", isCorrect: false },
                      { text: "Emas (Gold)", isCorrect: false },
                      { text: "Ozon", isCorrect: false },
                    ]
                  }
                },
                {
                  text: "Bagian terkecil dari makhluk hidup yang masih dapat menjalankan fungsi kehidupan adalah?",
                  options: {
                    create: [
                      { text: "Sel", isCorrect: true },
                      { text: "Jaringan", isCorrect: false },
                      { text: "Organ", isCorrect: false },
                      { text: "Molekul", isCorrect: false },
                    ]
                  }
                },
                {
                  text: "Proses fotosintesis pada tumbuhan menghasilkan?",
                  options: {
                    create: [
                      { text: "Glukosa dan Oksigen", isCorrect: true },
                      { text: "Karbon dioksida dan Air", isCorrect: false },
                      { text: "Protein dan Lemak", isCorrect: false },
                      { text: "Nitrogen dan Hidrogen", isCorrect: false },
                    ]
                  }
                },
                {
                  text: "Satuan Internasional (SI) untuk massa adalah?",
                  options: {
                    create: [
                      { text: "Kilogram (kg)", isCorrect: true },
                      { text: "Gram (g)", isCorrect: false },
                      { text: "Newton (N)", isCorrect: false },
                      { text: "Pound (lb)", isCorrect: false },
                    ]
                  }
                },
              ]
            }
          },
          
          // POST-TEST
          {
            type: "POST",
            title: "Post-Test IPA",
            duration: 20,
            passingScore: 70,
            maxAttempts: 3,
            randomizeQuestions: true,
            randomizeOptions: true,
            questions: {
              create: [
                {
                  text: "Hukum Newton I menyatakan bahwa benda akan tetap diam atau bergerak lurus beraturan jika?",
                  options: {
                    create: [
                      { text: "Tidak ada gaya yang bekerja atau resultan gaya sama dengan nol", isCorrect: true },
                      { text: "Ada gaya yang bekerja pada benda", isCorrect: false },
                      { text: "Benda memiliki massa yang besar", isCorrect: false },
                      { text: "Benda bergerak dengan kecepatan tinggi", isCorrect: false },
                    ]
                  }
                },
                {
                  text: "Ikatan kimia yang terjadi karena serah terima elektron disebut?",
                  options: {
                    create: [
                      { text: "Ikatan ion", isCorrect: true },
                      { text: "Ikatan kovalen", isCorrect: false },
                      { text: "Ikatan hidrogen", isCorrect: false },
                      { text: "Ikatan logam", isCorrect: false },
                    ]
                  }
                },
                {
                  text: "Organel sel yang berfungsi sebagai pusat pengendali seluruh kegiatan sel adalah?",
                  options: {
                    create: [
                      { text: "Nukleus (inti sel)", isCorrect: true },
                      { text: "Mitokondria", isCorrect: false },
                      { text: "Ribosom", isCorrect: false },
                      { text: "Lisosom", isCorrect: false },
                    ]
                  }
                },
                {
                  text: "Dalam ekosistem, organisme yang dapat membuat makanan sendiri disebut?",
                  options: {
                    create: [
                      { text: "Produsen (autotrof)", isCorrect: true },
                      { text: "Konsumen (heterotrof)", isCorrect: false },
                      { text: "Dekomposer", isCorrect: false },
                      { text: "Predator", isCorrect: false },
                    ]
                  }
                },
                {
                  text: "Energi yang dimiliki benda karena kedudukannya (ketinggian) disebut?",
                  options: {
                    create: [
                      { text: "Energi potensial", isCorrect: true },
                      { text: "Energi kinetik", isCorrect: false },
                      { text: "Energi mekanik", isCorrect: false },
                      { text: "Energi panas", isCorrect: false },
                    ]
                  }
                },
                {
                  text: "Rumus kimia untuk air adalah?",
                  options: {
                    create: [
                      { text: "H₂O", isCorrect: true },
                      { text: "CO₂", isCorrect: false },
                      { text: "O₂", isCorrect: false },
                      { text: "H₂SO₄", isCorrect: false },
                    ]
                  }
                },
                {
                  text: "Proses pernapasan sel yang menghasilkan energi (ATP) terjadi di?",
                  options: {
                    create: [
                      { text: "Mitokondria", isCorrect: true },
                      { text: "Kloroplas", isCorrect: false },
                      { text: "Nukleus", isCorrect: false },
                      { text: "Retikulum endoplasma", isCorrect: false },
                    ]
                  }
                },
                {
                  text: "Perpindahan panas tanpa melalui zat perantara disebut?",
                  options: {
                    create: [
                      { text: "Radiasi", isCorrect: true },
                      { text: "Konduksi", isCorrect: false },
                      { text: "Konveksi", isCorrect: false },
                      { text: "Isolasi", isCorrect: false },
                    ]
                  }
                },
                {
                  text: "Rantai makanan dimulai dari?",
                  options: {
                    create: [
                      { text: "Produsen (tumbuhan hijau)", isCorrect: true },
                      { text: "Konsumen tingkat I (herbivora)", isCorrect: false },
                      { text: "Konsumen tingkat II (karnivora)", isCorrect: false },
                      { text: "Dekomposer", isCorrect: false },
                    ]
                  }
                },
                {
                  text: "Perubahan wujud dari padat menjadi gas disebut?",
                  options: {
                    create: [
                      { text: "Sublimasi", isCorrect: true },
                      { text: "Penguapan", isCorrect: false },
                      { text: "Pencairan", isCorrect: false },
                      { text: "Pembekuan", isCorrect: false },
                    ]
                  }
                },
              ]
            }
          },
        ]
      }
    } as any
  });

  console.log("✅ IPA Course created successfully!");
  console.log("Course ID:", courseIPA.id);
  console.log("Title:", courseIPA.title);
  console.log("Modules: 5 modules created");
  console.log("Pre-Test: 5 questions");
  console.log("Post-Test: 10 questions");
  console.log("\nJawaban yang benar sudah ditandai dengan isCorrect: true");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
