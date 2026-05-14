import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function checkProductionAccountingSchema() {
  try {
    console.log('🔍 Checking production accounting database schema...\n');

    // Check AccountCategory table
    console.log('--- AccountCategory Table ---');
    try {
      const categoryCount = await prisma.accountCategory.count();
      console.log(`✅ AccountCategory table exists`);
      console.log(`   Records: ${categoryCount}`);
      
      const categories = await prisma.accountCategory.findMany();
      if (categories.length > 0) {
        console.log(`   Sample record:`, JSON.stringify(categories[0], null, 2));
      }
    } catch (error: any) {
      console.log(`❌ AccountCategory table error: ${error.message}`);
    }

    // Check AccountEntry table
    console.log('\n--- AccountEntry Table ---');
    try {
      const entryCount = await prisma.accountEntry.count();
      console.log(`✅ AccountEntry table exists`);
      console.log(`   Records: ${entryCount}`);
      
      const entries = await prisma.accountEntry.findMany({ take: 1 });
      if (entries.length > 0) {
        console.log(`   Sample record:`, JSON.stringify(entries[0], null, 2));
      }
    } catch (error: any) {
      console.log(`❌ AccountEntry table error: ${error.message}`);
    }

    // Check ClientLedger table
    console.log('\n--- ClientLedger Table ---');
    try {
      const ledgerCount = await prisma.clientLedger.count();
      console.log(`✅ ClientLedger table exists`);
      console.log(`   Records: ${ledgerCount}`);
      
      const ledgers = await prisma.clientLedger.findMany({ take: 1 });
      if (ledgers.length > 0) {
        console.log(`   Sample record:`, JSON.stringify(ledgers[0], null, 2));
      }
    } catch (error: any) {
      console.log(`❌ ClientLedger table error: ${error.message}`);
    }

    // Check LedgerEntry table
    console.log('\n--- LedgerEntry Table ---');
    try {
      const ledgerEntryCount = await prisma.ledgerEntry.count();
      console.log(`✅ LedgerEntry table exists`);
      console.log(`   Records: ${ledgerEntryCount}`);
      
      const ledgerEntries = await prisma.ledgerEntry.findMany({ take: 1 });
      if (ledgerEntries.length > 0) {
        console.log(`   Sample record:`, JSON.stringify(ledgerEntries[0], null, 2));
      }
    } catch (error: any) {
      console.log(`❌ LedgerEntry table error: ${error.message}`);
    }

    console.log('\n✅ Production accounting schema check completed');
  } catch (error) {
    console.error('❌ Error checking production schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionAccountingSchema()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
