import { PrismaClient } from "../src/generated/client/index.js";

const prisma = new PrismaClient();

const EMAIL_MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function windowStart(): Date {
  return new Date(Date.now() - WINDOW_MS);
}

async function checkRateLimit(email: string) {
  const since = windowStart();
  const emailCount = await prisma.loginAttempt.count({
    where: { email, createdAt: { gte: since } },
  });

  if (emailCount >= EMAIL_MAX_ATTEMPTS) {
    return {
      blocked: true,
      attempts: emailCount,
      remaining: 0,
    };
  }

  return {
    blocked: false,
    attempts: emailCount,
    remaining: EMAIL_MAX_ATTEMPTS - emailCount,
  };
}

async function recordFailedAttempt(email: string) {
  await prisma.loginAttempt.create({
    data: {
      email,
      ipAddress: "::1",
    },
  });
}

async function simulateLoginFlow() {
  const email = "test.user@bnif.co.id";

  console.log("🧪 Testing Login Flow with Rate Limiting\n");
  console.log(`📧 Email: ${email}`);
  console.log(`🔒 Max Attempts: ${EMAIL_MAX_ATTEMPTS}\n`);

  // Clear old attempts
  await prisma.loginAttempt.deleteMany({ where: { email } });
  console.log("🗑️  Cleared old attempts\n");

  // Simulate 6 failed login attempts
  for (let i = 1; i <= 6; i++) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`Attempt #${i}`);
    console.log("=".repeat(80));

    // 1. Check rate limit BEFORE login
    const checkBefore = await checkRateLimit(email);
    console.log(`\n1️⃣ Check BEFORE login:`);
    console.log(`   Blocked: ${checkBefore.blocked}`);
    console.log(`   Current attempts: ${checkBefore.attempts}`);
    console.log(`   Remaining: ${checkBefore.remaining}`);

    if (checkBefore.blocked) {
      console.log(`\n❌ LOGIN BLOCKED - Too many attempts!`);
      break;
    }

    // 2. Simulate login failure
    console.log(`\n2️⃣ Login attempt... ❌ FAILED (wrong password)`);

    // 3. Record failed attempt
    await recordFailedAttempt(email);
    console.log(`\n3️⃣ Recorded failed attempt`);

    // 4. Check rate limit AFTER recording
    const checkAfter = await checkRateLimit(email);
    console.log(`\n4️⃣ Check AFTER recording:`);
    console.log(`   Blocked: ${checkAfter.blocked}`);
    console.log(`   Current attempts: ${checkAfter.attempts}`);
    console.log(`   Remaining: ${checkAfter.remaining}`);

    if (checkAfter.blocked) {
      console.log(`\n🔒 ACCOUNT NOW LOCKED!`);
    } else {
      console.log(`\n⚠️  Message to user: "${checkAfter.remaining} percobaan tersisa sebelum akun dikunci."`);
    }
  }

  // Final check
  console.log(`\n\n${"=".repeat(80)}`);
  console.log("FINAL STATUS");
  console.log("=".repeat(80));

  const finalCheck = await checkRateLimit(email);
  console.log(`Blocked: ${finalCheck.blocked}`);
  console.log(`Total attempts: ${finalCheck.attempts}`);
  console.log(`Remaining: ${finalCheck.remaining}`);

  // Cleanup
  await prisma.loginAttempt.deleteMany({ where: { email } });
  console.log(`\n🗑️  Cleaned up test data`);
}

async function main() {
  await simulateLoginFlow();
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
