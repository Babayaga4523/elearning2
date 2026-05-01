/**
 * Script to update karyawan@bnif.co.id with multiple roles
 */

import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Updating karyawan@bnif.co.id to have multiple roles...\n");

  try {
    // Update user
    const updatedUser = await prisma.user.update({
      where: { email: "karyawan@bnif.co.id" },
      data: {
        roles: ["KARYAWAN", "ADMIN"],
        activeRole: null, // Clear active role to force role selection
      },
      select: {
        email: true,
        name: true,
        nip: true,
        roles: true,
        activeRole: true,
        authMethod: true,
      },
    });

    console.log("✅ Successfully updated user!\n");
    console.log("User Details:");
    console.log("─────────────────────────────────────");
    console.log(`Email:       ${updatedUser.email}`);
    console.log(`Name:        ${updatedUser.name}`);
    console.log(`NIP:         ${updatedUser.nip || "N/A"}`);
    console.log(`Roles:       ${updatedUser.roles.join(", ")}`);
    console.log(`Active Role: ${updatedUser.activeRole || "None (will be selected on next login)"}`);
    console.log(`Auth Method: ${updatedUser.authMethod}`);
    console.log("─────────────────────────────────────\n");

    console.log("🎉 Done! User can now select between KARYAWAN and ADMIN roles on next login.");
  } catch (error: any) {
    if (error.code === "P2025") {
      console.error("❌ Error: User karyawan@bnif.co.id not found in database.");
    } else {
      console.error("❌ Error updating user:", error.message);
    }
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
