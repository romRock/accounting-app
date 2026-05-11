import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

export async function setupHawalaProduction() {
  console.log('🔄 Setting up Hawala table and data for production...');

  try {
    // Step 1: Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Step 2: Run database migration to create tables
    console.log('🗄️ Running database migration...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });

    // Step 3: Check if hawala entries already exist
    console.log('🔍 Checking existing hawala entries...');
    const existingCount = await prisma.hawala.count();
    if (existingCount > 0) {
      console.log('✅ Hawala entries already exist in production, skipping seeding');
      return;
    }

    // Step 4: Get a user for createdBy field
    console.log('👤 Finding active user for seeding...');
    const user = await prisma.user.findFirst({
      where: { isActive: true }
    });

    if (!user) {
      console.log('❌ No active user found for hawala seeding in production');
      return;
    }

    // Step 5: Create sample hawala entries for production
    console.log('📝 Creating sample hawala entries...');
    const hawalaEntries = [
      {
        transactionId: 'HWL001',
        tokenNo: 1,
        date: new Date(),
        time: new Date(),
        partyA: 'ABC Trading Company',
        partyB: 'XYZ Corporation',
        amount: 50000,
        remark: 'Monthly settlement for import goods',
        statusTime: new Date(),
        createdBy: user.id
      },
      {
        transactionId: 'HWL002',
        tokenNo: 2,
        date: new Date(),
        time: new Date(),
        partyA: 'Global Exports Ltd',
        partyB: 'Local Business Solutions',
        amount: 25000,
        remark: 'Payment for exported materials',
        statusTime: new Date(),
        createdBy: user.id
      },
      {
        transactionId: 'HWL003',
        tokenNo: 3,
        date: new Date(),
        time: new Date(),
        partyA: 'International Trading Co',
        partyB: 'Domestic Supplies Inc',
        amount: 75000,
        remark: 'Cross-border transaction settlement',
        statusTime: new Date(),
        createdBy: user.id
      },
      {
        transactionId: 'HWL004',
        tokenNo: 4,
        date: new Date(),
        time: new Date(),
        partyA: 'Regional Exporters',
        partyB: 'City Import Services',
        amount: 35000,
        remark: 'Regional trade payment',
        statusTime: new Date(),
        createdBy: user.id
      },
      {
        transactionId: 'HWL005',
        tokenNo: 5,
        date: new Date(),
        time: new Date(),
        partyA: 'National Trading House',
        partyB: 'Local Distributors Ltd',
        amount: 60000,
        remark: 'National distribution payment',
        statusTime: new Date(),
        createdBy: user.id
      }
    ];

    // Step 6: Insert hawala entries
    for (const entry of hawalaEntries) {
      await prisma.hawala.create({
        data: entry
      });
    }

    console.log(`✅ Successfully created ${hawalaEntries.length} hawala entries in production`);
  } catch (error) {
    console.error('❌ Error setting up hawala in production:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  setupHawalaProduction()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
