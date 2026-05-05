import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTransactionCreation() {
  console.log('🧪 Testing transaction creation with uppercase Transaction table...');
  
  try {
    // Test data for transaction creation
    const testTransaction = {
      transactionId: `TEST_BOOK_${Date.now()}`,
      tokenNo: 999,
      date: new Date(),
      time: new Date(),
      centerId: 'test-center-id',
      amount: 1000,
      amountType: 'CASH',
      commission: 10,
      bookingCommission: 4,
      centerCommission: 6,
      autoCommission: true,
      receiverName: 'Test Receiver',
      receiverNumber: null,
      senderName: 'Test Sender',
      senderNumber: null,
      receiverClientId: null,
      senderClientId: null,
      remark: 'Test transaction',
      status: true,
      statusTime: new Date(),
      type: 'OUTWARD',
      isActive: true,
      isDeleted: false,
      branchId: 'test-branch-id',
      createdBy: 'test-user-id',
    };
    
    console.log('📋 Creating test transaction...');
    console.log(`  Transaction ID: ${testTransaction.transactionId}`);
    console.log(`  Token No: ${testTransaction.tokenNo}`);
    console.log(`  Type: ${testTransaction.type}`);
    console.log(`  Amount: ${testTransaction.amount}`);
    
    // Create transaction using Prisma (without includes to avoid foreign key issues)
    const createdTransaction = await prisma.transaction.create({
      data: testTransaction,
    });
    
    console.log('✅ Transaction created successfully!');
    console.log('📊 Created transaction details:');
    console.log(`  ID: ${createdTransaction.id}`);
    console.log(`  Transaction ID: ${createdTransaction.transactionId}`);
    console.log(`  Token No: ${createdTransaction.tokenNo}`);
    console.log(`  Date: ${createdTransaction.date}`);
    console.log(`  Amount: ${createdTransaction.amount}`);
    console.log(`  Type: ${createdTransaction.type}`);
    console.log(`  Status: ${createdTransaction.status}`);
    
    // Test querying the created transaction
    console.log('🔍 Testing transaction query...');
    const queriedTransaction = await prisma.transaction.findUnique({
      where: { id: createdTransaction.id },
      select: {
        id: true,
        transactionId: true,
        tokenNo: true,
        date: true,
        amount: true,
        type: true,
        status: true,
      },
    });
    
    if (queriedTransaction) {
      console.log('✅ Transaction queried successfully!');
      console.log('📊 Queried transaction details:');
      console.log(`  Transaction ID: ${queriedTransaction.transactionId}`);
      console.log(`  Token No: ${queriedTransaction.tokenNo}`);
      console.log(`  Amount: ${queriedTransaction.amount}`);
      console.log(`  Type: ${queriedTransaction.type}`);
    } else {
      console.log('❌ Failed to query created transaction');
    }
    
    // Clean up test transaction
    console.log('🗑️ Cleaning up test transaction...');
    await prisma.transaction.delete({
      where: { id: createdTransaction.id },
    });
    console.log('✅ Test transaction cleaned up');
    
    console.log('🎉 Transaction creation test completed successfully!');
    console.log('💡 Transaction creation is working properly with uppercase Transaction table');
    
  } catch (error) {
    console.error('❌ Transaction creation test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testTransactionCreation()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
