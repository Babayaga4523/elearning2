const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECKING LOGIN ATTEMPTS ===\n');
  
  // Get all login attempts in last 15 minutes
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  
  const recentAttempts = await prisma.loginAttempt.findMany({
    where: {
      createdAt: {
        gte: fifteenMinutesAgo
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log(`Found ${recentAttempts.length} login attempts in last 15 minutes:\n`);
  
  if (recentAttempts.length === 0) {
    console.log('✅ No recent failed attempts - account should NOT be locked\n');
  } else {
    // Group by email
    const byEmail = {};
    const byIp = {};
    
    recentAttempts.forEach(attempt => {
      byEmail[attempt.email] = (byEmail[attempt.email] || 0) + 1;
      byIp[attempt.ipAddress] = (byIp[attempt.ipAddress] || 0) + 1;
    });
    
    console.log('By Email:');
    Object.entries(byEmail).forEach(([email, count]) => {
      const status = count >= 5 ? '🔒 LOCKED' : '✅ OK';
      console.log(`  ${email}: ${count} attempts ${status}`);
    });
    
    console.log('\nBy IP:');
    Object.entries(byIp).forEach(([ip, count]) => {
      const status = count >= 20 ? '🔒 LOCKED' : '✅ OK';
      console.log(`  ${ip}: ${count} attempts ${status}`);
    });
    
    console.log('\nDetailed attempts:');
    recentAttempts.forEach(attempt => {
      const age = Math.round((Date.now() - attempt.createdAt.getTime()) / 60000);
      console.log(`  - ${attempt.email} from ${attempt.ipAddress} (${age} minutes ago)`);
    });
  }
  
  console.log('\n=== SOLUTION ===');
  console.log('To unlock an account, run: node unlock-account.js <email>');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
