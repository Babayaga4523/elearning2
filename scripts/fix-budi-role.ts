import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 FIXING BUDI'S ROLE...\n");

  const budi = await prisma.user.findUnique({
    where: { email: "budi.santoso@bnif.co.id" }
  });

  if (!budi) {
    console.log("❌ Budi not found!");
    return;
  }

  console.log(`👤 Current Budi status:`);
  console.log(`   Name: ${budi.name}`);
  console.log(`   Roles: [${budi.roles?.join(', ') || 'NULL'}]`);
  console.log(`   Active Role: ${budi.activeRole || 'NULL'}`);

  // Update Budi's role (using legacy field for now)
  const updatedBudi = await prisma.user.update({
    where: { id: budi.id },
    data: {
      role: "KARYAWAN" // Use legacy field
    }
  });

  console.log(`\n✅ Updated Budi's role:`);
  console.log(`   Role: ${updatedBudi.role}`);

  console.log("\n🧪 Now Budi can:");
  console.log("   1. Login as KARYAWAN");
  console.log("   2. Access enrolled courses");
  console.log("   3. Watch video modules with working URLs");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());