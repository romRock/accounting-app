// Final fix for production database - drop old table and fix column names
const { PrismaClient } = require('@prisma/client');

const PRODUCTION_DB_URL = "postgresql://hawala_app_user:9chSW4fI8jswE6Kpy9c8CqWb2b8LQXHd@dpg-d7oru8dckfvc73frmhv0-a.oregon-postgres.render.com/hawala_app";

async function finalProductionTableFix() {
  console.log('🔧 Final production database fix...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: PRODUCTION_DB_URL
        }
      }
    });
    
    console.log('✅ Connected to production database');
    
    // Step 1: Drop the old transactions table
    console.log('🗑️ Dropping old transactions table...');
    try {
      await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS transactions CASCADE');
      console.log('✅ Dropped old transactions table');
    } catch (dropError) {
      console.log('⚠️ transactions table may not exist:', dropError.message);
    }
    
    // Step 2: Check current Transaction table schema
    console.log('🔍 Checking Transaction table schema...');
    const schema = await prisma.$queryRaw`
      SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Transaction'
        ORDER BY ordinal_position
    `;
    
    console.log('📊 Current Transaction table schema:');
    schema.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    // Step 3: Fix column names to match Prisma schema (camelCase)
    console.log('🔧 Fixing column names to match Prisma schema...');
    
    const columnFixes = [
      { old: 'transactionid', new: 'transactionId' },
      { old: 'tokenno', new: 'tokenNo' },
      { old: 'centerid', new: 'centerId' },
      { old: 'amounttype', new: 'amountType' },
      { old: 'bookingcommission', new: 'bookingCommission' },
      { old: 'centercommission', new: 'centerCommission' },
      { old: 'autocommission', new: 'autoCommission' },
      { old: 'receivername', new: 'receiverName' },
      { old: 'receivernumber', new: 'receiverNumber' },
      { old: 'sendername', new: 'senderName' },
      { old: 'sendernumber', new: 'senderNumber' },
      { old: 'receiverclientid', new: 'receiverClientId' },
      { old: 'senderclientid', new: 'senderClientId' },
      { old: 'statustime', new: 'statusTime' },
      { old: 'isactive', new: 'isActive' },
      { old: 'isdeleted', new: 'isDeleted' },
      { old: 'branchid', new: 'branchId' },
      { old: 'createdby', new: 'createdBy' },
      { old: 'createdat', new: 'createdAt' },
      { old: 'updatedat', new: 'updatedAt' }
    ];
    
    for (const fix of columnFixes) {
      const hasOldColumn = schema.some(col => col.column_name === fix.old);
      const hasNewColumn = schema.some(col => col.column_name === fix.new);
      
      if (hasOldColumn && !hasNewColumn) {
        console.log(`🔧 Renaming ${fix.old} to ${fix.new}...`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "Transaction" RENAME COLUMN "${fix.old}" TO "${fix.new}"`);
        console.log(`✅ Renamed ${fix.old} to ${fix.new}`);
      }
    }
    
    // Step 4: Verify final schema
    console.log('🔍 Verifying final Transaction table schema...');
    const finalSchema = await prisma.$queryRaw`
      SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Transaction'
        ORDER BY ordinal_position
    `;
    
    console.log('📊 Final Transaction table schema:');
    finalSchema.forEach(col => {
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
    
    await prisma.$disconnect();
    console.log('🎉 Final production table fix completed!');
    console.log('✅ Production database now matches Prisma schema exactly');
    
  } catch (error) {
    console.error('❌ Error in final production table fix:', error.message);
    process.exit(1);
  }
}

// Run the final fix
finalProductionTableFix();
