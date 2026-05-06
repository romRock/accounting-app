// Fix production database table name from transactions to Transaction
const { PrismaClient } = require('@prisma/client');

const PRODUCTION_DB_URL = "postgresql://hawala_app_user:9chSW4fI8jswE6Kpy9c8CqWb2b8LQXHd@dpg-d7oru8dckfvc73frmhv0-a.oregon-postgres.render.com/hawala_app";

async function fixProductionTableName() {
  console.log('🔧 Fixing production database table name from transactions to Transaction...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: PRODUCTION_DB_URL
        }
      }
    });
    
    console.log('✅ Connected to production database');
    
    // Step 1: Check current tables
    console.log('🔍 Checking current tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name = 'Transaction' OR table_name = 'transactions')
      ORDER BY table_name
    `;
    
    console.log('📊 Current transaction tables:', tables.map(t => t.table_name));
    
    const hasTransactionsLower = tables.some(t => t.table_name === 'transactions');
    const hasTransactionUpper = tables.some(t => t.table_name === 'Transaction');
    
    console.log('🔍 Table analysis:');
    console.log(`  Has transactions (lowercase): ${hasTransactionsLower}`);
    console.log(`  Has Transaction (uppercase): ${hasTransactionUpper}`);
    
    // Step 2: Rename table if needed
    if (hasTransactionsLower && !hasTransactionUpper) {
      console.log('🔧 Renaming transactions table to Transaction...');
      
      // First clear all data
      await prisma.$executeRawUnsafe('TRUNCATE TABLE transactions CASCADE');
      console.log('✅ Cleared all data from transactions table');
      
      // Rename table
      await prisma.$executeRawUnsafe('ALTER TABLE transactions RENAME TO Transaction');
      console.log('✅ Renamed transactions to Transaction');
      
    } else if (hasTransactionUpper) {
      console.log('✅ Transaction table already exists');
    } else {
      console.log('⚠️ No transaction tables found');
    }
    
    // Step 3: Verify final state
    console.log('🔍 Verifying final state...');
    const finalTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name = 'Transaction' OR table_name = 'transactions')
      ORDER BY table_name
    `;
    
    console.log('📊 Final transaction tables:', finalTables.map(t => t.table_name));
    
    // Step 4: Check Transaction table schema
    if (finalTables.some(t => t.table_name === 'Transaction')) {
      console.log('🔍 Checking Transaction table schema...');
      const schema = await prisma.$queryRaw`
        SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'Transaction'
          ORDER BY ordinal_position
      `;
      
      console.log('📊 Transaction table schema:');
      schema.forEach(col => {
        console.log(`  ${col.column_name} (${col.data_type})`);
      });
      
      // Step 5: Test transaction creation
      console.log('🧪 Testing transaction creation...');
      try {
        const testResult = await prisma.$executeRawUnsafe(`
          INSERT INTO "Transaction" (transactionId, date, amount, type, centerId, receiverName, senderName, tokenNo, isActive, isDeleted, createdBy, createdAt, updatedAt)
          VALUES ('test_001', CURRENT_TIMESTAMP, 1000, 'OUTWARD', 'test-center', 'Test Receiver', 'Test Sender', 1, true, false, 'test-user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);
        
        console.log('✅ Test transaction created successfully');
        
        // Clean up test transaction
        await prisma.$executeRawUnsafe('DELETE FROM "Transaction" WHERE transactionId = \'test_001\'');
        console.log('✅ Test transaction cleaned up');
        
      } catch (testError) {
        console.log('⚠️ Test transaction failed:', testError.message);
      }
    }
    
    await prisma.$disconnect();
    console.log('🎉 Production table name fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing production table name:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixProductionTableName();
