import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@bnif.co.id" },
    update: {
      department: "Human Resources",
    },
    create: {
      email: "admin@bnif.co.id",
      name: "Admin BNI Finance",
      password: adminPassword,
      role: "ADMIN",
      department: "Human Resources",
    },
  });

  // Create Karyawan
  const user = await prisma.user.upsert({
    where: { email: "karyawan@bnif.co.id" },
    update: {
      department: "Credit Operations",
    },
    create: {
      email: "karyawan@bnif.co.id",
      name: "Yoga Utama",
      password: userPassword,
      role: "KARYAWAN",
      department: "Credit Operations",
    },
  });

  // Create Additional Karyawan 1
  const karyawanBudi = await prisma.user.upsert({
    where: { email: "budi.santoso@bnif.co.id" },
    update: {},
    create: {
      email: "budi.santoso@bnif.co.id",
      name: "Budi Santoso",
      password: userPassword,
      role: "KARYAWAN",
      department: "IT Infrastructure",
      lokasi: "Jakarta",
      nip: "100200",
    },
  });

  // Create Additional Karyawan 2
  const karyawanSiti = await prisma.user.upsert({
    where: { email: "siti.aminah@bnif.co.id" },
    update: {},
    create: {
      email: "siti.aminah@bnif.co.id",
      name: "Siti Aminah",
      password: userPassword,
      role: "KARYAWAN",
      department: "Finance & Accounting",
      lokasi: "Surabaya",
      nip: "100201",
    },
  });

  // Create Additional Karyawan 3
  const karyawanAndi = await prisma.user.upsert({
    where: { email: "andi.pratama@bnif.co.id" },
    update: {},
    create: {
      email: "andi.pratama@bnif.co.id",
      name: "Andi Pratama",
      password: userPassword,
      role: "KARYAWAN",
      department: "Marketing",
      lokasi: "Bandung",
      nip: "100202",
    },
  });

  // Create Categories
  const category1 = await prisma.category.upsert({
    where: { name: "Corporate Culture" },
    update: {},
    create: { name: "Corporate Culture" },
  });

  const category2 = await prisma.category.upsert({
    where: { name: "Technical Skills" },
    update: {},
    create: { name: "Technical Skills" },
  });

  console.log("Seed data created successfully:");
  console.log({ admin, user, categories: [category1, category2] });

  // 1. Create a Sample Course
  const course = await prisma.course.create({
    data: {
      userId: admin.id,
      title: "BNI Corporate Culture 2026",
      description: "Materi pengenalan budaya kerja dan nilai-nilai inti perusahaan.",
      categoryId: category1.id,
      deadlineDuration: 7,
      isPublished: false, // Start as draft so user can test the Publish button
      modules: {
        create: [
          {
            title: "Pengenalan Visi & Misi",
            description: "Memahami arah strategis perusahaan.",
            position: 1,
            isPublished: true,
            type: "VIDEO",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          }
        ]
      },
      tests: {
        create: [
          {
            type: "PRE",
            title: "Pre-Test Budaya",
            duration: 10,
            passingScore: 70,
            maxAttempts: 1,
            questions: {
              create: [
                {
                  text: "Apa nilai utama dalam BNI Finance?",
                  options: {
                    create: [
                      { text: "Integritas", isCorrect: true },
                      { text: "Asal Kerja", isCorrect: false },
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    } as any
  });

  console.log("Sample Course created:", course.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
