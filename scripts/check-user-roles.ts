/**
 * Script to check user roles in database
 */

import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking user roles in database...\n");

  try {
    // Get user data
    const user = await prisma.user.findUnique({
      where: { email: "karyawan@bnif.co.id" },
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
    });

    if (!user) {
      console.error("❌ User karyawan@bnif.co.id not found in database!");
      process.exit(1);
    }

    console.log("✅ User found in database\n");
    console.log("═══════════════════════════════════════════════════");
    console.log("USER DETAILS:");
    console.log("═══════════════════════════════════════════════════");
    console.log(`ID:              ${user.id}`);
    console.log(`Email:           ${user.email}`);
    console.log(`Name:            ${user.name}`);
    console.log(`NIP:             ${user.nip || "N/A"}`);
    console.log(`─────────────────────────────────────────────────`);
    console.log(`Legacy Role:     ${user.role}`);
    console.log(`Roles Array:     [${user.roles.join(", ")}]`);
    console.log(`Active Role:     ${user.activeRole || "NULL"}`);
    console.log(`─────────────────────────────────────────────────`);
    console.log(`Auth Method:     ${user.authMethod}`);
    console.log(`Last Login:      ${user.lastLoginMethod || "N/A"}`);
    console.log(`Last Login At:   ${user.lastLoginAt?.toISOString() || "N/A"}`);
    console.log("═══════════════════════════════════════════════════\n");

    // Check if user has multiple roles
    if (user.roles.length > 1) {
      console.log("✅ User has MULTIPLE roles:", user.roles.join(", "));
      console.log("✅ Modal SHOULD appear on next login\n");
    } else {
      console.log("⚠️  User has SINGLE role:", user.roles[0]);
      console.log("⚠️  Modal will NOT appear (auto-redirect)\n");
    }

    // Check active role
    if (user.activeRole) {
      console.log(`⚠️  Active role is SET to: ${user.activeRole}`);
      console.log("⚠️  User will be redirected directly without modal\n");
      console.log("💡 To force role selection, run:");
      console.log("   npm run clear:active-role\n");
    } else {
      console.log("✅ Active role is NULL");
      console.log("✅ User will see role selection modal\n");
    }

  } catch (error: any) {
    console.error("❌ Error checking user:", error.message);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
