import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseProductionDB() {
  console.log('🔍 Diagnosing production database connection...');
  
  try {
    // Check database connection
    console.log('📊 Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    
    // Check DATABASE_URL
    console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    console.log('🔗 DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
    
    // List all tables in the database
    console.log('📋 Listing all tables in database...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📊 Tables found:', tables.length);
    tables.forEach((table: any, index: number) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });
    
    // Check specifically for Transaction table
    const transactionTable = tables.find((table: any) => table.table_name === 'Transaction');
    console.log('🔍 Transaction table found:', transactionTable ? 'YES' : 'NO');
    
    if (transactionTable) {
      // Check columns in Transaction table
      console.log('📋 Columns in Transaction table:');
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'Transaction'
        ORDER BY ordinal_position
      `;
      
      columns.forEach((column: any) => {
        console.log(`  - ${column.column_name} (${column.data_type}, ${column.is_nullable})`);
      });
      
      // Check if tokenNo column exists
      const tokenNoColumn = columns.find((col: any) => col.column_name === 'tokenNo');
      console.log('🔍 tokenNo column found:', tokenNoColumn ? 'YES' : 'NO');
    }
    
    console.log('🎉 Database diagnosis completed!');
    
  } catch (error) {
    console.error('❌ Error diagnosing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the diagnosis
diagnoseProductionDB()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
