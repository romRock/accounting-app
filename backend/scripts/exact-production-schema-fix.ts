// Fix production database to match local schema exactly and add 1 outward transaction
const { PrismaClient } = require('@prisma/client');

const PRODUCTION_DB_URL = "postgresql://hawala_app_user:9chSW4fI8jswE6Kpy9c8CqWb2b8LQXHd@dpg-d7oru8dckfvc73frmhv0-a.oregon-postgres.render.com/hawala_app";

async function exactProductionSchemaFix() {
  console.log('🔧 Fixing production database to match local schema exactly...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: PRODUCTION_DB_URL
        }
      }
    });
    
    console.log('✅ Connected to production database');
    
    // Step 1: Clear all data from transactions table
    console.log('🗑️ Clearing all data from production transactions table...');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE transactions CASCADE');
    console.log('✅ Cleared all transaction data');
    
    // Step 2: Drop all existing columns to start fresh
    console.log('🗑️ Dropping all existing columns...');
    const existingColumns = [
      'fromCityId', 'toCityId', 'partyId', 'paymentType', 'referenceId', 'notes', 'status', 'tokenno'
    ];
    
    for (const col of existingColumns) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE transactions DROP COLUMN IF EXISTS "${col}"`);
        console.log(`✅ Dropped column: ${col}`);
      } catch (dropError) {
        console.log(`⚠️ Column ${col} may not exist: ${dropError.message}`);
      }
    }
    
    // Step 3: Add columns in exact local database order
    console.log('➕ Adding columns in exact local database order...');
    
    const localSchemaColumns = [
      { name: 'tokenNo', type: 'INTEGER' },
      { name: 'time', type: 'TIMESTAMP WITHOUT TIME ZONE' },
      { name: 'amountType', type: 'TEXT' },
      { name: 'bookingCommission', type: 'INTEGER' },
      { name: 'centerCommission', type: 'INTEGER' },
      { name: 'autoCommission', type: 'BOOLEAN' },
      { name: 'receiverNumber', type: 'TEXT' },
      { name: 'senderNumber', type: 'TEXT' },
      { name: 'receiverClientId', type: 'TEXT' },
      { name: 'senderClientId', type: 'TEXT' },
      { name: 'remark', type: 'TEXT' },
      { name: 'statusTime', type: 'TIMESTAMP WITHOUT TIME ZONE' }
    ];
    
    for (const col of localSchemaColumns) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE transactions ADD COLUMN "${col.name}" ${col.type}`);
        console.log(`✅ Added column: ${col.name} (${col.type})`);
      } catch (addError) {
        console.log(`⚠️ Column ${col.name} may already exist: ${addError.message}`);
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
    
    console.log('📊 Final production schema:');
    finalSchema.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    // Step 5: Add 1 outward transaction
    console.log('➕ Adding 1 outward transaction...');
    
    const outwardTransaction = {
      id: 'outward_test_001',
      transactionId: 'book_001',
      tokenNo: 1,
      date: new Date('2026-05-05'),
      time: new Date('2026-05-05 17:30:00'),
      centerId: 'test_center_001',
      amount: 1000,
      amountType: 'CASH',
      commission: 10,
      bookingCommission: 4,
      centerCommission: 6,
      autoCommission: true,
      receiverName: 'Test Receiver',
      receiverNumber: '+1234567890',
      senderName: 'Test Sender',
      senderNumber: '+0987654321',
      receiverClientId: 'client_001',
      senderClientId: 'client_002',
      remark: 'Test outward transaction',
      status: true,
      statusTime: new Date('2026-05-05 17:30:00'),
      type: 'OUTWARD',
      isActive: true,
      isDeleted: false,
      branchId: 'branch_001',
      createdBy: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO transactions (
        id, transactionId, tokenNo, date, time, centerId, amount, amountType,
        commission, bookingCommission, centerCommission, autoCommission,
        receiverName, receiverNumber, senderName, senderNumber,
        receiverClientId, senderClientId, remark, status, statusTime,
        type, isActive, isDeleted, branchId, createdBy, createdAt, updatedAt
      ) VALUES (
        '${outwardTransaction.id}', '${outwardTransaction.transactionId}', ${outwardTransaction.tokenNo},
        '${outwardTransaction.date.toISOString()}', '${outwardTransaction.time.toISOString()}',
        '${outwardTransaction.centerId}', ${outwardTransaction.amount}, '${outwardTransaction.amountType}',
        ${outwardTransaction.commission}, ${outwardTransaction.bookingCommission}, ${outwardTransaction.centerCommission},
        ${outwardTransaction.autoCommission},
        '${outwardTransaction.receiverName}', '${outwardTransaction.receiverNumber}',
        '${outwardTransaction.senderName}', '${outwardTransaction.senderNumber}',
        '${outwardTransaction.receiverClientId}', '${outwardTransaction.senderClientId}',
        '${outwardTransaction.remark}', ${outwardTransaction.status},
        '${outwardTransaction.statusTime.toISOString()}',
        '${outwardTransaction.type}', ${outwardTransaction.isActive}, ${outwardTransaction.isDeleted},
        '${outwardTransaction.branchId}', '${outwardTransaction.createdBy}',
        '${outwardTransaction.createdAt.toISOString()}', '${outwardTransaction.updatedAt.toISOString()}'
      )
    `);
    
    console.log('✅ Added 1 outward transaction successfully');
    
    // Step 6: Verify the transaction was added
    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM transactions`;
    console.log(`📊 Total transactions in production: ${count[0].count}`);
    
    const sample = await prisma.$queryRaw`SELECT transactionId, type, amount, receiverName, senderName FROM transactions LIMIT 1`;
    console.log('📊 Sample transaction:');
    sample.forEach(record => {
      console.log(`  ${record.transactionId} - ${record.type} - ${record.amount} - ${record.receiverName} - ${record.senderName}`);
    });
    
    await prisma.$disconnect();
    console.log('🎉 Production database schema fix completed!');
    console.log('✅ Production now matches local schema exactly');
    console.log('✅ Added 1 outward transaction');
    
  } catch (error) {
    console.error('❌ Error in production schema fix:', error.message);
    process.exit(1);
  }
}

// Run the fix
exactProductionSchemaFix();
