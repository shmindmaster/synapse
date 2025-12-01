import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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

  // Developer
  const developer = await prisma.user.upsert({
    where: { email: 'developer@synapse.demo' },
    update: {
      password: hashedPassword,
      role: UserRole.DEVELOPER,
    },
    create: {
      email: 'developer@synapse.demo',
      password: hashedPassword,
      name: 'Mike Developer',
      role: UserRole.DEVELOPER,
    },
  });
  console.log('✅ Created Developer:', developer.email);

  // Integrator
  const integrator = await prisma.user.upsert({
    where: { email: 'integrator@synapse.demo' },
    update: {
      password: hashedPassword,
      role: UserRole.INTEGRATOR,
    },
    create: {
      email: 'integrator@synapse.demo',
      password: hashedPassword,
      name: 'Sarah Integrator',
      role: UserRole.INTEGRATOR,
    },
  });
  console.log('✅ Created Integrator:', integrator.email);

  // Viewer
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@synapse.demo' },
    update: {
      password: hashedPassword,
      role: UserRole.VIEWER,
    },
    create: {
      email: 'viewer@synapse.demo',
      password: hashedPassword,
      name: 'John Viewer',
      role: UserRole.VIEWER,
    },
  });
  console.log('✅ Created Viewer:', viewer.email);

  console.log('🎉 Synapse demo accounts created successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('Master Account: demomaster@pendoah.com / Pendoah1225');
  console.log('Developer: developer@synapse.demo / Pendoah1225');
  console.log('Integrator: integrator@synapse.demo / Pendoah1225');
  console.log('Viewer: viewer@synapse.demo / Pendoah1225');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

