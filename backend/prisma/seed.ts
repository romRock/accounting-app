import { PrismaClient } from '@prisma/client';
import { seedRoles, seedUsers, seedCities, seedBranches } from './seeds';
import { seedRBACRoles } from './seeds/rbac-roles.seed';
import { seedTransactions } from './seeds/transactions.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Execute in correct order to respect dependencies
    await seedRoles(prisma);
    await seedRBACRoles(prisma); // Seed RBAC roles
    await seedCities(prisma);
    await seedBranches(prisma);
    await seedUsers(prisma);
    await seedTransactions(prisma);

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Default Login Credentials:');
    console.log('🔑 Admin: admin@mail.com / admin@1234');
    console.log('🔑 Operator: operator@accounting.com / operator123');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
