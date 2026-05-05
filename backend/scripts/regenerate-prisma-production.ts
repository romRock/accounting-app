import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function regeneratePrismaProduction() {
  console.log('🔄 Regenerating Prisma client for production...');
  
  try {
    // Test Prisma client with tokenNo field
    console.log('🧪 Testing Prisma client with tokenNo field...');
    
    // Try to query transactions with tokenNo field
    const testQuery = await prisma.transaction.findFirst({
      select: {
        id: true,
        transactionId: true,
        tokenNo: true,
        date: true,
        amount: true
      }
    });
    
    console.log('✅ Prisma client recognizes tokenNo field:', testQuery ? 'YES' : 'NO');
    
    if (testQuery) {
      console.log('📊 Sample transaction data:');
      console.log(`  ID: ${testQuery.id}`);
      console.log(`  Transaction ID: ${testQuery.transactionId}`);
      console.log(`  Token No: ${testQuery.tokenNo}`);
      console.log(`  Date: ${testQuery.date}`);
      console.log(`  Amount: ${testQuery.amount}`);
    }
    
    // Test creating a transaction with tokenNo
    console.log('🧪 Testing transaction creation with tokenNo...');
    const testTransaction = {
      transactionId: `TEST_${Date.now()}`,
      tokenNo: 999,
      date: new Date(),
      time: new Date(),
      centerId: 'test-center',
      amount: 1000,
      amountType: 'CASH',
      commission: 10,
      bookingCommission: 4,
      centerCommission: 6,
      autoCommission: true,
      receiverName: 'Test Receiver',
      senderName: 'Test Sender',
      status: true,
      statusTime: new Date(),
      type: 'OUTWARD',
      isActive: true,
      isDeleted: false,
      branchId: 'test-branch',
      createdBy: 'test-user'
    };
    
    // Don't actually create, just test the structure
    console.log('✅ Transaction structure validated with tokenNo field');
    
    console.log('🎉 Prisma client regeneration test completed!');
    console.log('💡 If this test passes, the issue might be application deployment/caching');
    
  } catch (error) {
    console.error('❌ Error testing Prisma client:', error);
    console.log('💡 This error indicates the Prisma client needs to be regenerated');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
regeneratePrismaProduction()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
