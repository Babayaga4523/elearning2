import { PrismaClient } from "@/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📋 Checking all users in database...\n");
  console.log("═".repeat(80));

  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      nip: true,
      role: true,
      roles: true,
      activeRole: true,
      authMethod: true,
      lastLoginMethod: true,
      lastLoginAt: true,
    },
    orderBy: { email: "asc" },
  });

  if (allUsers.length === 0) {
    console.log("⚠️  No users found in database");
    return;
  }

  allUsers.forEach((user, index) => {
    console.log(`\n${index + 1}. 📧 ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name || "N/A"}`);
    console.log(`   NIP: ${user.nip || "N/A"}`);
    console.log(`   ─────────────────────────────────────────────────`);
    console.log(`   Legacy role: ${user.role}`);
    console.log(`   Roles array: [${user.roles.join(", ")}]`);
    console.log(`   Active role: ${user.activeRole || "null (not selected)"}`);
    console.log(`   ─────────────────────────────────────────────────`);
    console.log(`   Auth method: ${user.authMethod || "N/A"}`);
    console.log(`   Last login: ${user.lastLoginMethod || "N/A"}`);
    console.log(`   Last login at: ${user.lastLoginAt?.toISOString() || "N/A"}`);
  });

  console.log("\n" + "═".repeat(80));
  console.log(`\n✅ Total users: ${allUsers.length}\n`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
