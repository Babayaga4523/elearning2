import { PrismaClient } from "@/generated/client";

const prisma = new PrismaClient();

async function fixKaryawanRole() {
  try {
    console.log("🔧 Fixing karyawan user role...\n");

    const user = await prisma.user.findUnique({
      where: { email: "karyawan@bnif.co.id" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roles: true,
        activeRole: true,
      },
    });

    if (!user) {
      console.log("❌ User not found: karyawan@bnif.co.id");
      return;
    }

    console.log(`📧 Found user: karyawan@bnif.co.id`);
    console.log(`   Current role: ${user.role}`);
    console.log(`   Current roles: ${JSON.stringify(user.roles)}`);
    console.log(`   Active role: ${user.activeRole}`);

    // Update to only KARYAWAN role
    await prisma.user.update({
      where: { email: "karyawan@bnif.co.id" },
      data: {
        roles: ["KARYAWAN"] as any,
        role: "KARYAWAN" as any,
        activeRole: null, // Reset so user must select role on next login
      },
    });

    console.log(`\n   ✅ Updated to:`);
    console.log(`      role: KARYAWAN`);
    console.log(`      roles: ["KARYAWAN"]`);
    console.log(`      activeRole: null (will select on next login)`);

    console.log("\n✅ Karyawan role fixed successfully!");

  } catch (error) {
    console.error("❌ Error fixing karyawan role:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixKaryawanRole()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
