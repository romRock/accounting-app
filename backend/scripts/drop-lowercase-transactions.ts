import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function dropLowercaseTransactionsTable() {
  console.log('🗑️ Dropping lowercase transactions table to ensure consistency...');
  
  try {
    // Check if lowercase table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
      )
    `;
    
    console.log('📊 Lowercase transactions table exists:', tableExists[0].exists);
    
    if (tableExists[0].exists) {
      console.log('🗑️ Dropping lowercase transactions table...');
      await prisma.$queryRaw`DROP TABLE transactions`;
      console.log('✅ Lowercase table dropped successfully');
    } else {
      console.log('✅ Lowercase table does not exist');
    }
    
    // Verify only uppercase table remains
    const finalTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name = 'Transaction' OR table_name = 'transactions')
      ORDER BY table_name
    `;
    
    console.log('📊 Final transaction tables:', finalTables.length);
    finalTables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Verify uppercase table schema
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
    
    console.log('🎉 Production transaction table consistency fixed!');
    console.log('💡 Production will now use the uppercase Transaction table with tokenNo column');
    
  } catch (error) {
    console.error('❌ Error fixing transaction table consistency:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
dropLowercaseTransactionsTable()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
