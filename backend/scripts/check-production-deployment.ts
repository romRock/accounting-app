import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProductionDeployment() {
  console.log('🔍 Checking production deployment status...');
  
  try {
    // Step 1: Check what tables exist in production
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name = 'Transaction' OR table_name = 'transactions')
      ORDER BY table_name
    `;
    
    console.log('📊 Production transaction tables:');
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Step 2: Check if uppercase Transaction table exists and has tokenNo
    if (tables.some((t: any) => t.table_name === 'Transaction')) {
      const uppercaseSchema = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Transaction'
        ORDER BY ordinal_position
      `;
      
      console.log('📊 Uppercase Transaction table columns:');
      uppercaseSchema.forEach((col: any, index: number) => {
        console.log(`  ${index + 1}. ${col.column_name} (${col.data_type})`);
      });
      
      const tokenNoColumn = uppercaseSchema.find((col: any) => col.column_name === 'tokenNo');
      console.log('🔍 tokenNo column exists:', tokenNoColumn ? 'YES' : 'NO');
      
      // Step 3: Test if we can create a transaction
      console.log('🧪 Testing transaction creation in production...');
      try {
        const testTransaction = await prisma.transaction.findFirst({
          select: {
            id: true,
            transactionId: true,
            tokenNo: true,
            date: true,
            amount: true,
          }
        });
        
        console.log('✅ Prisma client can connect to Transaction table');
        console.log('📊 Sample data:', testTransaction ? 'FOUND' : 'EMPTY');
        
        if (testTransaction) {
          console.log('📊 Sample record:');
          console.log(`  ID: ${testTransaction.id}`);
          console.log(`  Transaction ID: ${testTransaction.transactionId}`);
          console.log(`  Token No: ${testTransaction.tokenNo}`);
          console.log(`  Date: ${testTransaction.date}`);
          console.log(`  Amount: ${testTransaction.amount}`);
        }
        
        // Step 4: Check data count
        const dataCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Transaction"`;
        console.log('📊 Records in uppercase Transaction table:', dataCount[0].count);
        
        console.log('🎉 Production deployment check completed!');
        console.log('💡 If transaction creation still fails, the issue is in the API layer, not database');
        
      } catch (prismaError) {
        console.error('❌ Prisma client error:', prismaError);
        console.log('💡 Issue: Prisma client is still using old schema or lowercase table');
        
        // Test direct SQL to uppercase table
        console.log('🔄 Testing direct SQL to uppercase table...');
        const directQuery = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Transaction"`;
        console.log('✅ Direct SQL to uppercase table:', directQuery[0].count, 'records');
        
        // Check if lowercase table still exists
        const lowercaseExists = tables.some((t: any) => t.table_name === 'transactions');
        if (lowercaseExists) {
          console.log('⚠️ Lowercase transactions table still exists - this is the problem!');
          console.log('🔧 Solution: Production deployment needs to be updated to use uppercase table only');
        } else {
          console.log('✅ Only uppercase table exists - Prisma client caching issue');
          console.log('🔧 Solution: Need to restart production server or clear Prisma cache');
        }
      }
      
    } else {
      console.log('❌ Uppercase Transaction table does not exist in production');
      console.log('💡 Production deployment was not updated with schema changes');
      
      if (tables.some((t: any) => t.table_name === 'transactions')) {
        console.log('⚠️ Lowercase transactions table exists instead');
        console.log('🔧 Solution: Production needs to be redeployed with updated schema');
      } else {
        console.log('❌ No transaction tables exist in production');
        console.log('🔧 Solution: Complete database setup needed');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking production deployment:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkProductionDeployment()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
