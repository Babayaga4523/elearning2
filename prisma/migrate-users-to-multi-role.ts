/**
 * Migration script to update existing users to multi-role system
 * This script:
 * 1. Migrates single 'role' field to 'roles' array
 * 2. Sets 'activeRole' based on current 'role'
 * 3. Sets default authMethod to MANUAL for existing users
 */

import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting user migration to multi-role system...\n");

  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      roles: true,
      activeRole: true,
      authMethod: true,
    },
  });

  console.log(`Found ${users.length} users to migrate\n`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const user of users) {
    try {
      // Skip if already migrated (has roles array populated)
      if (user.roles && user.roles.length > 0) {
        console.log(`✓ Skipping ${user.email} - already migrated`);
        skippedCount++;
        continue;
      }

      // Migrate user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          roles: [user.role], // Convert single role to array
          activeRole: user.role, // Set active role to current role
          authMethod: user.authMethod || "MANUAL", // Default to MANUAL if not set
        },
      });

      console.log(`✓ Migrated ${user.email} - Role: ${user.role}`);
      migratedCount++;
    } catch (error) {
      console.error(`✗ Error migrating ${user.email}:`, error);
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`Migrated: ${migratedCount} users`);
  console.log(`Skipped: ${skippedCount} users`);
  console.log(`Total: ${users.length} users`);
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
