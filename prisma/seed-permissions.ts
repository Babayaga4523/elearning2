// ─── Permission Seed Script ─────────────────────────────────────
// Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-permissions.ts
// Seeds all permissions and assigns default permissions per role.

import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

// All available permissions
const PERMISSIONS = [
  {
    key: "manage_courses",
    label: "Kelola Kursus",
    description: "Membuat, mengedit, dan menghapus kursus serta modul",
    group: "Kursus",
  },
  {
    key: "view_course_reports",
    label: "Laporan Kursus",
    description: "Melihat laporan progress dan enrollment per kursus",
    group: "Laporan",
  },
  {
    key: "manage_users",
    label: "Kelola User",
    description: "Mengelola data karyawan, import user, dan akun terkunci",
    group: "User Management",
  },
  {
    key: "manage_roles",
    label: "Kelola Role & Permission",
    description: "Mengatur permission untuk setiap role admin",
    group: "Sistem",
  },
  {
    key: "view_all_reports",
    label: "Semua Laporan",
    description: "Melihat seluruh laporan analitik dan log sistem",
    group: "Laporan",
  },
  {
    key: "manage_settings",
    label: "Pengaturan Sistem",
    description: "Mengelola konfigurasi sistem, scheduler, dan pengaturan lainnya",
    group: "Sistem",
  },
];

// Default permissions for ADMIN role
const DEFAULT_ADMIN_PERMISSIONS = ["manage_courses", "view_course_reports"];

async function main() {
  console.log("🔐 Seeding permissions...\n");

  // 1. Upsert all permissions
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        label: perm.label,
        description: perm.description,
        group: perm.group,
      },
      create: {
        key: perm.key,
        label: perm.label,
        description: perm.description,
        group: perm.group,
      },
    });
    console.log(`  ✅ Permission: ${perm.key} (${perm.label})`);
  }

  // 2. Assign default permissions to ADMIN role
  console.log("\n📋 Assigning default ADMIN permissions...");
  
  for (const permKey of DEFAULT_ADMIN_PERMISSIONS) {
    const permission = await prisma.permission.findUnique({
      where: { key: permKey },
    });

    if (!permission) {
      console.warn(`  ⚠️  Permission "${permKey}" not found, skipping.`);
      continue;
    }

    await prisma.rolePermission.upsert({
      where: {
        role_permissionId: {
          role: "ADMIN",
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        role: "ADMIN",
        permissionId: permission.id,
      },
    });
    console.log(`  ✅ ADMIN → ${permKey}`);
  }

  // 3. Assign ALL permissions to SUPER_ADMIN role
  // (This is optional since SUPER_ADMIN has hardcoded full access,
  //  but we store it for reference/audit purposes)
  console.log("\n🔑 Assigning ALL permissions to SUPER_ADMIN...");
  
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_permissionId: {
          role: "SUPER_ADMIN",
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        role: "SUPER_ADMIN",
        permissionId: permission.id,
      },
    });
    console.log(`  ✅ SUPER_ADMIN → ${permission.key}`);
  }

  console.log("\n🎉 Permission seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
