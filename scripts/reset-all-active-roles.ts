import { PrismaClient } from "@/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Resetting all active roles...\n");

  // Reset all users' active roles to null
  const result = await prisma.user.updateMany({
    data: {
      activeRole: null,
    },
  });

  console.log(`✅ Reset ${result.count} users' active roles to null\n`);

  // Show current state
  console.log("📋 Current user states:");
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
    console.log(`   Active role: ${user.activeRole || "null (must select on login)"}`);
  });

  console.log("\n" + "═".repeat(80));
  console.log("\n✅ All done! All users must now select their role on next login.\n");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
