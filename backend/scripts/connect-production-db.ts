// Connect to production database to check schema and data
const { PrismaClient } = require('@prisma/client');

// Production database URL from your .env file
const PRODUCTION_DB_URL = "postgresql://hawala_app_user:9chSW4fI8jswE6Kpy9c8CqWb2b8LQXHd@dpg-d7oru8dckfvc73frmhv0-a.oregon-postgres.render.com/hawala_app";

async function connectToProductionDB() {
  console.log('🔗 Connecting to production database...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: PRODUCTION_DB_URL
        }
      }
    });
    
    console.log('✅ Connected to production database');
    
    // Check what tables exist
    console.log('🔍 Checking available tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📊 Available tables:', tables.map(t => t.table_name));
    
    // Check specifically for Transaction tables
    const transactionTables = tables.filter(t => 
      t.table_name.toLowerCase().includes('transaction')
    );
    console.log('📊 Transaction-related tables:', transactionTables.map(t => t.table_name));
    
    // Check schema of Transaction table
    if (transactionTables.length > 0) {
      const tableName = transactionTables[0].table_name;
      console.log(`🔍 Checking schema for table: ${tableName}`);
      
      const schema = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
        ORDER BY ordinal_position
      `;
      
      console.log('📊 Table schema:');
      schema.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
      
      // Check data count
      const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "${tableName}"`;
      console.log(`📊 Records in ${tableName}:`, count[0].count);
      
      // Get sample records
      const sample = await prisma.$queryRaw`SELECT * FROM "${tableName}" LIMIT 3`;
      console.log('📊 Sample records:');
      sample.forEach((record, index) => {
        console.log(`  Record ${index + 1}:`, record);
      });
    }
    
    await prisma.$disconnect();
    console.log('🎉 Production database analysis completed!');
    
  } catch (error) {
    console.error('❌ Error connecting to production database:', error.message);
    process.exit(1);
  }
}

// Run the connection
connectToProductionDB();
