import { PrismaClient } from "@/generated/client";

const prisma = new PrismaClient();

async function fixAdminRoles() {
  try {
    console.log("🔧 Fixing admin user roles...\n");

    // List of admin emails
    const adminEmails = [
      "admin@bnif.co.id",
      "superadmin@bnif.co.id",
    ];

    for (const email of adminEmails) {
      const user = await prisma.user.findUnique({
        where: { email },
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
        console.log(`❌ User not found: ${email}`);
        continue;
      }

      console.log(`\n📧 Found user: ${email}`);
      console.log(`   Current role: ${user.role}`);
      console.log(`   Current roles: ${JSON.stringify(user.roles)}`);
      console.log(`   Active role: ${user.activeRole}`);

      // Determine new roles based on email
      let newRoles: string[];
      let newRole: string;

      if (email === "superadmin@bnif.co.id") {
        newRoles = ["SUPER_ADMIN", "ADMIN", "KARYAWAN"];
        newRole = "SUPER_ADMIN";
      } else if (email === "admin@bnif.co.id") {
        newRoles = ["ADMIN", "KARYAWAN"];
        newRole = "ADMIN";
      } else {
        continue;
      }

      // Update user
      await prisma.user.update({
        where: { email },
        data: {
          roles: newRoles as any,
          role: newRole as any,
          activeRole: null, // Reset so user must select role on next login
        },
      });

      console.log(`   ✅ Updated to:`);
      console.log(`      role: ${newRole}`);
      console.log(`      roles: ${JSON.stringify(newRoles)}`);
      console.log(`      activeRole: null (will select on next login)`);
    }

    // Also check karyawan@bnif.co.id
    const karyawanUser = await prisma.user.findUnique({
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

    if (karyawanUser) {
      console.log(`\n📧 Found user: karyawan@bnif.co.id`);
      console.log(`   Current role: ${karyawanUser.role}`);
      console.log(`   Current roles: ${JSON.stringify(karyawanUser.roles)}`);
      console.log(`   Active role: ${karyawanUser.activeRole}`);

      // Ensure karyawan has correct role
      if (!karyawanUser.roles.includes("KARYAWAN")) {
        await prisma.user.update({
          where: { email: "karyawan@bnif.co.id" },
          data: {
            roles: ["KARYAWAN"] as any,
            role: "KARYAWAN" as any,
            activeRole: null,
          },
        });
        console.log(`   ✅ Updated to KARYAWAN role`);
      } else {
        console.log(`   ✅ Already has correct role`);
      }
    }

    console.log("\n✅ Admin roles fixed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Logout from all sessions");
    console.log("   2. Login again");
    console.log("   3. Select your role from the modal");
    console.log("   4. You should now have access to admin features");

  } catch (error) {
    console.error("❌ Error fixing admin roles:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
