import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateExistingDataToPM2Branch() {
  try {
    console.log('🔄 Starting migration of existing data to PM2 branch...');

    // Find PM2 branch
    const pm2Branch = await prisma.branch.findFirst({
      where: { code: 'PM2' }
    });

    if (!pm2Branch) {
      console.error('❌ PM2 branch not found. Please create it first.');
      return;
    }

    console.log(`✅ Found PM2 branch: ${pm2Branch.name} (ID: ${pm2Branch.id})`);

    // Update all cities with NULL branchId to PM2 branch
    const citiesUpdate = await prisma.city.updateMany({
      where: { branchId: null },
      data: { branchId: pm2Branch.id }
    });
    console.log(`✅ Updated ${citiesUpdate.count} cities to PM2 branch`);

    // Update all parties/clients with NULL branchId to PM2 branch
    const partiesUpdate = await prisma.party.updateMany({
      where: { branchId: null },
      data: { branchId: pm2Branch.id }
    });
    console.log(`✅ Updated ${partiesUpdate.count} parties/clients to PM2 branch`);

    // Update all transactions with NULL branchId to PM2 branch
    const transactionsUpdate = await prisma.transaction.updateMany({
      where: { branchId: null },
      data: { branchId: pm2Branch.id }
    });
    console.log(`✅ Updated ${transactionsUpdate.count} transactions to PM2 branch`);

    // Update all account entries with NULL branchId to PM2 branch
    const accountEntriesUpdate = await prisma.accountEntry.updateMany({
      where: { branchId: null },
      data: { branchId: pm2Branch.id }
    });
    console.log(`✅ Updated ${accountEntriesUpdate.count} account entries to PM2 branch`);

    // Update all hawala entries with NULL branchId to PM2 branch
    const hawalaUpdate = await prisma.hawala.updateMany({
      where: { branchId: null },
      data: { branchId: pm2Branch.id }
    });
    console.log(`✅ Updated ${hawalaUpdate.count} hawala entries to PM2 branch`);

    // Update all special entries with NULL branchId to PM2 branch
    const specialEntriesUpdate = await prisma.specialEntry.updateMany({
      where: { branchId: null },
      data: { branchId: pm2Branch.id }
    });
    console.log(`✅ Updated ${specialEntriesUpdate.count} special entries to PM2 branch`);

    console.log('🎉 Migration completed successfully!');
    console.log(`\nSummary:`);
    console.log(`- Cities: ${citiesUpdate.count}`);
    console.log(`- Parties/Clients: ${partiesUpdate.count}`);
    console.log(`- Transactions: ${transactionsUpdate.count}`);
    console.log(`- Account Entries: ${accountEntriesUpdate.count}`);
    console.log(`- Hawala Entries: ${hawalaUpdate.count}`);
    console.log(`- Special Entries: ${specialEntriesUpdate.count}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateExistingDataToPM2Branch();
