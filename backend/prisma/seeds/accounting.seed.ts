import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedAccounting() {
  try {
    console.log('🌱 Seeding accounting data...');

    // Create default accounting categories
    const categories = [
      {
        name: 'Cash',
        type: 'INCOME',
        description: 'Cash income entries',
        gstApplicable: false,
        tdsApplicable: false,
      },
      {
        name: 'LBL',
        type: 'INCOME',
        description: 'LBL income entries (Label/Entry/Token)',
        gstApplicable: false,
        tdsApplicable: false,
      },
      {
        name: 'LBL',
        type: 'EXPENSE',
        description: 'LBL expense entries (Label/Entry/Token)',
        gstApplicable: false,
        tdsApplicable: false,
      },
      {
        name: 'Money Transfer',
        type: 'EXPENSE',
        description: 'Money transfer expenses',
        gstApplicable: false,
        tdsApplicable: false,
      },
    ];

    for (const category of categories) {
      await prisma.accountCategory.upsert({
        where: { name: category.name, type: category.type },
        update: category,
        create: {
          ...category,
          createdBy: 'system',
        },
      });
    }

    console.log('✅ Accounting categories seeded successfully');

    // Create sample accounting entries
    const sampleEntries = [
      {
        entryId: `ACC${Date.now()}1`,
        date: new Date(),
        categoryId: (await prisma.accountCategory.findFirst({ where: { name: 'Cash', type: 'INCOME' } }))!.id,
        amount: 50000,
        description: 'Cash payment received from client',
        paymentMethod: 'CASH',
        totalAmount: 50000,
        type: 'INCOME',
        status: 'COMPLETED',
        statusTime: new Date(),
        createdBy: 'system',
      },
      {
        entryId: `ACC${Date.now()}2`,
        date: new Date(),
        categoryId: (await prisma.accountCategory.findFirst({ where: { name: 'Money Transfer', type: 'EXPENSE' } }))!.id,
        amount: 12000,
        description: 'Bank transfer charges',
        paymentMethod: 'BANK',
        totalAmount: 12000,
        type: 'EXPENSE',
        status: 'COMPLETED',
        statusTime: new Date(),
        createdBy: 'system',
      },
      {
        entryId: `ACC${Date.now()}3`,
        date: new Date(),
        categoryId: (await prisma.accountCategory.findFirst({ where: { name: 'LBL', type: 'INCOME' } }))!.id,
        amount: 35000,
        description: 'LBL transaction income - Token #12345',
        referenceNo: 'LBL12345',
        totalAmount: 35000,
        type: 'INCOME',
        status: 'COMPLETED',
        statusTime: new Date(),
        createdBy: 'system',
      },
      {
        entryId: `ACC${Date.now()}4`,
        date: new Date(),
        categoryId: (await prisma.accountCategory.findFirst({ where: { name: 'LBL', type: 'EXPENSE' } }))!.id,
        amount: 8000,
        description: 'LBL transaction expense - Token #12346',
        referenceNo: 'LBL12346',
        totalAmount: 8000,
        type: 'EXPENSE',
        status: 'COMPLETED',
        statusTime: new Date(),
        createdBy: 'system',
      },
    ];

    for (const entry of sampleEntries) {
      await prisma.accountEntry.upsert({
        where: { entryId: entry.entryId },
        update: entry,
        create: entry,
      });
    }

    console.log('✅ Sample accounting entries seeded successfully');

    console.log('🎉 Accounting seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding accounting:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedAccounting()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
