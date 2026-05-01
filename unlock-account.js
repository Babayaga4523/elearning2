const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('❌ Error: Email is required');
    console.log('\nUsage: node unlock-account.js <email>');
    console.log('Example: node unlock-account.js admin@bnif.co.id');
    process.exit(1);
  }
  
  console.log(`🔓 Unlocking account: ${email}\n`);
  
  // Delete all login attempts for this email
  const result = await prisma.loginAttempt.deleteMany({
    where: { email }
  });
  
  if (result.count === 0) {
    console.log('✅ Account was not locked (no failed attempts found)');
  } else {
    console.log(`✅ Successfully unlocked account!`);
    console.log(`   Removed ${result.count} failed login attempt(s)`);
  }
  
  console.log('\n📝 Note: User must also clear browser localStorage or wait for countdown to finish.');
  console.log('   To clear localStorage: Open browser console and run:');
  console.log('   localStorage.removeItem("loginLockoutUntil")');
  console.log('   localStorage.removeItem("loginLockoutEmail")');
  console.log('   location.reload()');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
