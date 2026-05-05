import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTransactionsTable() {
  console.log('🔍 Checking lowercase transactions table...');
  
  try {
    // Check columns in lowercase transactions table
    console.log('📋 Columns in lowercase transactions table:');
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position
    `;
    
    if (columns.length === 0) {
      console.log('❌ Lowercase transactions table does not exist');
    } else {
      console.log(`📊 Found ${columns.length} columns in lowercase transactions table:`);
      columns.forEach((column: any, index: number) => {
        console.log(`  ${index + 1}. ${column.column_name} (${column.data_type}, ${column.is_nullable})`);
      });
      
      // Check if tokenNo column exists in lowercase table
      const tokenNoColumn = columns.find((col: any) => col.column_name === 'tokenNo');
      console.log('🔍 tokenNo column in lowercase table:', tokenNoColumn ? 'YES' : 'NO');
      
      // Check data in lowercase table
      const dataCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM transactions`;
      console.log('📊 Records in lowercase table:', dataCount[0].count);
    }
    
    // Also check uppercase Transaction table data
    console.log('\n📋 Checking uppercase Transaction table data:');
    const upperDataCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Transaction"`;
    console.log('📊 Records in uppercase Transaction table:', upperDataCount[0].count);
    
    console.log('🎉 Transactions table check completed!');
    
  } catch (error) {
    console.error('❌ Error checking transactions table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkTransactionsTable()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
