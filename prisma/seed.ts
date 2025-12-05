// ESM/CommonJS compatibility fix for production
import prismaPackage from '@prisma/client';
const { PrismaClient, UserRole } = prismaPackage;
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Synapse database with primary demo account...');

  const hashedPassword = await bcrypt.hash('Pendoah1225', 10);

  // Remove legacy demo users that are no longer needed
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['user@pendoah.ai', 'team@pendoah.ai', 'admin@pendoah.ai'],
      },
    },
  });

  // Primary Demo Account (Admin)
  const masterUser = await prisma.user.upsert({
    where: { email: 'demomaster@pendoah.ai' },
    update: {
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
    create: {
      email: 'demomaster@pendoah.ai',
      password: hashedPassword,
      name: 'Demo Master',
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Ensured primary demo account exists:', masterUser.email);

  console.log('🎉 Synapse demo account ready!');
  console.log('\n📋 Demo Credentials:');
  console.log('Primary Account: demomaster@pendoah.ai / Pendoah1225');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

