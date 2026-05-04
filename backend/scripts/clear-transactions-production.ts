import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearTransactionsProduction() {
  console.log('🗑️  Clearing transactions from production database...');

  try {
    // Get count before clearing
    const transactionCount = await prisma.transaction.count();
    console.log(`📊 Found ${transactionCount} transactions in production database`);

    if (transactionCount === 0) {
      console.log('✅ No transactions to clear. Database is already empty.');
      return;
    }

    // Clear all transactions only
    await prisma.transaction.deleteMany({});

    console.log(`✅ Successfully cleared ${transactionCount} transactions from production database`);
    console.log('🎉 Production transactions cleared successfully!');
    console.log('📝 Other data (users, roles, cities, clients, branches) remains intact');

  } catch (error) {
    console.error('❌ Error clearing production transactions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the clear function
clearTransactionsProduction()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
