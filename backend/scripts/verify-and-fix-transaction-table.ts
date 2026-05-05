import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAndFixTransactionTable() {
  console.log('🔍 Verifying and fixing transaction table issues...');
  
  try {
    // Step 1: Check current database state
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name = 'Transaction' OR table_name = 'transactions')
      ORDER BY table_name
    `;
    
    console.log('📊 Current transaction tables:');
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Step 2: Check uppercase table schema
    const uppercaseSchema = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Transaction'
      ORDER BY ordinal_position
    `;
    
    console.log('📊 Uppercase Transaction table schema:');
    uppercaseSchema.forEach((col: any, index: number) => {
      console.log(`  ${index + 1}. ${col.column_name} (${col.data_type})`);
    });
    
    // Check tokenNo column specifically
    const tokenNoColumn = uppercaseSchema.find((col: any) => col.column_name === 'tokenNo');
    console.log('🔍 tokenNo column exists:', tokenNoColumn ? 'YES' : 'NO');
    
    // Step 3: Test Prisma client connection to uppercase table
    console.log('🧪 Testing Prisma client connection to uppercase table...');
    try {
      const testQuery = await prisma.transaction.findFirst({
        select: {
          id: true,
          transactionId: true,
          tokenNo: true,
          date: true,
          amount: true
        }
      });
      
      console.log('✅ Prisma client successfully connects to uppercase table');
      console.log('📊 Sample data:', testQuery ? 'FOUND' : 'EMPTY');
      
      if (testQuery) {
        console.log('📊 Sample record:');
        console.log(`  ID: ${testQuery.id}`);
        console.log(`  Transaction ID: ${testQuery.transactionId}`);
        console.log(`  Token No: ${testQuery.tokenNo}`);
        console.log(`  Date: ${testQuery.date}`);
        console.log(`  Amount: ${testQuery.amount}`);
      }
      
    } catch (prismaError) {
      console.error('❌ Prisma client error:', prismaError);
      
      // If Prisma client fails, try direct SQL query
      console.log('🔄 Testing direct SQL query to uppercase table...');
      const directQuery = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Transaction"`;
      console.log('✅ Direct SQL query successful:', directQuery[0].count, 'records');
      
      console.log('💡 Issue: Prisma client is still cached with old schema');
      console.log('🔧 Solution: Need to restart backend or clear Prisma cache');
    }
    
    // Step 4: Check data count
    const dataCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Transaction"`;
    console.log('📊 Records in uppercase Transaction table:', dataCount[0].count);
    
    console.log('🎉 Transaction table verification completed!');
    
  } catch (error) {
    console.error('❌ Error verifying transaction table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyAndFixTransactionTable()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
