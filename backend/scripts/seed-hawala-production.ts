import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedHawalaProduction() {
  console.log('🔄 Seeding hawala entries for production...');

  try {
    // Check if hawala entries already exist
    const existingCount = await prisma.hawala.count();
    if (existingCount > 0) {
      console.log('✅ Hawala entries already exist in production, skipping seeding');
      return;
    }

    // Get a user for createdBy field
    const user = await prisma.user.findFirst({
      where: { isActive: true }
    });

    if (!user) {
      console.log('❌ No active user found for hawala seeding in production');
      return;
    }

    // Create sample hawala entries for production
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

    // Insert hawala entries
    for (const entry of hawalaEntries) {
      await prisma.hawala.create({
        data: entry
      });
    }

    console.log(`✅ Successfully created ${hawalaEntries.length} hawala entries in production`);
  } catch (error) {
    console.error('❌ Error seeding hawala entries in production:', error);
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedHawalaProduction()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
