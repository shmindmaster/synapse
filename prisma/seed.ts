// ESM/CommonJS compatibility fix for production
import prismaPackage from '@prisma/client';
const { PrismaClient, UserRole } = prismaPackage;
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Synapse database with primary demo account...');

  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✅ Database connection established');

    const hashedPassword = await bcrypt.hash('Pendoah1225', 10);

    // Remove legacy demo users that are no longer needed
    try {
      const deleted = await prisma.user.deleteMany({
        where: {
          email: {
            in: ['user@pendoah.ai', 'team@pendoah.ai', 'admin@pendoah.ai'],
          },
        },
      });
      if (deleted.count > 0) {
        console.log(`🗑️  Removed ${deleted.count} legacy demo user(s)`);
      }
    } catch (error) {
      console.warn('⚠️  Warning: Could not remove legacy users (may not exist):', error.message);
    }

    // Primary Demo Account (Admin)
    const masterUser = await prisma.user.upsert({
      where: { email: 'demomaster@pendoah.ai' },
      update: {
        password: hashedPassword,
        role: UserRole.ADMIN,
        name: 'Demo Master',
      },
      create: {
        email: 'demomaster@pendoah.ai',
        password: hashedPassword,
        name: 'Demo Master',
        role: UserRole.ADMIN,
      },
    });
    console.log('✅ Ensured primary demo account exists:', masterUser.email);
    console.log(`   - ID: ${masterUser.id}`);
    console.log(`   - Role: ${masterUser.role}`);

    // Verify the account was created/updated correctly
    const verifyUser = await prisma.user.findUnique({
      where: { email: 'demomaster@pendoah.ai' },
    });

    if (!verifyUser) {
      throw new Error('Failed to verify demo account creation');
    }

    console.log('🎉 Synapse demo account ready!');
    console.log('\n📋 Demo Credentials:');
    console.log('   Email: demomaster@pendoah.ai');
    console.log('   Password: Pendoah1225');
    console.log('   Role: ADMIN');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    
    // Provide helpful error messages
    if (error.code === 'P1001') {
      console.error('\n💡 Tip: Check your DATABASE_URL environment variable');
      console.error('   Make sure DB_PASSWORD is set in your .env.shared file');
    } else if (error.code === 'P1012') {
      console.error('\n💡 Tip: DATABASE_URL environment variable is missing');
      console.error('   Ensure .env.shared is loaded or DATABASE_URL is set');
    }
    
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

