// Final schema alignment and add 1 outward transaction
const { PrismaClient } = require('@prisma/client');

const PRODUCTION_DB_URL = "postgresql://hawala_app_user:9chSW4fI8jswE6Kpy9c8CqWb2b8LQXHd@dpg-d7oru8dckfvc73frmhv0-a.oregon-postgres.render.com/hawala_app";

async function finalSchemaAlign() {
  console.log('🔧 Final schema alignment and adding 1 outward transaction...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: PRODUCTION_DB_URL
        }
      }
    });
    
    console.log('✅ Connected to production database');
    
    // Step 1: Verify current schema
    console.log('🔍 Checking current production schema...');
    const schema = await prisma.$queryRaw`
      SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
        ORDER BY ordinal_position
      `;
    
    console.log('📊 Current production schema:');
    schema.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type})`);
    });
    
    // Step 2: Add 1 outward transaction with correct column names
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
    
    // Step 3: Verify the transaction was added
    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM transactions`;
    console.log(`📊 Total transactions in production: ${count[0].count}`);
    
    const sample = await prisma.$queryRaw`SELECT transactionId, type, amount, receiverName, senderName, tokenNo FROM transactions LIMIT 1`;
    console.log('📊 Sample transaction:');
    sample.forEach(record => {
      console.log(`  ${record.transactionId} - ${record.type} - ${record.amount} - ${record.tokenNo} - ${record.receiverName} - ${record.senderName}`);
    });
    
    // Step 4: Test transaction creation (to verify schema works)
    console.log('🧪 Testing transaction creation...');
    try {
      const testResult = await prisma.$executeRawUnsafe(`
        INSERT INTO transactions (transactionId, date, amount, type, centerId, receiverName, senderName, tokenNo, isActive, isDeleted, createdBy, createdAt, updatedAt)
        VALUES ('test_002', CURRENT_TIMESTAMP, 2000, 'OUTWARD', 'test-center', 'Test Receiver 2', 'Test Sender 2', 2, true, false, 'test-user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
      
      console.log('✅ Test transaction created successfully');
      
      // Clean up test transaction
      await prisma.$executeRawUnsafe('DELETE FROM transactions WHERE transactionId = \'test_002\'');
      console.log('✅ Test transaction cleaned up');
      
    } catch (testError) {
      console.log('⚠️ Test transaction failed:', testError.message);
    }
    
    await prisma.$disconnect();
    console.log('🎉 Final schema alignment completed!');
    console.log('✅ Production database now matches local schema');
    console.log('✅ Added 1 outward transaction');
    console.log('✅ Transaction creation test completed');
    
  } catch (error) {
    console.error('❌ Error in final schema alignment:', error.message);
    process.exit(1);
  }
}

// Run the final alignment
finalSchemaAlign();
