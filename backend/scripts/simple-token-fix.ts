// Simple fix to rename tokenno to tokenNo in production
const { PrismaClient } = require('@prisma/client');

const PRODUCTION_DB_URL = "postgresql://hawala_app_user:9chSW4fI8jswE6Kpy9c8CqWb2b8LQXHd@dpg-d7oru8dckfvc73frmhv0-a.oregon-postgres.render.com/hawala_app";

async function simpleTokenFix() {
  console.log('🔧 Simple fix to rename tokenno to tokenNo...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: PRODUCTION_DB_URL
        }
      }
    });
    
    console.log('✅ Connected to production database');
    
    // Step 1: Check current schema
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
    
    // Step 2: Fix tokenno to tokenNo using direct SQL
    const hasTokenNo = schema.some(col => col.column_name === 'tokenNo');
    const hasTokenNoLower = schema.some(col => col.column_name === 'tokenno');
    
    console.log('🔍 Token column analysis:');
    console.log(`  Has tokenNo (camelCase): ${hasTokenNo}`);
    console.log(`  Has tokenno (lowercase): ${hasTokenNoLower}`);
    
    if (!hasTokenNo && hasTokenNoLower) {
      console.log('🔧 Renaming tokenno to tokenNo...');
      await prisma.$executeRawUnsafe('ALTER TABLE transactions RENAME COLUMN tokenno TO tokenNo');
      console.log('✅ Renamed tokenno to tokenNo');
    }
    
    // Step 3: Verify final schema
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
    
    // Step 4: Test transaction creation
    console.log('🧪 Testing transaction creation...');
    try {
      const testResult = await prisma.$executeRawUnsafe(`
        INSERT INTO transactions (transactionId, date, amount, type, centerId, receiverName, senderName, tokenNo, isActive, isDeleted, createdBy, createdAt, updatedAt)
        VALUES ('test_001', CURRENT_TIMESTAMP, 1000, 'OUTWARD', 'test-center', 'Test Receiver', 'Test Sender', 1, true, false, 'test-user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
      
      console.log('✅ Test transaction created successfully');
      
      // Clean up test transaction
      await prisma.$executeRawUnsafe('DELETE FROM transactions WHERE transactionId = \'test_001\'');
      console.log('✅ Test transaction cleaned up');
      
    } catch (testError) {
      console.log('⚠️ Test transaction failed:', testError.message);
    }
    
    await prisma.$disconnect();
    console.log('🎉 Simple token fix completed!');
    
  } catch (error) {
    console.error('❌ Error in simple token fix:', error.message);
    process.exit(1);
  }
}

// Run the fix
simpleTokenFix();
