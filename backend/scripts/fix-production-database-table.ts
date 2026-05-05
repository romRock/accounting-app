// Fix production database to use uppercase Transaction table
const { PrismaClient } = require('@prisma/client');

const PRODUCTION_DB_URL = "postgresql://hawala_app_user:9chSW4fI8jswE6Kpy9c8CqWb2b8LQXHd@dpg-d7oru8dckfvc73frmhv0-a.oregon-postgres.render.com/hawala_app";

async function fixProductionDatabase() {
  console.log('🔧 Fixing production database table structure...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: PRODUCTION_DB_URL
        }
      }
    });
    
    console.log('✅ Connected to production database');
    
    // Step 1: Check current state
    console.log('🔍 Checking current table state...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name ILIKE '%ransaction%'
      ORDER BY table_name
    `;
    
    console.log('📊 Current transaction tables:', tables.map(t => t.table_name));
    
    const hasLowercase = tables.some(t => t.table_name === 'transactions');
    const hasUppercase = tables.some(t => t.table_name === 'Transaction');
    
    console.log('📊 Has lowercase transactions:', hasLowercase);
    console.log('📊 Has uppercase Transaction:', hasUppercase);
    
    if (hasLowercase && !hasUppercase) {
      console.log('🔧 Creating uppercase Transaction table...');
      
      // Step 2: Create uppercase Transaction table
      await prisma.$executeRaw`
        CREATE TABLE "Transaction" (
          id TEXT PRIMARY KEY,
          transactionId TEXT UNIQUE,
          tokenNo INTEGER,
          date TIMESTAMP WITHOUT TIME ZONE,
          time TIMESTAMP WITHOUT TIME ZONE,
          centerId TEXT,
          amount INTEGER,
          amountType TEXT,
          commission INTEGER,
          bookingCommission INTEGER,
          centerCommission INTEGER,
          autoCommission BOOLEAN,
          receiverName TEXT,
          receiverNumber TEXT,
          senderName TEXT,
          senderNumber TEXT,
          receiverClientId TEXT,
          senderClientId TEXT,
          remark TEXT,
          status BOOLEAN,
          statusTime TIMESTAMP WITHOUT TIME ZONE,
          type TEXT,
          isActive BOOLEAN DEFAULT true,
          isDeleted BOOLEAN DEFAULT false,
          branchId TEXT,
          createdBy TEXT,
          createdAt TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      console.log('✅ Created uppercase Transaction table');
      
      // Step 3: Migrate data from lowercase to uppercase
      console.log('🔄 Migrating data from transactions to Transaction...');
      
      const migrateResult = await prisma.$executeRaw`
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
      
      console.log('✅ Migrated data:', migrateResult.rowCount || 0, 'records');
      
      // Step 4: Drop lowercase table
      console.log('🗑️ Dropping lowercase transactions table...');
      await prisma.$executeRaw`DROP TABLE transactions`;
      console.log('✅ Dropped lowercase transactions table');
      
      // Step 5: Verify final state
      const finalTables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name ILIKE '%ransaction%'
        ORDER BY table_name
      `;
      
      console.log('📊 Final transaction tables:', finalTables.map(t => t.table_name));
      
      const finalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Transaction"`;
      console.log('📊 Records in Transaction table:', finalCount[0].count);
      
    } else if (hasUppercase) {
      console.log('✅ Uppercase Transaction table already exists');
    } else {
      console.log('⚠️ Unexpected database state');
    }
    
    await prisma.$disconnect();
    console.log('🎉 Production database fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing production database:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixProductionDatabase();
