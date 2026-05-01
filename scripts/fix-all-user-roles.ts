import { PrismaClient } from "@/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Starting user roles fix...\n");

  // 1. Fix admin@bnif.co.id - should have ADMIN role
  console.log("1️⃣ Fixing admin@bnif.co.id...");
  const admin = await prisma.user.findUnique({
    where: { email: "admin@bnif.co.id" },
  });

  if (admin) {
    await prisma.user.update({
      where: { email: "admin@bnif.co.id" },
      data: {
        roles: ["ADMIN"],
        role: "ADMIN",
        activeRole: null, // Reset so user must select role on next login
      },
    });
    console.log("✅ admin@bnif.co.id updated:");
    console.log("   - roles: [ADMIN]");
    console.log("   - role: ADMIN");
    console.log("   - activeRole: null (will be set on next login)\n");
  } else {
    console.log("⚠️  admin@bnif.co.id not found in database\n");
  }

  // 2. Fix karyawan@bnif.co.id - should have both KARYAWAN and ADMIN roles
  console.log("2️⃣ Fixing karyawan@bnif.co.id...");
  const karyawan = await prisma.user.findUnique({
    where: { email: "karyawan@bnif.co.id" },
  });

  if (karyawan) {
    await prisma.user.update({
      where: { email: "karyawan@bnif.co.id" },
      data: {
        roles: ["KARYAWAN", "ADMIN"], // Has both roles
        role: "KARYAWAN", // Legacy field set to first role
        activeRole: null, // Reset so user must select role on next login
      },
    });
    console.log("✅ karyawan@bnif.co.id updated:");
    console.log("   - roles: [KARYAWAN, ADMIN]");
    console.log("   - role: KARYAWAN");
    console.log("   - activeRole: null (will be set on next login)\n");
  } else {
    console.log("⚠️  karyawan@bnif.co.id not found in database\n");
  }

  // 3. Show all users with their roles
  console.log("3️⃣ Current user roles in database:");
  console.log("═".repeat(80));
  
  const allUsers = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      role: true,
      roles: true,
      activeRole: true,
    },
    orderBy: { email: "asc" },
  });

  allUsers.forEach((user) => {
    console.log(`\n📧 ${user.email}`);
    console.log(`   Name: ${user.name || "N/A"}`);
    console.log(`   Legacy role: ${user.role}`);
    console.log(`   Roles array: [${user.roles.join(", ")}]`);
    console.log(`   Active role: ${user.activeRole || "null (not selected yet)"}`);
  });

  console.log("\n" + "═".repeat(80));
  console.log("\n✅ All done! Users can now login and select their roles.");
  console.log("\n📝 Next steps:");
  console.log("   1. Login as admin@bnif.co.id");
  console.log("   2. You will see role selection modal");
  console.log("   3. Select 'Admin' role");
  console.log("   4. You will be redirected to /admin dashboard");
  console.log("\n   For karyawan@bnif.co.id:");
  console.log("   1. Login as karyawan@bnif.co.id");
  console.log("   2. You will see TWO roles: Karyawan and Admin");
  console.log("   3. Select 'Admin' to access admin panel");
  console.log("   4. Or select 'Karyawan' to access learning dashboard\n");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
