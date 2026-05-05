// Add missing tokenNo column to production transactions table
const { PrismaClient } = require('@prisma/client');

const PRODUCTION_DB_URL = "postgresql://hawala_app_user:9chSW4fI8jswE6Kpy9c8CqWb2b8LQXHd@dpg-d7oru8dckfvc73frmhv0-a.oregon-postgres.render.com/hawala_app";

async function addTokenNoColumn() {
  console.log('🔧 Adding tokenNo column to production transactions table...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: PRODUCTION_DB_URL
        }
      }
    });
    
    console.log('✅ Connected to production database');
    
    // Step 1: Add tokenNo column
    console.log('➕ Adding tokenNo column...');
    await prisma.$executeRaw`
      ALTER TABLE transactions 
      ADD COLUMN tokenNo INTEGER
    `;
    
    console.log('✅ Added tokenNo column');
    
    // Step 2: Verify the column was added
    console.log('🔍 Verifying tokenNo column...');
    const schema = await prisma.$queryRaw`
      SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
        ORDER BY ordinal_position
      `;
    
    const hasTokenNo = schema.some(col => col.column_name === 'tokenNo');
    console.log('📊 Has tokenNo column:', hasTokenNo);
    
    if (hasTokenNo) {
      console.log('✅ tokenNo column successfully added!');
      
      // Step 3: Test transaction creation
      console.log('🧪 Testing transaction creation...');
      
      try {
        // Test with a simple transaction
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
    }
    
    await prisma.$disconnect();
    console.log('🎉 tokenNo column addition completed!');
    
  } catch (error) {
    console.error('❌ Error adding tokenNo column:', error.message);
    process.exit(1);
  }
}

// Run the fix
addTokenNoColumn();
