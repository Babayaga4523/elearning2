const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fixing admin roles...');
  
  const admin = await prisma.user.update({
    where: { email: 'admin@bnif.co.id' },
    data: {
      role: 'ADMIN',
      roles: ['ADMIN', 'KARYAWAN'], // Admin bisa akses kedua role
      activeRole: 'ADMIN' // Set default ke ADMIN
    }
  });
  
  console.log('✅ Admin roles fixed!');
  console.log(JSON.stringify(admin, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
