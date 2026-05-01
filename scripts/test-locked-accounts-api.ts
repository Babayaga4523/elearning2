import { PrismaClient } from "../src/generated/client/index.js";

const prisma = new PrismaClient();

const EMAIL_MAX_ATTEMPTS = 5;
const IP_MAX_ATTEMPTS = 20;
const WINDOW_MINUTES = 15;
const WINDOW_MS = WINDOW_MINUTES * 60 * 1000;

function windowStart(): Date {
  return new Date(Date.now() - WINDOW_MS);
}

async function testManualGrouping() {
  console.log("🧪 Testing Manual Grouping Logic...\n");

  const since = windowStart();

  // Get all login attempts in the window
  const allAttempts = await prisma.loginAttempt.findMany({
    where: { createdAt: { gte: since } },
    select: {
      email: true,
      ipAddress: true,
      createdAt: true,
    },
  });

  console.log(`📊 Total attempts in window: ${allAttempts.length}\n`);

  // Group by email manually
  const emailMap = new Map<string, { count: number; lastAttempt: Date }>();
  const ipMap = new Map<string, { count: number; lastAttempt: Date }>();

  for (const attempt of allAttempts) {
    // Count emails
    const emailData = emailMap.get(attempt.email) || { count: 0, lastAttempt: attempt.createdAt };
    emailData.count++;
    if (attempt.createdAt > emailData.lastAttempt) {
      emailData.lastAttempt = attempt.createdAt;
    }
    emailMap.set(attempt.email, emailData);

    // Count IPs
    const ipData = ipMap.get(attempt.ipAddress) || { count: 0, lastAttempt: attempt.createdAt };
    ipData.count++;
    if (attempt.createdAt > ipData.lastAttempt) {
      ipData.lastAttempt = attempt.createdAt;
    }
    ipMap.set(attempt.ipAddress, ipData);
  }

  // Filter locked emails (>= EMAIL_MAX_ATTEMPTS)
  const lockedEmails = Array.from(emailMap.entries())
    .filter(([_, data]) => data.count >= EMAIL_MAX_ATTEMPTS)
    .map(([email, data]) => ({
      email,
      attempts: data.count,
      lastAttemptAt: data.lastAttempt,
    }))
    .sort((a, b) => b.lastAttemptAt.getTime() - a.lastAttemptAt.getTime());

  // Filter locked IPs (>= IP_MAX_ATTEMPTS)
  const lockedIps = Array.from(ipMap.entries())
    .filter(([_, data]) => data.count >= IP_MAX_ATTEMPTS)
    .map(([ipAddress, data]) => ({
      ipAddress,
      attempts: data.count,
      lastAttemptAt: data.lastAttempt,
    }))
    .sort((a, b) => b.lastAttemptAt.getTime() - a.lastAttemptAt.getTime());

  console.log("📧 LOCKED EMAILS:");
  console.log("─".repeat(80));
  if (lockedEmails.length === 0) {
    console.log("  (none)");
  } else {
    lockedEmails.forEach((item) => {
      console.log(`  🔒 ${item.email}`);
      console.log(`     Attempts: ${item.attempts}`);
      console.log(`     Last: ${item.lastAttemptAt.toISOString()}`);
      console.log();
    });
  }

  console.log("\n🌐 LOCKED IPs:");
  console.log("─".repeat(80));
  if (lockedIps.length === 0) {
    console.log("  (none)");
  } else {
    lockedIps.forEach((item) => {
      console.log(`  🔒 ${item.ipAddress}`);
      console.log(`     Attempts: ${item.attempts}`);
      console.log(`     Last: ${item.lastAttemptAt.toISOString()}`);
      console.log();
    });
  }

  console.log("\n📊 SUMMARY:");
  console.log("─".repeat(80));
  console.log(`Total Locked: ${lockedEmails.length + lockedIps.length}`);
  console.log(`  - Emails: ${lockedEmails.length}`);
  console.log(`  - IPs: ${lockedIps.length}`);

  return { lockedEmails, lockedIps };
}

async function main() {
  await testManualGrouping();
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
