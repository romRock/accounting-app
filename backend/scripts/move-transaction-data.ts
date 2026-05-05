import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function moveTransactionData() {
  console.log('🔄 Moving transaction data from lowercase to uppercase table...');
  
  try {
    // Move data from lowercase to uppercase table
    console.log('📋 Moving data...');
    await prisma.$queryRaw`
      INSERT INTO "Transaction" (
        id, transactionId, tokenNo, date, time, centerId, amount, amountType,
        commission, bookingCommission, centerCommission, autoCommission,
        receiverName, receiverNumber, senderName, senderNumber,
        receiverClientId, senderClientId, remark, status, statusTime,
        type, isActive, isDeleted, branchId, createdBy, createdAt, updatedAt
      )
      SELECT 
        id, transactionId, tokenNo, date, time, centerId, amount, amountType,
        commission, bookingCommission, centerCommission, autoCommission,
        receiverName, receiverNumber, senderName, senderNumber,
        receiverClientId, senderClientId, remark, status, statusTime,
        type, isActive, isDeleted, branchId, createdBy, createdAt, updatedAt
      FROM transactions
    `;
    
    console.log('✅ Data moved successfully');
    
    // Verify data was moved
    const uppercaseCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Transaction"`;
    const lowercaseCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM transactions`;
    
    console.log('📊 Records in uppercase Transaction table after move:', uppercaseCount[0].count);
    console.log('📊 Records in lowercase transactions table after move:', lowercaseCount[0].count);
    
    // Drop the lowercase table
    console.log('🗑️ Removing lowercase transactions table...');
    await prisma.$queryRaw`DROP TABLE transactions`;
    console.log('✅ Lowercase table removed');
    
    // Final verification
    const finalTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name = 'Transaction' OR table_name = 'transactions')
      ORDER BY table_name
    `;
    
    console.log('📊 Final transaction tables:', finalTables.length);
    finalTables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
    
    console.log('🎉 Transaction data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error moving transaction data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
moveTransactionData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
