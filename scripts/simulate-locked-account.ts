import { PrismaClient } from "../src/generated/client/index.js";

const prisma = new PrismaClient();

async function main() {
  const email = "gita.nirmala@bnif.co.id";
  const ipAddress = "::1";

  console.log(`🔒 Creating fresh locked account for: ${email}\n`);

  // Delete old attempts
  await prisma.loginAttempt.deleteMany({
    where: { email },
  });

  console.log("🗑️  Cleared old attempts");

  // Create 5 new attempts (to lock the account)
  for (let i = 0; i < 5; i++) {
    await prisma.loginAttempt.create({
      data: {
        email,
        ipAddress,
      },
    });
  }

  console.log("✅ Created 5 new failed attempts");

  // Check current count
  const count = await prisma.loginAttempt.count({
    where: {
      email,
      createdAt: {
        gte: new Date(Date.now() - 15 * 60 * 1000),
      },
    },
  });

  console.log(`📊 Total attempts now: ${count}/5`);
  console.log(count >= 5 ? "🔒 Account is now LOCKED" : "⚠️ Not locked yet");
  
  // Show all attempts
  const attempts = await prisma.loginAttempt.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  
  console.log("\n📋 Recent attempts:");
  attempts.forEach((attempt, i) => {
    console.log(`  ${i + 1}. ${attempt.createdAt.toISOString()}`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
