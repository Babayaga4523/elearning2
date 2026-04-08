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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
