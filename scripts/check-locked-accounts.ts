import { PrismaClient } from "../src/generated/client/index.js";

const prisma = new PrismaClient();

const EMAIL_MAX_ATTEMPTS = 5;
const IP_MAX_ATTEMPTS = 20;
const WINDOW_MINUTES = 15;
const WINDOW_MS = WINDOW_MINUTES * 60 * 1000;

function windowStart(): Date {
  return new Date(Date.now() - WINDOW_MS);
}

async function main() {
  console.log("🔍 Checking Locked Accounts...\n");

  const since = windowStart();
  console.log(`📅 Window Start: ${since.toISOString()}`);
  console.log(`📅 Current Time: ${new Date().toISOString()}\n`);

  // Get all login attempts in window
  const allAttempts = await prisma.loginAttempt.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  console.log(`📊 Total attempts in last ${WINDOW_MINUTES} minutes: ${allAttempts.length}\n`);

  // Group by email
  const emailGroups = await prisma.loginAttempt.groupBy({
    by: ['email'],
    where: { createdAt: { gte: since } },
    _count: { email: true },
    _max: { createdAt: true },
  });

  console.log("📧 EMAIL ATTEMPTS:");
  console.log("─".repeat(80));
  
  for (const group of emailGroups) {
    const isLocked = group._count.email >= EMAIL_MAX_ATTEMPTS;
    const status = isLocked ? "🔒 LOCKED" : "✅ OK";
    console.log(`${status} ${group.email}`);
    console.log(`   Attempts: ${group._count.email}/${EMAIL_MAX_ATTEMPTS}`);
    console.log(`   Last attempt: ${group._max.createdAt?.toISOString()}`);
    console.log();
  }

  // Group by IP
  const ipGroups = await prisma.loginAttempt.groupBy({
    by: ['ipAddress'],
    where: { createdAt: { gte: since } },
    _count: { ipAddress: true },
    _max: { createdAt: true },
  });

  console.log("\n🌐 IP ADDRESS ATTEMPTS:");
  console.log("─".repeat(80));
  
  for (const group of ipGroups) {
    const isLocked = group._count.ipAddress >= IP_MAX_ATTEMPTS;
    const status = isLocked ? "🔒 LOCKED" : "✅ OK";
    console.log(`${status} ${group.ipAddress}`);
    console.log(`   Attempts: ${group._count.ipAddress}/${IP_MAX_ATTEMPTS}`);
    console.log(`   Last attempt: ${group._max.createdAt?.toISOString()}`);
    console.log();
  }

  // Check specific email
  const gitaEmail = "gita.nirmala@bnif.co.id";
  const gitaAttempts = await prisma.loginAttempt.findMany({
    where: { 
      email: gitaEmail,
      createdAt: { gte: since }
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`\n🔍 Specific Check: ${gitaEmail}`);
  console.log("─".repeat(80));
  console.log(`Total attempts: ${gitaAttempts.length}`);
  console.log(`Status: ${gitaAttempts.length >= EMAIL_MAX_ATTEMPTS ? "🔒 LOCKED" : "✅ OK"}`);
  
  if (gitaAttempts.length > 0) {
    console.log("\nAttempt details:");
    gitaAttempts.forEach((attempt, i) => {
      console.log(`  ${i + 1}. ${attempt.createdAt.toISOString()} from ${attempt.ipAddress}`);
    });
  } else {
    console.log("No attempts found in the last 15 minutes.");
  }

  // Summary
  const lockedEmails = emailGroups.filter(g => g._count.email >= EMAIL_MAX_ATTEMPTS);
  const lockedIps = ipGroups.filter(g => g._count.ipAddress >= IP_MAX_ATTEMPTS);

  console.log("\n📊 SUMMARY:");
  console.log("─".repeat(80));
  console.log(`🔒 Locked Emails: ${lockedEmails.length}`);
  console.log(`🔒 Locked IPs: ${lockedIps.length}`);
  console.log(`📊 Total Locked: ${lockedEmails.length + lockedIps.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
