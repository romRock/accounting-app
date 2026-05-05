// Check exact schema of production transactions table
const { PrismaClient } = require('@prisma/client');

const PRODUCTION_DB_URL = "postgresql://hawala_app_user:9chSW4fI8jswE6Kpy9c8CqWb2b8LQXHd@dpg-d7oru8dckfvc73frmhv0-a.oregon-postgres.render.com/hawala_app";

async function checkProductionSchema() {
  console.log('🔍 Checking production transactions table schema...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: PRODUCTION_DB_URL
        }
      }
    });
    
    console.log('✅ Connected to production database');
    
    // Get exact schema of transactions table
    const schema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
        ORDER BY ordinal_position
      `;
    
    console.log('📊 Production transactions table schema:');
    schema.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Get sample data to see structure
    const sampleData = await prisma.$queryRaw`SELECT * FROM transactions LIMIT 2`;
    console.log('📊 Sample data structure:');
    sampleData.forEach((record, index) => {
      console.log(`  Record ${index + 1}:`, Object.keys(record));
    });
    
    // Check if transactionId column exists
    const hasTransactionId = schema.some(col => col.column_name.toLowerCase() === 'transactionid');
    const hasTransactionIdCaps = schema.some(col => col.column_name === 'transactionId');
    
    console.log('🔍 Column analysis:');
    console.log(`  Has transactionid (lowercase): ${hasTransactionId}`);
    console.log(`  Has transactionId (uppercase): ${hasTransactionIdCaps}`);
    
    await prisma.$disconnect();
    console.log('🎉 Production schema check completed!');
    
  } catch (error) {
    console.error('❌ Error checking production schema:', error.message);
    process.exit(1);
  }
}

// Run schema check
checkProductionSchema();
