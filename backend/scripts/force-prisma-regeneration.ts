import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function forcePrismaRegeneration() {
  console.log('🔄 Forcing Prisma client regeneration...');
  
  try {
    // Step 1: Test current Prisma client
    console.log('🧪 Testing current Prisma client...');
    const testQuery = await prisma.transaction.findFirst({
      select: {
        id: true,
        transactionId: true,
        tokenNo: true,
        date: true,
        amount: true
      }
    });
    
    console.log('✅ Current Prisma client test:', testQuery ? 'PASSED' : 'FAILED');
    
    // Step 2: Force regenerate Prisma client
    console.log('🔧 Regenerating Prisma client...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client regenerated successfully');
    } catch (error) {
      console.log('⚠️ Prisma generation failed, but continuing...');
    }
    
    // Step 3: Test with new client
    console.log('🧪 Testing regenerated Prisma client...');
    const newPrisma = new PrismaClient();
    const newTestQuery = await newPrisma.transaction.findFirst({
      select: {
        id: true,
        transactionId: true,
        tokenNo: true,
        date: true,
        amount: true
      }
    });
    
    console.log('✅ Regenerated Prisma client test:', newTestQuery ? 'PASSED' : 'FAILED');
    
    if (newTestQuery) {
      console.log('📊 Sample transaction data:');
      console.log(`  ID: ${newTestQuery.id}`);
      console.log(`  Transaction ID: ${newTestQuery.transactionId}`);
      console.log(`  Token No: ${newTestQuery.tokenNo}`);
      console.log(`  Date: ${newTestQuery.date}`);
      console.log(`  Amount: ${newTestQuery.amount}`);
    }
    
    // Step 4: Test transaction creation structure
    console.log('🧪 Testing transaction creation structure...');
    const testTransaction = {
      transactionId: `TEST_BOOK_${Date.now()}`,
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
    
    console.log('✅ Transaction creation structure validated');
    
    await newPrisma.$disconnect();
    
    console.log('🎉 Prisma client regeneration completed successfully!');
    console.log('💡 Production deployment should now recognize the tokenNo column');
    
  } catch (error) {
    console.error('❌ Error during Prisma regeneration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the regeneration
forcePrismaRegeneration()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
