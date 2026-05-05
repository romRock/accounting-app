// Fix production database column names to match local
const { PrismaClient } = require('@prisma/client');

const PRODUCTION_DB_URL = "postgresql://hawala_app_user:9chSW4fI8jswE6Kpy9c8CqWb2b8LQXHd@dpg-d7oru8dckfvc73frmhv0-a.oregon-postgres.render.com/hawala_app";

async function fixProductionColumns() {
  console.log('🔧 Fixing production database column names to match local...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: PRODUCTION_DB_URL
        }
      }
    });
    
    console.log('✅ Connected to production database');
    
    // Step 1: Check current column names
    console.log('🔍 Checking current column names...');
    const schema = await prisma.$queryRaw`
      SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
        ORDER BY ordinal_position
      `;
    
    console.log('📊 Current production columns:');
    schema.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    // Step 2: Check if transactionId column exists (exact case)
    const hasTransactionId = schema.some(col => col.column_name === 'transactionId');
    const hasTransactionIdLower = schema.some(col => col.column_name === 'transactionid');
    
    console.log('🔍 Column analysis:');
    console.log(`  Has transactionId (exact): ${hasTransactionId}`);
    console.log(`  Has transactionid (lowercase): ${hasTransactionIdLower}`);
    
    // Step 3: Clear all data from transactions table
    console.log('🗑️ Clearing all data from production transactions table...');
    const clearResult = await prisma.$executeRaw`TRUNCATE TABLE transactions CASCADE`;
    console.log('✅ Cleared all transaction data');
    
    // Step 4: Fix column names if needed
    if (!hasTransactionId && hasTransactionIdLower) {
      console.log('🔧 Renaming transactionid to transactionId...');
      await prisma.$executeRaw`ALTER TABLE transactions RENAME COLUMN transactionid TO transactionId`;
      console.log('✅ Renamed transactionid to transactionId');
    }
    
    // Step 5: Check for tokenNo vs tokenno
    const hasTokenNo = schema.some(col => col.column_name === 'tokenNo');
    const hasTokenNoLower = schema.some(col => col.column_name === 'tokenno');
    
    console.log('🔍 Token column analysis:');
    console.log(`  Has tokenNo (exact): ${hasTokenNo}`);
    console.log(`  Has tokenno (lowercase): ${hasTokenNoLower}`);
    
    if (!hasTokenNo && hasTokenNoLower) {
      console.log('🔧 Renaming tokenno to tokenNo...');
      await prisma.$executeRaw`ALTER TABLE transactions RENAME COLUMN tokenno TO tokenNo`;
      console.log('✅ Renamed tokenno to tokenNo');
    }
    
    // Step 6: Verify final schema
    console.log('🔍 Verifying final schema...');
    const finalSchema = await prisma.$queryRaw`
      SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
        ORDER BY ordinal_position
      `;
    
    console.log('📊 Final production columns:');
    finalSchema.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    // Step 7: Test transaction creation
    console.log('🧪 Testing transaction creation...');
    try {
      const testResult = await prisma.$executeRaw`
        INSERT INTO transactions (transactionId, date, amount, type, centerId, receiverName, senderName, tokenNo, isActive, isDeleted, createdBy, createdAt, updatedAt)
        VALUES ('test_001', CURRENT_TIMESTAMP, 1000, 'OUTWARD', 'test-center', 'Test Receiver', 'Test Sender', 1, true, false, 'test-user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      
      console.log('✅ Test transaction created successfully');
      
      // Clean up test transaction
      await prisma.$executeRaw`DELETE FROM transactions WHERE transactionId = 'test_001'`;
      console.log('✅ Test transaction cleaned up');
      
    } catch (testError) {
      console.log('⚠️ Test transaction failed:', testError.message);
    }
    
    await prisma.$disconnect();
    console.log('🎉 Production database column fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing production columns:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixProductionColumns();
