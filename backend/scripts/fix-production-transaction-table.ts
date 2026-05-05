import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixProductionTransactionTable() {
  console.log('🔧 Fixing production transaction table consistency...');
  
  try {
    // Check both tables exist
    const uppercaseTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Transaction'
      )
    `;
    
    const lowercaseTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
      )
    `;
    
    console.log('📊 Uppercase Transaction table exists:', uppercaseTable[0].exists);
    console.log('📊 Lowercase transactions table exists:', lowercaseTable[0].exists);
    
    if (uppercaseTable[0].exists && lowercaseTable[0].exists) {
      // Check data in both tables
      const uppercaseData = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Transaction"`;
      const lowercaseData = await prisma.$queryRaw`SELECT COUNT(*) as count FROM transactions`;
      
      console.log('📊 Records in uppercase Transaction table:', uppercaseData[0].count);
      console.log('📊 Records in lowercase transactions table:', lowercaseData[0].count);
      
      // If lowercase table has data and uppercase is empty, move data
      if (lowercaseData[0].count > 0 && uppercaseData[0].count === 0) {
        console.log('🔄 Moving data from lowercase to uppercase table...');
        
        // Move data from lowercase to uppercase table
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
        
        // Drop the lowercase table
        console.log('🗑️ Removing lowercase transactions table...');
        await prisma.$queryRaw`DROP TABLE transactions`;
        console.log('✅ Lowercase table removed');
      }
    }
    
    // Verify the final state
    const finalCheck = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Transaction'
      ORDER BY ordinal_position
    `;
    
    console.log('📊 Final Transaction table schema:');
    finalCheck.forEach((col: any, index: number) => {
      console.log(`  ${index + 1}. ${col.column_name} (${col.data_type})`);
    });
    
    // Check tokenNo column specifically
    const tokenNoColumn = finalCheck.find((col: any) => col.column_name === 'tokenNo');
    console.log('🔍 tokenNo column exists:', tokenNoColumn ? 'YES' : 'NO');
    
    console.log('🎉 Production transaction table fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing production transaction table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixProductionTransactionTable()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
