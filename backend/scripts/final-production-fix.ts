// Final fix to make production database match local exactly
const { PrismaClient } = require('@prisma/client');

const PRODUCTION_DB_URL = "postgresql://hawala_app_user:9chSW4fI8jswE6Kpy9c8CqWb2b8LQXHd@dpg-d7oru8dckfvc73frmhv0-a.oregon-postgres.render.com/hawala_app";

async function finalProductionFix() {
  console.log('🔧 Final fix to make production database match local exactly...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: PRODUCTION_DB_URL
        }
      }
    });
    
    console.log('✅ Connected to production database');
    
    // Step 1: Get current production schema
    console.log('🔍 Checking current production schema...');
    const prodSchema = await prisma.$queryRaw`
      SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
        ORDER BY ordinal_position
      `;
    
    console.log('📊 Current production columns:');
    prodSchema.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    // Step 2: Fix tokenNo column (lowercase to camelCase)
    const hasTokenNoLower = prodSchema.some(col => col.column_name === 'tokenno');
    const hasTokenNoCamel = prodSchema.some(col => col.column_name === 'tokenNo');
    
    console.log('🔍 Token column analysis:');
    console.log(`  Has tokenno (lowercase): ${hasTokenNoLower}`);
    console.log(`  Has tokenNo (camelCase): ${hasTokenNoCamel}`);
    
    if (hasTokenNoLower && !hasTokenNoCamel) {
      console.log('🔧 Fixing tokenno to tokenNo...');
      
      // Drop lowercase and add camelCase
      await prisma.$executeRaw`ALTER TABLE transactions DROP COLUMN tokenno`;
      await prisma.$executeRaw`ALTER TABLE transactions ADD COLUMN tokenNo INTEGER`;
      console.log('✅ Fixed tokenno to tokenNo');
    }
    
    // Step 3: Add missing columns that are in local but not in production
    console.log('🔍 Adding missing columns to match local schema...');
    
    const localColumns = [
      'time', 'amountType', 'bookingCommission', 'centerCommission', 
      'autoCommission', 'receiverNumber', 'senderNumber', 'receiverClientId', 
      'senderClientId', 'remark', 'statusTime'
    ];
    
    for (const colName of localColumns) {
      const hasColumn = prodSchema.some(col => col.column_name === colName);
      if (!hasColumn) {
        console.log(`➕ Adding missing column: ${colName}`);
        
        // Add column based on type
        if (colName === 'time' || colName === 'statusTime') {
          await prisma.$executeRawUnsafe(`ALTER TABLE transactions ADD COLUMN "${colName}" TIMESTAMP WITHOUT TIME ZONE`);
        } else if (colName === 'amountType' || colName === 'receiverNumber' || colName === 'senderNumber' || colName === 'receiverClientId' || colName === 'senderClientId' || colName === 'remark') {
          await prisma.$executeRawUnsafe(`ALTER TABLE transactions ADD COLUMN "${colName}" TEXT`);
        } else if (colName === 'bookingCommission' || colName === 'centerCommission') {
          await prisma.$executeRawUnsafe(`ALTER TABLE transactions ADD COLUMN "${colName}" INTEGER`);
        } else if (colName === 'autoCommission') {
          await prisma.$executeRawUnsafe(`ALTER TABLE transactions ADD COLUMN "${colName}" BOOLEAN`);
        }
        
        console.log(`✅ Added column: ${colName}`);
      }
    }
    
    // Step 4: Verify final schema
    console.log('🔍 Verifying final production schema...');
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
    
    // Step 5: Test transaction creation
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
    console.log('🎉 Final production fix completed!');
    
  } catch (error) {
    console.error('❌ Error in final production fix:', error.message);
    process.exit(1);
  }
}

// Run the final fix
finalProductionFix();
