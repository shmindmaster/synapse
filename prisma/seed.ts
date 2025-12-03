import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Synapse database with demo accounts...');

  const hashedPassword = await bcrypt.hash('Pendoah1225', 10);

  // Master Account (Admin)
  const masterUser = await prisma.user.upsert({
    where: { email: 'demomaster@pendoah.com' },
    update: {
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
    create: {
      email: 'demomaster@pendoah.com',
      password: hashedPassword,
      name: 'Demo Master',
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Created Master Account:', masterUser.email);

  // Knowledge User (Viewer)
  const knowledgeUser = await prisma.user.upsert({
    where: { email: 'user@synapse.demo' },
    update: {
      password: hashedPassword,
      role: UserRole.VIEWER,
    },
    create: {
      email: 'user@synapse.demo',
      password: hashedPassword,
      name: 'Knowledge User',
      role: UserRole.VIEWER,
    },
  });
  console.log('✅ Created Knowledge User:', knowledgeUser.email);

  // Team Collaborator (Integrator)
  const teamUser = await prisma.user.upsert({
    where: { email: 'team@synapse.demo' },
    update: {
      password: hashedPassword,
      role: UserRole.INTEGRATOR,
    },
    create: {
      email: 'team@synapse.demo',
      password: hashedPassword,
      name: 'Team Collaborator',
      role: UserRole.INTEGRATOR,
    },
  });
  console.log('✅ Created Team Collaborator:', teamUser.email);

  // Admin User (Admin)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@synapse.demo' },
    update: {
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
    create: {
      email: 'admin@synapse.demo',
      password: hashedPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Created Admin User:', adminUser.email);

  console.log('🎉 Synapse demo accounts created successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('Master Account: demomaster@pendoah.com / Pendoah1225');
  console.log('Knowledge User: user@synapse.demo / Pendoah1225');
  console.log('Team Collaborator: team@synapse.demo / Pendoah1225');
  console.log('Admin User: admin@synapse.demo / Pendoah1225');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

